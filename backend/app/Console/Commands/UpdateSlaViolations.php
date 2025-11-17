<?php

namespace App\Console\Commands;

use App\Models\Ticket;
use App\Services\SlaService;
use Illuminate\Console\Command;

class UpdateSlaViolations extends Command
{
    protected $signature = 'tickets:update-sla-violations';
    protected $description = 'Update SLA violation status for all tickets';

    public function handle(SlaService $slaService): int
    {
        $this->info('Updating SLA violations...');

        $tickets = Ticket::whereIn('status', ['open', 'in_progress', 'waiting_parts'])
            ->get();

        $violated = 0;
        foreach ($tickets as $ticket) {
            $firstResponseViolated = $slaService->isFirstResponseViolated($ticket);
            $resolutionViolated = $slaService->isResolutionViolated($ticket);
            
            $shouldBeViolated = $firstResponseViolated || $resolutionViolated;
            
            if ($ticket->sla_violated !== $shouldBeViolated) {
                $ticket->update(['sla_violated' => $shouldBeViolated]);
                $violated++;
                
                // Fire SLA violation events if newly violated
                if ($shouldBeViolated && !$ticket->sla_violated) {
                    if ($firstResponseViolated) {
                        event(new \App\Events\SlaViolated($ticket, 'first_response'));
                    }
                    if ($resolutionViolated) {
                        event(new \App\Events\SlaViolated($ticket, 'resolution'));
                    }
                }
            }
        }

        $this->info("Updated {$violated} tickets with SLA violations.");
        return Command::SUCCESS;
    }
}
