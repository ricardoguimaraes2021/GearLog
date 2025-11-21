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
        $companyId = $this->ticket->company_id;
        
        if (!$companyId) {
            \Illuminate\Support\Facades\Log::warning(
                "Ticket has no company_id, cannot notify",
                ['ticket_id' => $this->ticket->id]
            );
            return;
        }
        
        $commenter = $this->comment->user;
        $usersToNotify = collect();

        // Notify ticket opener (if not the commenter and same company)
        if ($this->ticket->openedBy && 
            $this->ticket->opened_by !== $commenter->id &&
            $this->ticket->openedBy->company_id === $companyId) {
            $usersToNotify->push($this->ticket->openedBy);
        }

        // Notify assigned user (if not the commenter, exists, and same company)
        if ($this->ticket->assignedTo && 
            $this->ticket->assigned_to !== $commenter->id &&
            $this->ticket->assignedTo->company_id === $companyId) {
            $usersToNotify->push($this->ticket->assignedTo);
        }

        // Notify all users who commented (except the current commenter)
        // Apenas da mesma empresa
        $previousCommenters = $this->ticket->comments()
            ->where('user_id', '!=', $commenter->id)
            ->with('user')
            ->get()
            ->pluck('user')
            ->filter(function ($user) use ($companyId) {
                return $user && $user->company_id === $companyId;
            })
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
