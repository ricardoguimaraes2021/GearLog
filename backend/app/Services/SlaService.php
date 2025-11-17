<?php

namespace App\Services;

use App\Models\Ticket;
use Carbon\Carbon;

class SlaService
{
    /**
     * SLA Configuration by priority
     * Format: [priority => ['first_response' => hours, 'resolution' => hours]]
     */
    private const SLA_CONFIG = [
        'critical' => [
            'first_response' => 2,    // 2 hours for first response
            'resolution' => 24,        // 24 hours for resolution
        ],
        'high' => [
            'first_response' => 4,     // 4 hours for first response
            'resolution' => 72,        // 72 hours (3 days) for resolution
        ],
        'medium' => [
            'first_response' => 8,     // 8 hours for first response
            'resolution' => 168,       // 168 hours (7 days) for resolution
        ],
        'low' => [
            'first_response' => 24,    // 24 hours for first response
            'resolution' => 336,       // 336 hours (14 days) for resolution
        ],
    ];

    /**
     * Calculate SLA deadlines for a ticket based on its priority
     */
    public function calculateDeadlines(Ticket $ticket): array
    {
        $priority = $ticket->priority;
        $config = self::SLA_CONFIG[$priority] ?? self::SLA_CONFIG['medium'];
        
        $createdAt = $ticket->created_at ?? now();
        
        return [
            'first_response_deadline' => $createdAt->copy()->addHours($config['first_response']),
            'resolution_deadline' => $createdAt->copy()->addHours($config['resolution']),
        ];
    }

    /**
     * Check if first response SLA is violated
     */
    public function isFirstResponseViolated(Ticket $ticket): bool
    {
        if ($ticket->first_response_at) {
            return false; // Already responded
        }

        if (!$ticket->first_response_deadline) {
            return false; // No deadline set
        }

        return now()->isAfter($ticket->first_response_deadline);
    }

    /**
     * Check if resolution SLA is violated
     */
    public function isResolutionViolated(Ticket $ticket): bool
    {
        if (in_array($ticket->status, ['resolved', 'closed'])) {
            return false; // Already resolved
        }

        if (!$ticket->resolution_deadline) {
            return false; // No deadline set
        }

        return now()->isAfter($ticket->resolution_deadline);
    }

    /**
     * Check if SLA is at risk (80% of time elapsed)
     */
    public function isSlaAtRisk(Ticket $ticket): array
    {
        $risks = [
            'first_response' => false,
            'resolution' => false,
        ];

        // Check first response risk
        if (!$ticket->first_response_at && $ticket->first_response_deadline) {
            $totalTime = $ticket->created_at->diffInMinutes($ticket->first_response_deadline);
            $elapsedTime = $ticket->created_at->diffInMinutes(now());
            $percentage = $totalTime > 0 ? ($elapsedTime / $totalTime) * 100 : 0;
            $risks['first_response'] = $percentage >= 80;
        }

        // Check resolution risk
        if (!in_array($ticket->status, ['resolved', 'closed']) && $ticket->resolution_deadline) {
            $totalTime = $ticket->created_at->diffInMinutes($ticket->resolution_deadline);
            $elapsedTime = $ticket->created_at->diffInMinutes(now());
            $percentage = $totalTime > 0 ? ($elapsedTime / $totalTime) * 100 : 0;
            $risks['resolution'] = $percentage >= 80;
        }

        return $risks;
    }

    /**
     * Get time remaining until deadline
     */
    public function getTimeRemaining(Ticket $ticket, string $type = 'resolution'): ?int
    {
        $deadline = $type === 'first_response' 
            ? $ticket->first_response_deadline 
            : $ticket->resolution_deadline;

        if (!$deadline) {
            return null;
        }

        $remaining = now()->diffInMinutes($deadline, false);
        return $remaining > 0 ? $remaining : 0;
    }

    /**
     * Get SLA configuration for a priority
     */
    public static function getSlaConfig(string $priority): array
    {
        return self::SLA_CONFIG[$priority] ?? self::SLA_CONFIG['medium'];
    }

    /**
     * Get all SLA configurations
     */
    public static function getAllSlaConfigs(): array
    {
        return self::SLA_CONFIG;
    }
}

