<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\TicketComment;
use App\Models\TicketLog;
use App\Services\SlaService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'Ticket Comments', description: 'Ticket comment management endpoints')]
class TicketCommentController extends Controller
{
    public function __construct(
        protected SlaService $slaService
    ) {
    }

    #[OA\Get(
        path: '/api/v1/tickets/{ticketId}/comments',
        summary: 'Get comments for a ticket',
        tags: ['Ticket Comments'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'ticketId', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'List of ticket comments',
                content: new OA\JsonContent(type: 'array', items: new OA\Items(type: 'object'))
            ),
            new OA\Response(response: 403, description: 'Unauthorized'),
        ]
    )]
    public function index(Ticket $ticket)
    {
        $this->authorize('view', $ticket);
        
        $comments = $ticket->comments()->with('user')->orderBy('created_at', 'asc')->get();
        return response()->json($comments);
    }

    #[OA\Post(
        path: '/api/v1/tickets/{ticketId}/comments',
        summary: 'Add a comment to a ticket',
        tags: ['Ticket Comments'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'ticketId', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['message'],
                properties: [
                    new OA\Property(property: 'message', type: 'string'),
                    new OA\Property(property: 'attachments', type: 'array', items: new OA\Items(type: 'string'), nullable: true),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Comment created successfully'),
            new OA\Response(response: 403, description: 'Unauthorized'),
        ]
    )]
    public function store(Request $request, Ticket $ticket)
    {
        // Authorization for creating comments is handled by TicketPolicy@update
        $this->authorize('update', $ticket);

        $validated = $request->validate([
            'message' => 'required|string',
            'attachments' => 'nullable|array',
            'attachment_files' => 'nullable',
            'attachment_files.*' => [
                'nullable',
                'file',
                'max:10240',
                'mimes:jpg,jpeg,png,gif,pdf,doc,docx,txt',
                'mimetypes:image/jpeg,image/png,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain',
            ],
        ], [
            'attachment_files.*.mimes' => 'The file must be one of the following types: JPG, JPEG, PNG, GIF, PDF, DOC, DOCX, or TXT.',
            'attachment_files.*.mimetypes' => 'The file must be one of the following types: JPG, JPEG, PNG, GIF, PDF, DOC, DOCX, or TXT.',
            'attachment_files.*.max' => 'The file size must not exceed 10MB.',
        ]);

        // Handle file uploads
        $attachmentPaths = [];
        
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
                $path = $file->store('tickets/comments', 'public');
                $attachmentPaths[] = $path;
            }
        }

        // Merge uploaded file paths with existing attachments
        $allAttachments = array_merge($validated['attachments'] ?? [], $attachmentPaths);

        $comment = $ticket->comments()->create([
            'user_id' => Auth::id(),
            'message' => $validated['message'],
            'attachments' => $allAttachments,
        ]);

        // Track first response if this is the first comment/response
        if (!$ticket->first_response_at && $ticket->opened_by !== Auth::id()) {
            $ticket->update(['first_response_at' => now()]);
        }

            TicketLog::create([
                'ticket_id' => $ticket->id,
                'user_id' => Auth::id(),
                'action' => 'comment_added',
                'new_value' => ['comment_id' => $comment->id, 'message' => $comment->message],
            ]);

            // Fire comment event for notifications
            event(new \App\Events\TicketCommented($ticket, $comment));

            return response()->json($comment->load('user'), 201);
    }
}
