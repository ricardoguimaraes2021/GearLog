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

class TicketCommentController extends Controller
{
    public function __construct(
        protected SlaService $slaService
    ) {
    }

    public function index(Ticket $ticket)
    {
        $this->authorize('view', $ticket);
        
        $comments = $ticket->comments()->with('user')->orderBy('created_at', 'asc')->get();
        return response()->json($comments);
    }

    public function store(Request $request, Ticket $ticket)
    {
        // Authorization for creating comments is handled by TicketPolicy@update
        $this->authorize('update', $ticket);

        $validated = $request->validate([
            'message' => 'required|string',
            'attachments' => 'nullable|array',
            'attachment_files' => 'nullable|array',
            'attachment_files.*' => 'file|max:10240|mimes:jpg,jpeg,png,gif,pdf,doc,docx,txt',
        ]);

        // Handle file uploads
        $attachmentPaths = [];
        if ($request->hasFile('attachment_files')) {
            foreach ($request->file('attachment_files') as $file) {
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

        return response()->json($comment->load('user'), 201);
    }
}
