<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Product;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'Admin', description: 'Super admin endpoints for managing companies')]
class CompanyController extends Controller
{
    #[OA\Get(
        path: '/api/v1/admin/companies',
        summary: 'List all companies (Super Admin only)',
        tags: ['Admin'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'page', in: 'query', required: false, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'per_page', in: 'query', required: false, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'search', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'plan_type', in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['FREE', 'PRO', 'ENTERPRISE'])),
            new OA\Parameter(name: 'is_active', in: 'query', required: false, schema: new OA\Schema(type: 'boolean')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'List of companies',
                content: new OA\JsonContent(type: 'object')
            ),
            new OA\Response(response: 403, description: 'Unauthorized'),
        ]
    )]
    public function index(Request $request)
    {
        $query = Company::withoutGlobalScopes()
            ->withCount(['users', 'products', 'tickets', 'employees', 'departments']);

        // Search by name
        if ($request->has('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%");
        }

        // Filter by plan type
        if ($request->has('plan_type')) {
            $query->where('plan_type', $request->plan_type);
        }

        // Filter by active status
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Filter suspended companies
        if ($request->has('suspended')) {
            if ($request->boolean('suspended')) {
                $query->whereNotNull('suspended_at');
            } else {
                $query->whereNull('suspended_at');
            }
        }

        $perPage = $request->get('per_page', 15);
        $companies = $query->orderBy('created_at', 'desc')->paginate($perPage);

        // Add usage statistics and owner to each company
        $companies->getCollection()->transform(function ($company) {
            $company->usage_stats = $company->getUsageStats();
            $company->owner = $company->owner();
            return $company;
        });

        return response()->json($companies);
    }

    #[OA\Get(
        path: '/api/v1/admin/companies/{id}',
        summary: 'Get company details with full statistics (Super Admin only)',
        tags: ['Admin'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Company details with statistics',
                content: new OA\JsonContent(type: 'object')
            ),
            new OA\Response(response: 403, description: 'Unauthorized'),
            new OA\Response(response: 404, description: 'Company not found'),
        ]
    )]
    public function show($id)
    {
        $company = Company::withoutGlobalScopes()
            ->withCount(['users', 'products', 'tickets', 'employees', 'departments'])
            ->find($id);

        if (!$company) {
            return response()->json([
                'error' => 'Company not found.',
            ], 404);
        }

        // Get detailed usage statistics
        $usageStats = $company->getUsageStats();

        // Get recent activity (last 30 days)
        // Use withoutGlobalScopes to avoid filtering by authenticated user's company_id
        $recentTickets = Ticket::withoutGlobalScopes()
            ->where('company_id', $company->id)
            ->where('created_at', '>=', now()->subDays(30))
            ->count();

        // Get total value of products
        // Use withoutGlobalScopes to avoid filtering by authenticated user's company_id
        $totalProductValue = Product::withoutGlobalScopes()
            ->where('company_id', $company->id)
            ->sum(DB::raw('quantity * COALESCE(value, 0)'));

        // Get active users count
        $activeUsers = $company->users()->count();

        // Get users with their roles for role management display
        $usersWithRoles = $company->users()
            ->with('roles')
            ->select('id', 'name', 'email', 'is_owner', 'created_at')
            ->orderBy('name')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'is_owner' => $user->is_owner,
                    'roles' => $user->roles->pluck('name')->toArray(),
                    'created_at' => $user->created_at,
                ];
            });

        return response()->json([
            'company' => $company,
            'owner' => $company->owner(),
            'users_with_roles' => $usersWithRoles,
            'statistics' => [
                'usage' => $usageStats,
                'recent_tickets_30_days' => $recentTickets,
                'total_product_value' => (float) $totalProductValue,
                'active_users' => $activeUsers,
                'total_employees' => $company->employees_count ?? 0,
                'total_departments' => $company->departments_count ?? 0,
            ],
        ]);
    }

    #[OA\Post(
        path: '/api/v1/admin/companies/{id}/suspend',
        summary: 'Suspend a company (Super Admin only)',
        tags: ['Admin'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Company suspended successfully'),
            new OA\Response(response: 403, description: 'Unauthorized'),
            new OA\Response(response: 404, description: 'Company not found'),
        ]
    )]
    public function suspend($id)
    {
        $company = Company::withoutGlobalScopes()->find($id);

        if (!$company) {
            return response()->json([
                'error' => 'Company not found.',
            ], 404);
        }

        $company->update([
            'suspended_at' => now(),
            'is_active' => false,
        ]);

        Log::info('Company suspended by super admin', [
            'company_id' => $company->id,
            'company_name' => $company->name,
            'suspended_by' => auth()->id(),
        ]);

        return response()->json([
            'message' => 'Company suspended successfully.',
            'company' => $company,
        ]);
    }

    #[OA\Post(
        path: '/api/v1/admin/companies/{id}/activate',
        summary: 'Activate a company (Super Admin only)',
        tags: ['Admin'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Company activated successfully'),
            new OA\Response(response: 403, description: 'Unauthorized'),
            new OA\Response(response: 404, description: 'Company not found'),
        ]
    )]
    public function activate($id)
    {
        $company = Company::withoutGlobalScopes()->find($id);

        if (!$company) {
            return response()->json([
                'error' => 'Company not found.',
            ], 404);
        }

        $company->update([
            'suspended_at' => null,
            'is_active' => true,
        ]);

        Log::info('Company activated by super admin', [
            'company_id' => $company->id,
            'company_name' => $company->name,
            'activated_by' => auth()->id(),
        ]);

        return response()->json([
            'message' => 'Company activated successfully.',
            'company' => $company,
        ]);
    }

    #[OA\Put(
        path: '/api/v1/admin/companies/{id}/plan',
        summary: 'Update company plan (Super Admin only)',
        tags: ['Admin'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['plan_type'],
                properties: [
                    new OA\Property(property: 'plan_type', type: 'string', enum: ['FREE', 'PRO', 'ENTERPRISE']),
                    new OA\Property(property: 'max_users', type: 'integer', nullable: true),
                    new OA\Property(property: 'max_products', type: 'integer', nullable: true),
                    new OA\Property(property: 'max_tickets', type: 'integer', nullable: true),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Plan updated successfully'),
            new OA\Response(response: 403, description: 'Unauthorized'),
            new OA\Response(response: 404, description: 'Company not found'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function updatePlan(Request $request, $id)
    {
        $company = Company::withoutGlobalScopes()->find($id);

        if (!$company) {
            return response()->json([
                'error' => 'Company not found.',
            ], 404);
        }

        $validated = $request->validate([
            'plan_type' => 'required|in:FREE,PRO,ENTERPRISE',
            'max_users' => 'nullable|integer|min:1',
            'max_products' => 'nullable|integer|min:1',
            'max_tickets' => 'nullable|integer|min:1',
        ]);

        $oldPlan = $company->plan_type;
        
        $company->update($validated);

        Log::info('Company plan updated by super admin', [
            'company_id' => $company->id,
            'company_name' => $company->name,
            'old_plan' => $oldPlan,
            'new_plan' => $company->plan_type,
            'updated_by' => auth()->id(),
        ]);

        return response()->json([
            'message' => 'Plan updated successfully.',
            'company' => $company,
        ]);
    }

    #[OA\Get(
        path: '/api/v1/admin/companies/{id}/logs',
        summary: 'Get company activity logs (Super Admin only)',
        tags: ['Admin'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'page', in: 'query', required: false, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Company logs',
                content: new OA\JsonContent(type: 'object')
            ),
            new OA\Response(response: 403, description: 'Unauthorized'),
            new OA\Response(response: 404, description: 'Company not found'),
        ]
    )]
    public function logs($id, Request $request)
    {
        $company = Company::withoutGlobalScopes()->find($id);

        if (!$company) {
            return response()->json([
                'error' => 'Company not found.',
            ], 404);
        }

        // Get recent tickets, products created, users added, etc.
        // Use withoutGlobalScopes to avoid filtering by authenticated user's company_id
        $recentTickets = Ticket::withoutGlobalScopes()
            ->where('company_id', $company->id)
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get(['id', 'title', 'status', 'created_at']);

        $recentProducts = Product::withoutGlobalScopes()
            ->where('company_id', $company->id)
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get(['id', 'name', 'status', 'created_at']);

        $recentUsers = $company->users()
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get(['id', 'name', 'email', 'created_at']);

        return response()->json([
            'company_id' => $company->id,
            'company_name' => $company->name,
            'recent_activity' => [
                'tickets' => $recentTickets,
                'products' => $recentProducts,
                'users' => $recentUsers,
            ],
        ]);
    }
}
