<?php

namespace App\Events;

use App\Models\Ticket;
use App\Services\NotificationService;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TicketStatusChanged
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $ticket;
    public $oldStatus;
    public $newStatus;

    /**
     * Create a new event instance.
     */
    public function __construct(Ticket $ticket, string $oldStatus, string $newStatus)
    {
        $this->ticket = $ticket;
        $this->oldStatus = $oldStatus;
        $this->newStatus = $newStatus;
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
        
        $usersToNotify = collect();

        // Notify ticket opener (mesma empresa)
        if ($this->ticket->openedBy && $this->ticket->openedBy->company_id === $companyId) {
            $usersToNotify->push($this->ticket->openedBy);
        }

        // Notify assigned user (mesma empresa)
        if ($this->ticket->assignedTo && $this->ticket->assignedTo->company_id === $companyId) {
            $usersToNotify->push($this->ticket->assignedTo);
        }

        // Notify utilizadores que podem tratar tickets da mesma empresa
        $ticketHandlers = \App\Models\User::withoutGlobalScopes()
            ->where('company_id', $companyId)
            ->whereHas('roles', function ($query) {
                $query->whereIn('name', ['admin', 'gestor', 'tecnico']);
            })
            ->get();
            
        $usersToNotify = $usersToNotify->merge($ticketHandlers)->unique('id');

        $statusLabels = [
            'open' => 'Open',
            'in_progress' => 'In Progress',
            'waiting_parts' => 'Waiting Parts',
            'resolved' => 'Resolved',
            'closed' => 'Closed',
        ];

        $oldStatusLabel = $statusLabels[$this->oldStatus] ?? $this->oldStatus;
        $newStatusLabel = $statusLabels[$this->newStatus] ?? $this->newStatus;

        foreach ($usersToNotify as $user) {
            $notificationService->createNotification(
                $user,
                'ticket_status_changed',
                'Ticket Status Changed',
                "Ticket #{$this->ticket->id}: {$this->ticket->title} changed from {$oldStatusLabel} to {$newStatusLabel}",
                [
                    'ticket_id' => $this->ticket->id,
                    'ticket_title' => $this->ticket->title,
                    'old_status' => $this->oldStatus,
                    'new_status' => $this->newStatus,
                ]
            );
        }
    }
}
