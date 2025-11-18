<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\BusinessRuleException;
use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\MovementService;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'Movements', description: 'Product movement tracking endpoints')]
class MovementController extends Controller
{
    public function __construct(
        protected MovementService $movementService
    ) {
    }

    #[OA\Get(
        path: '/api/v1/products/{productId}/movements',
        summary: 'Get movements for a product',
        tags: ['Movements'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'productId', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'page', in: 'query', required: false, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Paginated list of movements',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'data', type: 'array', items: new OA\Items(type: 'object')),
                        new OA\Property(property: 'current_page', type: 'integer'),
                        new OA\Property(property: 'total', type: 'integer'),
                    ]
                )
            ),
        ]
    )]
    public function index(Product $product)
    {
        $movements = $product->movements()
            ->with('product')
            ->orderBy('created_at', 'desc')
            ->paginate(15);
        return response()->json($movements);
    }

    #[OA\Post(
        path: '/api/v1/products/{productId}/movements',
        summary: 'Create a new movement for a product',
        tags: ['Movements'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'productId', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['type', 'quantity'],
                properties: [
                    new OA\Property(property: 'type', type: 'string', enum: ['entry', 'exit', 'allocation', 'return'], example: 'entry'),
                    new OA\Property(property: 'quantity', type: 'integer', minimum: 1, example: 5),
                    new OA\Property(property: 'assigned_to', type: 'string', nullable: true, maxLength: 255),
                    new OA\Property(property: 'employee_id', type: 'integer', nullable: true, description: 'Required for allocation type'),
                    new OA\Property(property: 'notes', type: 'string', nullable: true),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Movement created successfully',
                content: new OA\JsonContent(type: 'object')
            ),
            new OA\Response(response: 400, description: 'Business rule violation'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function store(Request $request, Product $product)
    {
        $validated = $request->validate([
            'type' => 'required|in:entry,exit,allocation,return',
            'quantity' => 'required|integer|min:1',
            'assigned_to' => 'nullable|string|max:255',
            'employee_id' => 'nullable|integer|exists:employees,id',
            'notes' => 'nullable|string',
        ]);

        // For allocation type, employee_id is required
        if ($validated['type'] === 'allocation' && empty($validated['employee_id'])) {
            return response()->json([
                'error' => 'Employee selection is required for allocation movements.',
            ], 422);
        }

        try {
            $movement = $this->movementService->createMovement($product, $validated);
            return response()->json($movement->load('product'), 201);
        } catch (BusinessRuleException $e) {
            return response()->json([
                'error' => $e->getUserMessage(),
                'context' => $e->getContext(),
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'An unexpected error occurred while creating the movement. Please try again.',
                'message' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}

