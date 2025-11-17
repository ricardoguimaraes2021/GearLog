<?php

namespace App\Events;

use App\Models\Ticket;
use App\Services\NotificationService;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TicketCreated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $ticket;

    /**
     * Create a new event instance.
     */
    public function __construct(Ticket $ticket)
    {
        $this->ticket = $ticket;
    }

    /**
     * Handle the event.
     */
    public function handle(NotificationService $notificationService): void
    {
        // Notify admins and managers
        $notificationService->notifyByRole(
            'admin',
            'ticket_created',
            'New Ticket Created',
            "Ticket #{$this->ticket->id}: {$this->ticket->title}",
            [
                'ticket_id' => $this->ticket->id,
                'ticket_title' => $this->ticket->title,
                'opened_by' => $this->ticket->opened_by,
            ]
        );

        $notificationService->notifyByRole(
            'gestor',
            'ticket_created',
            'New Ticket Created',
            "Ticket #{$this->ticket->id}: {$this->ticket->title}",
            [
                'ticket_id' => $this->ticket->id,
                'ticket_title' => $this->ticket->title,
                'opened_by' => $this->ticket->opened_by,
            ]
        );
    }
}
