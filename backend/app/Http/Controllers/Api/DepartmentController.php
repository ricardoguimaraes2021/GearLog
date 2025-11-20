<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\BusinessRuleException;
use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\AssetAssignment;
use App\Services\DepartmentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'Departments', description: 'Department management endpoints')]
class DepartmentController extends Controller
{
    public function __construct(
        protected DepartmentService $departmentService
    ) {
    }

    #[OA\Get(
        path: '/api/v1/departments',
        summary: 'List departments',
        tags: ['Departments'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'search', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'sort_by', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'sort_order', in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['asc', 'desc'])),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'List of departments with computed asset counts',
                content: new OA\JsonContent(type: 'array', items: new OA\Items(type: 'object'))
            ),
            new OA\Response(response: 403, description: 'Unauthorized'),
        ]
    )]
    public function index(Request $request)
    {
        // Allow view access for viewers, manage access for others
        $user = $request->user();
        if (!$user->can('departments.view') && !$user->can('departments.manage')) {
            abort(403, 'Unauthorized');
        }

        $query = Department::with(['manager', 'employees']);

        // Search
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('cost_center', 'like', "%{$search}%");
            });
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'name');
        $sortOrder = $request->get('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);

        $departments = $query->get();

        // Add computed attributes for each department
        $departments->each(function ($department) {
            $department->total_assigned_assets = $department->total_assigned_assets;
            $department->total_asset_value = $department->total_asset_value;
        });

        return response()->json($departments);
    }

    #[OA\Post(
        path: '/api/v1/departments',
        summary: 'Create a new department',
        tags: ['Departments'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['name'],
                properties: [
                    new OA\Property(property: 'name', type: 'string', maxLength: 255),
                    new OA\Property(property: 'description', type: 'string', nullable: true),
                    new OA\Property(property: 'manager_employee_id', type: 'integer', nullable: true),
                    new OA\Property(property: 'cost_center', type: 'string', nullable: true, maxLength: 255),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Department created successfully'),
            new OA\Response(response: 403, description: 'Unauthorized'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function store(Request $request)
    {
        $request->user()->can('departments.manage') || abort(403, 'Unauthorized');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'manager_employee_id' => 'nullable|exists:employees,id',
            'cost_center' => 'nullable|string|max:255',
        ]);

        try {
            $department = $this->departmentService->createDepartment($validated);
            return response()->json($department->load('manager'), 201);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'An unexpected error occurred while creating the department.',
                'message' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    #[OA\Get(
        path: '/api/v1/departments/{id}',
        summary: 'Get department details',
        tags: ['Departments'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Department details with employees and asset counts',
                content: new OA\JsonContent(type: 'object')
            ),
            new OA\Response(response: 403, description: 'Unauthorized'),
        ]
    )]
    public function show(Request $request, Department $department)
    {
        // Allow view access for viewers, manage access for others
        $user = $request->user();
        if (!$user->can('departments.view') && !$user->can('departments.manage')) {
            abort(403, 'Unauthorized');
        }

        $department->load([
            'manager',
            'employees' => function ($query) {
                $query->orderBy('name');
            },
        ]);

        // Add computed attributes
        $department->total_assigned_assets = $department->total_assigned_assets;
        $department->total_asset_value = $department->total_asset_value;

        return response()->json($department);
    }

    #[OA\Put(
        path: '/api/v1/departments/{id}',
        summary: 'Update a department',
        tags: ['Departments'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'name', type: 'string', maxLength: 255),
                    new OA\Property(property: 'description', type: 'string', nullable: true),
                    new OA\Property(property: 'manager_employee_id', type: 'integer', nullable: true),
                    new OA\Property(property: 'cost_center', type: 'string', nullable: true, maxLength: 255),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Department updated successfully'),
            new OA\Response(response: 403, description: 'Unauthorized'),
        ]
    )]
    public function update(Request $request, Department $department)
    {
        $request->user()->can('departments.manage') || abort(403, 'Unauthorized');

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'manager_employee_id' => 'nullable|exists:employees,id',
            'cost_center' => 'nullable|string|max:255',
        ]);

        try {
            $department = $this->departmentService->updateDepartment($department, $validated);
            return response()->json($department->load('manager'));
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'An unexpected error occurred while updating the department.',
                'message' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    #[OA\Delete(
        path: '/api/v1/departments/{id}',
        summary: 'Delete a department',
        tags: ['Departments'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Department deleted successfully'),
            new OA\Response(response: 400, description: 'Business rule violation'),
            new OA\Response(response: 403, description: 'Unauthorized'),
        ]
    )]
    public function destroy(Request $request, Department $department)
    {
        $request->user()->can('departments.manage') || abort(403, 'Unauthorized');

        try {
            $this->departmentService->deleteDepartment($department);
            return response()->json(['message' => 'Department deleted successfully']);
        } catch (BusinessRuleException $e) {
            return response()->json([
                'error' => $e->getUserMessage(),
                'context' => $e->getContext(),
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'An unexpected error occurred while deleting the department.',
                'message' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    #[OA\Get(
        path: '/api/v1/departments/stats/usage',
        summary: 'Get department usage statistics',
        tags: ['Departments'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Department usage statistics',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'asset_usage', type: 'array', items: new OA\Items(type: 'object')),
                        new OA\Property(property: 'ticket_usage', type: 'array', items: new OA\Items(type: 'object')),
                    ]
                )
            ),
            new OA\Response(response: 403, description: 'Unauthorized'),
        ]
    )]
    public function usageStats(Request $request)
    {
        $request->user()->can('departments.manage') || abort(403, 'Unauthorized');

        // Get asset usage by department
        $usageByDepartment = DB::table('asset_assignments')
            ->join('employees', 'asset_assignments.employee_id', '=', 'employees.id')
            ->join('departments', 'employees.department_id', '=', 'departments.id')
            ->whereNull('asset_assignments.returned_at')
            ->select(
                'departments.id',
                'departments.name',
                DB::raw('COUNT(DISTINCT asset_assignments.id) as active_assignments'),
                DB::raw('COUNT(DISTINCT asset_assignments.employee_id) as employees_with_assets'),
                DB::raw('SUM(products.value) as total_value')
            )
            ->join('products', 'asset_assignments.product_id', '=', 'products.id')
            ->groupBy('departments.id', 'departments.name')
            ->get();

        // Get ticket count by department
        $ticketsByDepartment = DB::table('tickets')
            ->join('employees', 'tickets.employee_id', '=', 'employees.id')
            ->join('departments', 'employees.department_id', '=', 'departments.id')
            ->whereIn('tickets.status', ['open', 'in_progress'])
            ->select(
                'departments.id',
                'departments.name',
                DB::raw('COUNT(tickets.id) as active_tickets')
            )
            ->groupBy('departments.id', 'departments.name')
            ->get();

        return response()->json([
            'asset_usage' => $usageByDepartment,
            'ticket_usage' => $ticketsByDepartment,
        ]);
    }
}
