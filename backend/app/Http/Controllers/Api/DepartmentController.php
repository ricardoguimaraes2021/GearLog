<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\BusinessRuleException;
use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Services\DepartmentService;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    public function __construct(
        protected DepartmentService $departmentService
    ) {
    }

    public function index(Request $request)
    {
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

        return response()->json($departments);
    }

    public function store(Request $request)
    {
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

    public function show(Department $department)
    {
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

    public function update(Request $request, Department $department)
    {
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

    public function destroy(Department $department)
    {
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
}
