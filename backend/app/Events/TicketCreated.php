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
        // Garantir que o ticket tem company_id
        $companyId = $this->ticket->company_id;
        
        if (!$companyId) {
            \Illuminate\Support\Facades\Log::warning(
                "Ticket has no company_id, cannot notify",
                ['ticket_id' => $this->ticket->id]
            );
            return;
        }
        
        // Notificar utilizadores que podem tratar tickets
        // Baseado no TicketPolicy: admin, gestor (manager), tecnico (technician)
        $notificationService->notifyTicketHandlers(
            $companyId,
            'ticket_created',
            'New Ticket Created',
            "Ticket #{$this->ticket->id}: {$this->ticket->title}",
            [
                'ticket_id' => $this->ticket->id,
                'ticket_title' => $this->ticket->title,
                'opened_by' => $this->ticket->opened_by,
                'priority' => $this->ticket->priority,
                'type' => $this->ticket->type,
            ]
        );
    }
}
