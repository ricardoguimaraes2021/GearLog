<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\BusinessRuleException;
use App\Http\Controllers\Controller;
use App\Models\AssetAssignment;
use App\Models\Employee;
use App\Models\Product;
use App\Services\AssignmentService;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'Assignments', description: 'Asset assignment management endpoints')]
class AssignmentController extends Controller
{
    public function __construct(
        protected AssignmentService $assignmentService
    ) {
    }

    #[OA\Post(
        path: '/api/v1/assignments/checkout',
        summary: 'Checkout an asset to an employee',
        tags: ['Assignments'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['product_id', 'employee_id'],
                properties: [
                    new OA\Property(property: 'product_id', type: 'integer'),
                    new OA\Property(property: 'employee_id', type: 'integer'),
                    new OA\Property(property: 'notes', type: 'string', nullable: true),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Asset checked out successfully'),
            new OA\Response(response: 400, description: 'Business rule violation'),
            new OA\Response(response: 403, description: 'Unauthorized'),
        ]
    )]
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

    #[OA\Post(
        path: '/api/v1/assignments/{id}/checkin',
        summary: 'Checkin/return an asset from an employee',
        tags: ['Assignments'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'condition_on_return', type: 'string', nullable: true),
                    new OA\Property(property: 'product_status', type: 'string', enum: ['new', 'used', 'damaged', 'repair', 'reserved'], nullable: true),
                    new OA\Property(property: 'notes', type: 'string', nullable: true),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Asset checked in successfully'),
            new OA\Response(response: 400, description: 'Business rule violation'),
            new OA\Response(response: 403, description: 'Unauthorized'),
        ]
    )]
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

    #[OA\Get(
        path: '/api/v1/assignments/history/employee/{employeeId}',
        summary: 'Get assignment history for an employee',
        tags: ['Assignments'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'employeeId', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Paginated assignment history',
                content: new OA\JsonContent(type: 'object')
            ),
            new OA\Response(response: 403, description: 'Unauthorized'),
        ]
    )]
    public function historyByEmployee(Request $request, Employee $employee)
    {
        $request->user()->can('assignments.view') || abort(403, 'Unauthorized');

        $assignments = AssetAssignment::where('employee_id', $employee->id)
            ->with(['product.category', 'assignedBy', 'returnedBy'])
            ->orderBy('assigned_at', 'desc')
            ->paginate(20);

        return response()->json($assignments);
    }

    #[OA\Get(
        path: '/api/v1/assignments/history/asset/{productId}',
        summary: 'Get assignment history for an asset',
        tags: ['Assignments'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'productId', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Paginated assignment history',
                content: new OA\JsonContent(type: 'object')
            ),
            new OA\Response(response: 403, description: 'Unauthorized'),
        ]
    )]
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
