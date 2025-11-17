<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\BusinessRuleException;
use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Services\TicketService;
use App\Services\SlaService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class TicketController extends Controller
{
    public function __construct(
        protected TicketService $ticketService,
        protected SlaService $slaService
    ) {
    }

    public function index(Request $request)
    {
        $this->authorize('viewAny', Ticket::class);
        $query = Ticket::with(['product', 'openedBy', 'assignedTo']);

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by priority
        if ($request->has('priority')) {
            $query->where('priority', $request->priority);
        }

        // Filter by type
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        // Filter by assigned_to
        if ($request->has('assigned_to')) {
            $query->where('assigned_to', $request->assigned_to);
        }

        // Filter by product_id
        if ($request->has('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        // Filter by employee_id
        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->get('employee_id'));
        }

        // Role-based filtering
        $user = Auth::user();
        if ($user && $user->hasRole('tecnico')) {
            // Technicians see assigned tickets or tickets they opened
            $query->where(function ($q) use ($user) {
                $q->where('assigned_to', $user->id)
                  ->orWhere('opened_by', $user->id);
            });
        } elseif ($user && $user->hasRole('consulta')) {
            // Consulta only sees tickets they opened
            $query->where('opened_by', $user->id);
        }

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $perPage = $request->get('per_page', 15);
        $tickets = $query->with(['product', 'employee', 'openedBy', 'assignedTo'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json($tickets);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Ticket::class);
        
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'product_id' => 'nullable|exists:products,id',
            'employee_id' => 'nullable|exists:employees,id',
            'assigned_to' => 'nullable|exists:users,id',
            'priority' => 'nullable|in:low,medium,high,critical',
            'type' => 'nullable|in:damage,maintenance,update,audit,other',
            'description' => 'required|string',
            'attachments' => 'nullable|array',
            'attachment_files' => 'nullable',
            'attachment_files.*' => 'nullable|file|max:10240|mimes:jpg,jpeg,png,gif,pdf,doc,docx,txt',
        ]);

        // Handle file uploads
        $attachmentPaths = [];
        
        // Debug: Log what we receive
        \Log::info('Ticket store - Files received', [
            'has_attachment_files' => $request->hasFile('attachment_files'),
            'has_attachment_files_array' => $request->hasFile('attachment_files[]'),
            'all_files' => array_keys($request->allFiles()),
        ]);
        
        // Check both 'attachment_files' and 'attachment_files[]' formats
        $files = [];
        if ($request->hasFile('attachment_files')) {
            $files = $request->file('attachment_files');
            if (!is_array($files)) {
                $files = [$files];
            }
        } elseif ($request->hasFile('attachment_files[]')) {
            $files = $request->file('attachment_files[]');
            if (!is_array($files)) {
                $files = [$files];
            }
        }
        
        foreach ($files as $file) {
            if ($file && $file->isValid()) {
                $path = $file->store('tickets/attachments', 'public');
                $attachmentPaths[] = $path;
                \Log::info('File stored', ['path' => $path, 'original_name' => $file->getClientOriginalName()]);
            }
        }

        // Merge uploaded file paths with existing attachments
        $validated['attachments'] = array_merge($validated['attachments'] ?? [], $attachmentPaths);

        try {
            $ticket = $this->ticketService->createTicket($validated, Auth::id());
            return response()->json($ticket, 201);
        } catch (BusinessRuleException $e) {
            // Clean up uploaded files if ticket creation fails
            foreach ($attachmentPaths as $path) {
                Storage::disk('public')->delete($path);
            }
            return response()->json([
                'error' => $e->getUserMessage(),
            ], 400);
        }
    }

    public function show(Ticket $ticket)
    {
        $this->authorize('view', $ticket);
        
        $ticket->load(['product', 'openedBy', 'assignedTo', 'comments.user', 'logs.user']);
        
        // Add SLA information
        $slaInfo = [
            'first_response_violated' => $this->slaService->isFirstResponseViolated($ticket),
            'resolution_violated' => $this->slaService->isResolutionViolated($ticket),
            'sla_at_risk' => $this->slaService->isSlaAtRisk($ticket),
            'time_remaining_first_response' => $this->slaService->getTimeRemaining($ticket, 'first_response'),
            'time_remaining_resolution' => $this->slaService->getTimeRemaining($ticket, 'resolution'),
        ];
        
        $ticketData = $ticket->toArray();
        $ticketData['sla'] = $slaInfo;
        
        return response()->json($ticketData);
    }

    public function update(Request $request, Ticket $ticket)
    {
        $this->authorize('update', $ticket);
        
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'product_id' => 'nullable|exists:products,id',
            'priority' => 'sometimes|in:low,medium,high,critical',
            'type' => 'sometimes|in:damage,maintenance,update,audit,other',
            'description' => 'sometimes|required|string',
            'attachments' => 'nullable|array',
            'attachment_files' => 'nullable',
            'attachment_files.*' => 'nullable|file|max:10240|mimes:jpg,jpeg,png,gif,pdf,doc,docx,txt',
        ]);

        // Handle file uploads
        $attachmentPaths = [];
        
        // Debug: Log what we receive
        \Log::info('Ticket update - Files received', [
            'has_attachment_files' => $request->hasFile('attachment_files'),
            'has_attachment_files_array' => $request->hasFile('attachment_files[]'),
            'all_files' => array_keys($request->allFiles()),
        ]);
        
        // Check both 'attachment_files' and 'attachment_files[]' formats
        $files = [];
        if ($request->hasFile('attachment_files')) {
            $files = $request->file('attachment_files');
            if (!is_array($files)) {
                $files = [$files];
            }
        } elseif ($request->hasFile('attachment_files[]')) {
            $files = $request->file('attachment_files[]');
            if (!is_array($files)) {
                $files = [$files];
            }
        }
        
        foreach ($files as $file) {
            if ($file && $file->isValid()) {
                $path = $file->store('tickets/attachments', 'public');
                $attachmentPaths[] = $path;
                \Log::info('File stored', ['path' => $path, 'original_name' => $file->getClientOriginalName()]);
            }
        }

        // Merge uploaded file paths with existing attachments
        $existingAttachments = $validated['attachments'] ?? $ticket->attachments ?? [];
        $validated['attachments'] = array_merge($existingAttachments, $attachmentPaths);

        try {
            $ticket = $this->ticketService->updateTicket($ticket, $validated, Auth::id());
            return response()->json($ticket);
        } catch (BusinessRuleException $e) {
            // Clean up uploaded files if update fails
            foreach ($attachmentPaths as $path) {
                Storage::disk('public')->delete($path);
            }
            return response()->json([
                'error' => $e->getUserMessage(),
            ], 400);
        }
    }

    public function destroy(Ticket $ticket)
    {
        $this->authorize('delete', $ticket);
        
        try {
            $this->ticketService->deleteTicket($ticket, Auth::id());
            return response()->json(['message' => 'Ticket deleted successfully'], 200);
        } catch (BusinessRuleException $e) {
            return response()->json([
                'error' => $e->getUserMessage(),
            ], 400);
        }
    }

    public function assign(Request $request, Ticket $ticket)
    {
        $this->authorize('assign', $ticket);

        $validated = $request->validate([
            'assigned_to' => 'nullable|exists:users,id',
        ]);

        try {
            $ticket = $this->ticketService->assignTicket($ticket, $validated['assigned_to'] ?? null, Auth::id());
            return response()->json($ticket);
        } catch (BusinessRuleException $e) {
            return response()->json([
                'error' => $e->getUserMessage(),
            ], 400);
        }
    }

    public function updateStatus(Request $request, Ticket $ticket)
    {
        $this->authorize('changeStatus', $ticket);

        $validated = $request->validate([
            'status' => 'required|in:open,in_progress,waiting_parts,resolved,closed',
            'resolution' => 'nullable|string',
        ]);

        try {
            $ticket = $this->ticketService->updateStatus(
                $ticket,
                $validated['status'],
                Auth::id(),
                $validated['resolution'] ?? null
            );
            return response()->json($ticket);
        } catch (BusinessRuleException $e) {
            return response()->json([
                'error' => $e->getUserMessage(),
            ], 400);
        }
    }

    public function resolve(Request $request, Ticket $ticket)
    {
        $this->authorize('changeStatus', $ticket);

        $validated = $request->validate([
            'resolution' => 'required|string',
        ]);

        try {
            $ticket = $this->ticketService->updateStatus(
                $ticket,
                'resolved',
                Auth::id(),
                $validated['resolution']
            );
            return response()->json($ticket);
        } catch (BusinessRuleException $e) {
            return response()->json([
                'error' => $e->getUserMessage(),
            ], 400);
        }
    }

    public function close(Request $request, Ticket $ticket)
    {
        $this->authorize('close', $ticket);

        $validated = $request->validate([
            'resolution' => 'nullable|string',
        ]);

        try {
            $ticket = $this->ticketService->updateStatus(
                $ticket,
                'closed',
                Auth::id(),
                $validated['resolution'] ?? $ticket->resolution
            );
            return response()->json($ticket);
        } catch (BusinessRuleException $e) {
            return response()->json([
                'error' => $e->getUserMessage(),
            ], 400);
        }
    }

    public function logs(Ticket $ticket)
    {
        $this->authorize('view', $ticket);
        
        $logs = $ticket->logs()->with('user')->orderBy('created_at', 'desc')->get();
        return response()->json($logs);
    }
}
