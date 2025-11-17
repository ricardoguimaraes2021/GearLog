<?php

namespace App\Events;

use App\Models\Ticket;
use App\Models\TicketComment;
use App\Services\NotificationService;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TicketCommented
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $ticket;
    public $comment;

    /**
     * Create a new event instance.
     */
    public function __construct(Ticket $ticket, TicketComment $comment)
    {
        $this->ticket = $ticket;
        $this->comment = $comment;
    }

    /**
     * Handle the event.
     */
    public function handle(): void
    {
        $notificationService = app(\App\Services\NotificationService::class);
        $commenter = $this->comment->user;
        $usersToNotify = collect();

        // Notify ticket opener (if not the commenter)
        if ($this->ticket->opened_by !== $commenter->id) {
            $usersToNotify->push($this->ticket->openedBy);
        }

        // Notify assigned user (if not the commenter and exists)
        if ($this->ticket->assigned_to && $this->ticket->assigned_to !== $commenter->id) {
            $usersToNotify->push($this->ticket->assignedTo);
        }

        // Notify all users who commented (except the current commenter)
        $previousCommenters = $this->ticket->comments()
            ->where('user_id', '!=', $commenter->id)
            ->with('user')
            ->get()
            ->pluck('user')
            ->unique('id');

        $usersToNotify = $usersToNotify->merge($previousCommenters)->unique('id');

        foreach ($usersToNotify as $user) {
            if ($user) {
                $notificationService->createNotification(
                    $user,
                    'ticket_commented',
                    'New Comment on Ticket',
                    "{$commenter->name} commented on ticket #{$this->ticket->id}: {$this->ticket->title}",
                    [
                        'ticket_id' => $this->ticket->id,
                        'ticket_title' => $this->ticket->title,
                        'comment_id' => $this->comment->id,
                        'commenter_id' => $commenter->id,
                        'commenter_name' => $commenter->name,
                    ]
                );
            }
        }
    }
}
