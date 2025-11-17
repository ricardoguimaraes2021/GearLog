<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\BusinessRuleException;
use App\Http\Controllers\Controller;
use App\Models\AssetAssignment;
use App\Models\Employee;
use App\Models\Product;
use App\Services\AssignmentService;
use Illuminate\Http\Request;

class AssignmentController extends Controller
{
    public function __construct(
        protected AssignmentService $assignmentService
    ) {
    }

    public function checkout(Request $request)
    {
        $request->user()->can('assignments.create') || abort(403, 'Unauthorized');

        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'employee_id' => 'required|exists:employees,id',
            'notes' => 'nullable|string',
        ]);

        try {
            $product = Product::findOrFail($validated['product_id']);
            $employee = Employee::findOrFail($validated['employee_id']);

            $assignment = $this->assignmentService->checkout($product, $employee, $validated);
            return response()->json($assignment, 201);
        } catch (BusinessRuleException $e) {
            return response()->json([
                'error' => $e->getUserMessage(),
                'context' => $e->getContext(),
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'An unexpected error occurred while assigning the asset.',
                'message' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function checkin(Request $request, AssetAssignment $assignment)
    {
        $request->user()->can('assignments.return') || abort(403, 'Unauthorized');

        $validated = $request->validate([
            'condition_on_return' => 'nullable|string',
            'product_status' => 'nullable|in:new,used,damaged,repair,reserved',
            'notes' => 'nullable|string',
        ]);

        try {
            $assignment = $this->assignmentService->checkin($assignment, $validated);
            return response()->json($assignment);
        } catch (BusinessRuleException $e) {
            return response()->json([
                'error' => $e->getUserMessage(),
                'context' => $e->getContext(),
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'An unexpected error occurred while returning the asset.',
                'message' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function historyByEmployee(Request $request, Employee $employee)
    {
        $request->user()->can('assignments.view') || abort(403, 'Unauthorized');

        $assignments = AssetAssignment::where('employee_id', $employee->id)
            ->with(['product.category', 'assignedBy', 'returnedBy'])
            ->orderBy('assigned_at', 'desc')
            ->paginate(20);

        return response()->json($assignments);
    }

    public function historyByAsset(Request $request, Product $product)
    {
        $request->user()->can('assignments.view') || abort(403, 'Unauthorized');

        $assignments = AssetAssignment::where('product_id', $product->id)
            ->with(['employee.department', 'assignedBy', 'returnedBy'])
            ->orderBy('assigned_at', 'desc')
            ->paginate(20);

        return response()->json($assignments);
    }
}
