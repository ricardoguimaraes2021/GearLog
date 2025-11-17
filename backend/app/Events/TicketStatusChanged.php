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
    public function handle(NotificationService $notificationService): void
    {
        $usersToNotify = collect();

        // Notify ticket opener
        if ($this->ticket->openedBy) {
            $usersToNotify->push($this->ticket->openedBy);
        }

        // Notify assigned user
        if ($this->ticket->assignedTo) {
            $usersToNotify->push($this->ticket->assignedTo);
        }

        // Notify admins and managers
        $admins = \App\Models\User::role('admin')->get();
        $managers = \App\Models\User::role('gestor')->get();
        $usersToNotify = $usersToNotify->merge($admins)->merge($managers)->unique('id');

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
