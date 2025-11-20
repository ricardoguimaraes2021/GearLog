<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\User;
use App\Models\Product;
use App\Models\Ticket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'Admin', description: 'Super admin endpoints')]
class AnalyticsController extends Controller
{
    #[OA\Get(
        path: '/api/v1/admin/analytics/global',
        summary: 'Get global analytics (Super Admin only)',
        tags: ['Admin'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(response: 200, description: 'Global analytics data'),
            new OA\Response(response: 403, description: 'Unauthorized'),
        ]
    )]
    public function global(Request $request)
    {
        // Apply filters
        $companyQuery = Company::withoutGlobalScopes();
        $userQuery = User::withoutGlobalScopes()->whereNotNull('company_id');
        $productQuery = Product::withoutGlobalScopes();
        $ticketQuery = Ticket::withoutGlobalScopes();

        // Filter by company
        if ($request->has('company_id') && $request->company_id) {
            $companyId = $request->company_id;
            $companyQuery->where('id', $companyId);
            $userQuery->where('company_id', $companyId);
            $productQuery->where('company_id', $companyId);
            $ticketQuery->where('company_id', $companyId);
        }

        // Filter by plan type
        if ($request->has('plan_type') && $request->plan_type) {
            $companyQuery->where('plan_type', $request->plan_type);
            $companyIds = Company::withoutGlobalScopes()
                ->where('plan_type', $request->plan_type)
                ->pluck('id');
            $userQuery->whereIn('company_id', $companyIds);
            $productQuery->whereIn('company_id', $companyIds);
            $ticketQuery->whereIn('company_id', $companyIds);
        }

        // Filter by role
        if ($request->has('role') && $request->role) {
            $userQuery->whereHas('roles', function ($q) use ($request) {
                $q->where('name', $request->role);
            });
        }

        // Filter by date range
        if ($request->has('date_from') && $request->date_from) {
            $dateFrom = $request->date_from;
            $userQuery->whereDate('created_at', '>=', $dateFrom);
            $ticketQuery->whereDate('created_at', '>=', $dateFrom);
        }

        if ($request->has('date_to') && $request->date_to) {
            $dateTo = $request->date_to;
            $userQuery->whereDate('created_at', '<=', $dateTo);
            $ticketQuery->whereDate('created_at', '<=', $dateTo);
        }

        // Get total companies
        $totalCompanies = $companyQuery->count();
        
        // Get total active users
        $totalActiveUsers = $userQuery->count();
        
        // Get total assets (products)
        $totalAssets = $productQuery->count();
        
        // Get total tickets
        $totalTickets = $ticketQuery->count();
        
        // Get daily active users (users who logged in today)
        $dailyActiveUsers = (clone $userQuery)
            ->whereDate('updated_at', today())
            ->count();
        
        // Get monthly active users (users active in last 30 days)
        $monthlyActiveUsers = (clone $userQuery)
            ->where('updated_at', '>=', now()->subDays(30))
            ->count();
        
        // Get plan distribution
        $planDistribution = Company::withoutGlobalScopes()
            ->select('plan_type', DB::raw('count(*) as count'))
            ->groupBy('plan_type')
            ->pluck('count', 'plan_type')
            ->toArray();
        
        // System health (mock data for now)
        $systemHealth = [
            'status' => 'healthy',
            'response_time' => 120, // ms
            'error_rate' => 0.1, // percentage
        ];
        
        return response()->json([
            'total_companies' => $totalCompanies,
            'total_active_users' => $totalActiveUsers,
            'total_assets' => $totalAssets,
            'total_tickets' => $totalTickets,
            'daily_active_users' => $dailyActiveUsers,
            'monthly_active_users' => $monthlyActiveUsers,
            'plan_distribution' => [
                'FREE' => $planDistribution['FREE'] ?? 0,
                'PRO' => $planDistribution['PRO'] ?? 0,
                'ENTERPRISE' => $planDistribution['ENTERPRISE'] ?? 0,
            ],
            'system_health' => $systemHealth,
        ]);
    }
}

