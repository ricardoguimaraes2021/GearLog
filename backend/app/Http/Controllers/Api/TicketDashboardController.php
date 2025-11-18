<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Services\SlaService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TicketDashboardController extends Controller
{
    public function __construct(
        protected SlaService $slaService
    ) {
    }

    public function index()
    {
        // Total tickets by status
        $ticketsByStatus = Ticket::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status');

        // Total tickets by priority
        $ticketsByPriority = Ticket::select('priority', DB::raw('count(*) as count'))
            ->groupBy('priority')
            ->get()
            ->pluck('count', 'priority');

        // Total tickets by type
        $ticketsByType = Ticket::select('type', DB::raw('count(*) as count'))
            ->groupBy('type')
            ->get()
            ->pluck('count', 'type');

        // Open tickets count
        $openTickets = Ticket::where('status', 'open')->count();

        // In progress tickets
        $inProgressTickets = Ticket::where('status', 'in_progress')->count();

        // Critical tickets (open or in_progress)
        $criticalTickets = Ticket::where('priority', 'critical')
            ->whereIn('status', ['open', 'in_progress'])
            ->count();

        // Tickets by assigned technician
        $ticketsByTechnician = Ticket::select('users.id', 'users.name', DB::raw('count(*) as count'))
            ->join('users', 'tickets.assigned_to', '=', 'users.id')
            ->whereNotNull('tickets.assigned_to')
            ->groupBy('users.id', 'users.name')
            ->get();

        // Unassigned tickets
        $unassignedTickets = Ticket::whereNull('assigned_to')
            ->whereIn('status', ['open', 'in_progress'])
            ->count();

        // Average resolution time (for resolved/closed tickets)
        $resolvedTickets = Ticket::whereIn('status', ['resolved', 'closed'])
            ->whereNotNull('updated_at')
            ->get();

        $averageResolutionTime = 0;
        if ($resolvedTickets->count() > 0) {
            $totalMinutes = $resolvedTickets->sum(function ($ticket) {
                return $ticket->created_at->diffInMinutes($ticket->updated_at);
            });
            $averageResolutionTime = round($totalMinutes / $resolvedTickets->count());
        }

        // Resolution rate
        $totalTickets = Ticket::count();
        $resolvedCount = Ticket::whereIn('status', ['resolved', 'closed'])->count();
        $resolutionRate = $totalTickets > 0 ? round(($resolvedCount / $totalTickets) * 100, 2) : 0;

        // Recent tickets (last 10)
        $recentTickets = Ticket::with(['product', 'openedBy', 'assignedTo'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        // Urgent tickets (critical priority, open or in_progress)
        $urgentTickets = Ticket::with(['product', 'openedBy', 'assignedTo'])
            ->where('priority', 'critical')
            ->whereIn('status', ['open', 'in_progress'])
            ->orderBy('created_at', 'desc')
            ->get();

        // Tickets by product (for damage tickets)
        $ticketsByProduct = Ticket::select('products.id', 'products.name', DB::raw('count(*) as count'))
            ->join('products', 'tickets.product_id', '=', 'products.id')
            ->where('tickets.type', 'damage')
            ->groupBy('products.id', 'products.name')
            ->orderBy('count', 'desc')
            ->limit(10)
            ->get();

            // Tickets by category (for damage tickets)
            $ticketsByCategory = Ticket::select('categories.name', DB::raw('count(*) as count'))
                ->join('products', 'tickets.product_id', '=', 'products.id')
                ->join('categories', 'products.category_id', '=', 'categories.id')
                ->where('tickets.type', 'damage')
                ->groupBy('categories.id', 'categories.name')
                ->orderBy('count', 'desc')
                ->get();

            // SLA Metrics
            $slaViolatedTickets = Ticket::where('sla_violated', true)
                ->whereIn('status', ['open', 'in_progress', 'waiting_parts'])
                ->count();

            $firstResponseViolated = Ticket::whereNull('first_response_at')
                ->whereNotNull('first_response_deadline')
                ->where('first_response_deadline', '<', now())
                ->whereIn('status', ['open', 'in_progress', 'waiting_parts'])
                ->count();

            $resolutionViolated = Ticket::whereNotIn('status', ['resolved', 'closed'])
                ->whereNotNull('resolution_deadline')
                ->where('resolution_deadline', '<', now())
                ->count();

            $slaAtRisk = Ticket::whereIn('status', ['open', 'in_progress', 'waiting_parts'])
                ->get()
                ->filter(function ($ticket) {
                    $risks = $this->slaService->isSlaAtRisk($ticket);
                    return $risks['first_response'] || $risks['resolution'];
                })
                ->count();

            // SLA Compliance Rate (tickets resolved within SLA)
            $resolvedWithinSla = Ticket::whereIn('status', ['resolved', 'closed'])
                ->whereNotNull('resolution_deadline')
                ->get()
                ->filter(function ($ticket) {
                    return $ticket->updated_at && $ticket->updated_at->lte($ticket->resolution_deadline);
                })
                ->count();

            $totalResolved = Ticket::whereIn('status', ['resolved', 'closed'])->count();
            $slaComplianceRate = $totalResolved > 0 
                ? round(($resolvedWithinSla / $totalResolved) * 100, 2) 
                : 0;

            // SLA Compliance Trend (last 30 days)
            // Use TicketLog to find when tickets were actually resolved/closed
            $complianceTrend = [];
            
            // Get all resolved/closed tickets with their resolution dates from logs
            $allResolvedTickets = Ticket::whereIn('status', ['resolved', 'closed'])
                ->whereNotNull('resolution_deadline')
                ->with('logs')
                ->get()
                ->map(function ($ticket) {
                    // Find the first log entry where status changed to resolved or closed
                    // Use the loaded relationship (logs) instead of querying again
                    $resolutionLog = $ticket->logs
                        ->whereIn('action', ['status_changed', 'resolved', 'closed'])
                        ->sortBy('created_at')
                        ->first(function ($log) {
                            if ($log->action === 'resolved' || $log->action === 'closed') {
                                return true;
                            }
                            if ($log->action === 'status_changed' && $log->new_value) {
                                $newStatus = is_array($log->new_value) 
                                    ? ($log->new_value['status'] ?? null)
                                    : (json_decode($log->new_value, true)['status'] ?? null);
                                return in_array($newStatus, ['resolved', 'closed']);
                            }
                            return false;
                        });
                    
                    return [
                        'ticket' => $ticket,
                        'resolved_at' => $resolutionLog ? $resolutionLog->created_at : $ticket->updated_at,
                    ];
                })
                ->filter(function ($item) {
                    return $item['resolved_at'] !== null;
                });
            
            // Group by date and calculate compliance
            for ($i = 29; $i >= 0; $i--) {
                $date = now()->subDays($i)->startOfDay();
                $endDate = $date->copy()->endOfDay();
                
                // Filter tickets resolved on this date
                $resolvedOnDate = $allResolvedTickets->filter(function ($item) use ($date, $endDate) {
                    $resolvedAt = \Carbon\Carbon::parse($item['resolved_at']);
                    return $resolvedAt->between($date, $endDate);
                });
                
                $resolvedWithinSlaOnDate = $resolvedOnDate->filter(function ($item) {
                    $ticket = $item['ticket'];
                    $resolvedAt = \Carbon\Carbon::parse($item['resolved_at']);
                    return $resolvedAt->lte($ticket->resolution_deadline);
                })->count();
                
                $totalResolvedOnDate = $resolvedOnDate->count();
                $complianceRate = $totalResolvedOnDate > 0 
                    ? round(($resolvedWithinSlaOnDate / $totalResolvedOnDate) * 100, 2) 
                    : null;
                
                $complianceTrend[] = [
                    'date' => $date->format('Y-m-d'),
                    'compliance_rate' => $complianceRate,
                    'total_resolved' => $totalResolvedOnDate,
                    'within_sla' => $resolvedWithinSlaOnDate,
                ];
            }

            return response()->json([
                'kpis' => [
                    'total_tickets' => $totalTickets,
                    'open_tickets' => $openTickets,
                    'in_progress_tickets' => $inProgressTickets,
                    'critical_tickets' => $criticalTickets,
                    'unassigned_tickets' => $unassignedTickets,
                    'resolved_tickets' => $resolvedCount,
                    'resolution_rate' => $resolutionRate,
                    'average_resolution_time_minutes' => $averageResolutionTime,
                    'sla_violated_tickets' => $slaViolatedTickets,
                    'first_response_violated' => $firstResponseViolated,
                    'resolution_violated' => $resolutionViolated,
                    'sla_at_risk' => $slaAtRisk,
                    'sla_compliance_rate' => $slaComplianceRate,
                ],
            'by_status' => $ticketsByStatus,
            'by_priority' => $ticketsByPriority,
            'by_type' => $ticketsByType,
            'by_technician' => $ticketsByTechnician,
            'by_product' => $ticketsByProduct,
            'by_category' => $ticketsByCategory,
            'recent_tickets' => $recentTickets,
            'urgent_tickets' => $urgentTickets,
            'compliance_trend' => $complianceTrend,
        ]);
    }
}
