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
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'Tickets', description: 'Ticket management endpoints')]
class TicketController extends Controller
{
    public function __construct(
        protected TicketService $ticketService,
        protected SlaService $slaService
    ) {
    }

    #[OA\Get(
        path: '/api/v1/tickets',
        summary: 'List tickets with filters',
        tags: ['Tickets'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'status', in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['open', 'in_progress', 'waiting_parts', 'resolved', 'closed'])),
            new OA\Parameter(name: 'priority', in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['low', 'medium', 'high', 'critical'])),
            new OA\Parameter(name: 'type', in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['damage', 'maintenance', 'update', 'audit', 'other'])),
            new OA\Parameter(name: 'assigned_to', in: 'query', required: false, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'product_id', in: 'query', required: false, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'employee_id', in: 'query', required: false, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'search', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'per_page', in: 'query', required: false, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Paginated list of tickets',
                content: new OA\JsonContent(type: 'object')
            ),
        ]
    )]
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

    #[OA\Post(
        path: '/api/v1/tickets',
        summary: 'Create a new ticket',
        tags: ['Tickets'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['title', 'description'],
                properties: [
                    new OA\Property(property: 'title', type: 'string', maxLength: 255),
                    new OA\Property(property: 'product_id', type: 'integer', nullable: true),
                    new OA\Property(property: 'employee_id', type: 'integer', nullable: true),
                    new OA\Property(property: 'assigned_to', type: 'integer', nullable: true),
                    new OA\Property(property: 'priority', type: 'string', enum: ['low', 'medium', 'high', 'critical'], nullable: true),
                    new OA\Property(property: 'type', type: 'string', enum: ['damage', 'maintenance', 'update', 'audit', 'other'], nullable: true),
                    new OA\Property(property: 'description', type: 'string'),
                    new OA\Property(property: 'attachments', type: 'array', items: new OA\Items(type: 'string'), nullable: true),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Ticket created successfully'),
            new OA\Response(response: 400, description: 'Business rule violation'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function store(Request $request)
    {
        $this->authorize('create', Ticket::class);
        
        // Check if company can create more tickets this month
        $user = $request->user();
        if ($user->company && !$user->company->canCreateTicket()) {
            return response()->json([
                'error' => 'Monthly ticket limit reached. Please upgrade your plan to create more tickets.',
            ], 403);
        }
        
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

    #[OA\Get(
        path: '/api/v1/tickets/{id}',
        summary: 'Get ticket details',
        tags: ['Tickets'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Ticket details with SLA information',
                content: new OA\JsonContent(type: 'object')
            ),
            new OA\Response(response: 403, description: 'Unauthorized'),
        ]
    )]
    public function show(Ticket $ticket)
    {
        $this->authorize('view', $ticket);
        
        $ticket->load(['product', 'employee', 'openedBy', 'assignedTo', 'comments.user', 'logs.user']);
        
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

    #[OA\Put(
        path: '/api/v1/tickets/{id}',
        summary: 'Update a ticket',
        tags: ['Tickets'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'title', type: 'string', maxLength: 255),
                    new OA\Property(property: 'product_id', type: 'integer', nullable: true),
                    new OA\Property(property: 'priority', type: 'string', enum: ['low', 'medium', 'high', 'critical']),
                    new OA\Property(property: 'type', type: 'string', enum: ['damage', 'maintenance', 'update', 'audit', 'other']),
                    new OA\Property(property: 'description', type: 'string'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Ticket updated successfully'),
            new OA\Response(response: 400, description: 'Business rule violation'),
            new OA\Response(response: 403, description: 'Unauthorized'),
        ]
    )]
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

    #[OA\Delete(
        path: '/api/v1/tickets/{id}',
        summary: 'Delete a ticket',
        tags: ['Tickets'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Ticket deleted successfully'),
            new OA\Response(response: 400, description: 'Business rule violation'),
            new OA\Response(response: 403, description: 'Unauthorized'),
        ]
    )]
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

    #[OA\Post(
        path: '/api/v1/tickets/{id}/assign',
        summary: 'Assign ticket to a technician',
        tags: ['Tickets'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'assigned_to', type: 'integer', nullable: true),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Ticket assigned successfully'),
            new OA\Response(response: 400, description: 'Business rule violation'),
            new OA\Response(response: 403, description: 'Unauthorized'),
        ]
    )]
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

    #[OA\Post(
        path: '/api/v1/tickets/{id}/status',
        summary: 'Update ticket status',
        tags: ['Tickets'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['status'],
                properties: [
                    new OA\Property(property: 'status', type: 'string', enum: ['open', 'in_progress', 'waiting_parts', 'resolved', 'closed']),
                    new OA\Property(property: 'resolution', type: 'string', nullable: true),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Status updated successfully'),
            new OA\Response(response: 400, description: 'Business rule violation'),
            new OA\Response(response: 403, description: 'Unauthorized'),
        ]
    )]
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

    #[OA\Post(
        path: '/api/v1/tickets/{id}/resolve',
        summary: 'Resolve a ticket',
        tags: ['Tickets'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['resolution'],
                properties: [
                    new OA\Property(property: 'resolution', type: 'string'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Ticket resolved successfully'),
            new OA\Response(response: 400, description: 'Business rule violation'),
            new OA\Response(response: 403, description: 'Unauthorized'),
        ]
    )]
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

    #[OA\Post(
        path: '/api/v1/tickets/{id}/close',
        summary: 'Close a ticket',
        tags: ['Tickets'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'resolution', type: 'string', nullable: true),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Ticket closed successfully'),
            new OA\Response(response: 400, description: 'Business rule violation'),
            new OA\Response(response: 403, description: 'Unauthorized'),
        ]
    )]
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

    #[OA\Get(
        path: '/api/v1/tickets/{id}/logs',
        summary: 'Get ticket activity logs',
        tags: ['Tickets'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'List of ticket activity logs',
                content: new OA\JsonContent(type: 'array', items: new OA\Items(type: 'object'))
            ),
            new OA\Response(response: 403, description: 'Unauthorized'),
        ]
    )]
    public function logs(Ticket $ticket)
    {
        $this->authorize('view', $ticket);
        
        $logs = $ticket->logs()->with('user')->orderBy('created_at', 'desc')->get();
        return response()->json($logs);
    }
}
