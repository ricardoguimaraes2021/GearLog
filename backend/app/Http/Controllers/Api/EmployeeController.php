<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\BusinessRuleException;
use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Services\EmployeeService;
use Illuminate\Http\Request;

class EmployeeController extends Controller
{
    public function __construct(
        protected EmployeeService $employeeService
    ) {
    }

    public function index(Request $request)
    {
        $request->user()->can('employees.view') || abort(403, 'Unauthorized');

        $query = Employee::with(['department']);

        // Search
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('employee_code', 'like', "%{$search}%")
                    ->orWhere('position', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->get('status'));
        }

        // Filter by department
        if ($request->has('department_id')) {
            $query->where('department_id', $request->get('department_id'));
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = $request->get('per_page', 15);
        $employees = $query->paginate($perPage);

        return response()->json($employees);
    }

    public function store(Request $request)
    {
        $request->user()->can('employees.create') || abort(403, 'Unauthorized');

        $validated = $request->validate([
            'employee_code' => 'nullable|string|unique:employees,employee_code',
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:employees,email',
            'phone' => 'nullable|string|max:20',
            'department_id' => 'nullable|exists:departments,id',
            'position' => 'required|string|max:255',
            'status' => 'sometimes|in:active,inactive',
            'notes' => 'nullable|string',
        ]);

        try {
            $employee = $this->employeeService->createEmployee($validated);
            return response()->json($employee->load('department'), 201);
        } catch (BusinessRuleException $e) {
            return response()->json([
                'error' => $e->getUserMessage(),
                'context' => $e->getContext(),
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'An unexpected error occurred while creating the employee.',
                'message' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function show(Request $request, Employee $employee)
    {
        $request->user()->can('employees.view') || abort(403, 'Unauthorized');

        $employee->load([
            'department',
            'activeAssignments.product.category',
            'assignments.product.category',
            'assignments.assignedBy',
            'assignments.returnedBy',
            'logs.user',
        ]);

        return response()->json($employee);
    }

    public function update(Request $request, Employee $employee)
    {
        $request->user()->can('employees.update') || abort(403, 'Unauthorized');

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:employees,email,' . $employee->id,
            'phone' => 'nullable|string|max:20',
            'department_id' => 'nullable|exists:departments,id',
            'position' => 'sometimes|required|string|max:255',
            'status' => 'sometimes|in:active,inactive',
            'notes' => 'nullable|string',
        ]);

        try {
            $employee = $this->employeeService->updateEmployee($employee, $validated);
            return response()->json($employee->load('department'));
        } catch (BusinessRuleException $e) {
            return response()->json([
                'error' => $e->getUserMessage(),
                'context' => $e->getContext(),
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'An unexpected error occurred while updating the employee.',
                'message' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function destroy(Request $request, Employee $employee)
    {
        $request->user()->can('employees.delete') || abort(403, 'Unauthorized');

        try {
            $this->employeeService->deleteEmployee($employee);
            return response()->json(['message' => 'Employee deleted successfully']);
        } catch (BusinessRuleException $e) {
            return response()->json([
                'error' => $e->getUserMessage(),
                'context' => $e->getContext(),
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'An unexpected error occurred while deleting the employee.',
                'message' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function deactivate(Employee $employee)
    {
        try {
            $employee = $this->employeeService->deactivateEmployee($employee);
            return response()->json($employee->load('department'));
        } catch (BusinessRuleException $e) {
            return response()->json([
                'error' => $e->getUserMessage(),
                'context' => $e->getContext(),
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'An unexpected error occurred while deactivating the employee.',
                'message' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function reactivate(Employee $employee)
    {
        try {
            $employee = $this->employeeService->reactivateEmployee($employee);
            return response()->json($employee->load('department'));
        } catch (BusinessRuleException $e) {
            return response()->json([
                'error' => $e->getUserMessage(),
                'context' => $e->getContext(),
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'An unexpected error occurred while reactivating the employee.',
                'message' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}
