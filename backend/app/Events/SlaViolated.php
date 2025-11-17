<?php

namespace App\Events;

use App\Models\Ticket;
use App\Services\NotificationService;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SlaViolated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $ticket;
    public $violationType; // 'first_response' or 'resolution'

    /**
     * Create a new event instance.
     */
    public function __construct(Ticket $ticket, string $violationType)
    {
        $this->ticket = $ticket;
        $this->violationType = $violationType;
    }

    /**
     * Handle the event.
     */
    public function handle(NotificationService $notificationService): void
    {
        $usersToNotify = collect();

        // Notify admins and managers
        $admins = \App\Models\User::role('admin')->get();
        $managers = \App\Models\User::role('gestor')->get();
        $usersToNotify = $usersToNotify->merge($admins)->merge($managers);

        // Notify assigned user
        if ($this->ticket->assignedTo) {
            $usersToNotify->push($this->ticket->assignedTo);
        }

        $violationMessage = $this->violationType === 'first_response'
            ? 'First response SLA violated'
            : 'Resolution SLA violated';

        foreach ($usersToNotify->unique('id') as $user) {
            $notificationService->createNotification(
                $user,
                'sla_violated',
                '⚠️ SLA Violated',
                "Ticket #{$this->ticket->id}: {$this->ticket->title} - {$violationMessage}",
                [
                    'ticket_id' => $this->ticket->id,
                    'ticket_title' => $this->ticket->title,
                    'violation_type' => $this->violationType,
                    'priority' => $this->ticket->priority,
                ]
            );
        }
    }
}
