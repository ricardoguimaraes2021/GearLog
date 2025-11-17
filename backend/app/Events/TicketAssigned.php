<?php

namespace App\Events;

use App\Models\Ticket;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TicketAssigned
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $ticket;
    public $assignedTo;

    /**
     * Create a new event instance.
     */
    public function __construct(Ticket $ticket, ?User $assignedTo)
    {
        $this->ticket = $ticket;
        $this->assignedTo = $assignedTo;
    }

    /**
     * Handle the event.
     */
    public function handle(): void
    {
        if ($this->assignedTo) {
            $notificationService = app(\App\Services\NotificationService::class);
            $notificationService->createNotification(
                $this->assignedTo,
                'ticket_assigned',
                'Ticket Assigned to You',
                "Ticket #{$this->ticket->id}: {$this->ticket->title} has been assigned to you",
                [
                    'ticket_id' => $this->ticket->id,
                    'ticket_title' => $this->ticket->title,
                    'priority' => $this->ticket->priority,
                ]
            );
        }
    }
}
