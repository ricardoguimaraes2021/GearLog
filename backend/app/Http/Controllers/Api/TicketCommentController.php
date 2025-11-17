<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\TicketComment;
use App\Models\TicketLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TicketCommentController extends Controller
{
    public function index(Ticket $ticket)
    {
        $this->authorize('view', $ticket);
        
        $comments = $ticket->comments()->with('user')->orderBy('created_at', 'asc')->get();
        return response()->json($comments);
    }

    public function store(Request $request, Ticket $ticket)
    {
        $this->authorize('view', $ticket);

        $validated = $request->validate([
            'message' => 'required|string',
            'attachments' => 'nullable|array',
        ]);

        $comment = TicketComment::create([
            'ticket_id' => $ticket->id,
            'user_id' => Auth::id(),
            'message' => $validated['message'],
            'attachments' => $validated['attachments'] ?? [],
        ]);

        // Create log entry
        TicketLog::create([
            'ticket_id' => $ticket->id,
            'user_id' => Auth::id(),
            'action' => 'comment_added',
            'new_value' => ['comment_id' => $comment->id],
        ]);

        return response()->json($comment->load('user'), 201);
    }
}
