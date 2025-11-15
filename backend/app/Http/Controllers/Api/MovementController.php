<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\BusinessRuleException;
use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\MovementService;
use Illuminate\Http\Request;

class MovementController extends Controller
{
    public function __construct(
        protected MovementService $movementService
    ) {
    }

    public function index(Product $product)
    {
        $movements = $product->movements()->with('product')->paginate(15);
        return response()->json($movements);
    }

    public function store(Request $request, Product $product)
    {
        $validated = $request->validate([
            'type' => 'required|in:entrada,saida,alocacao,devolucao',
            'quantity' => 'required|integer|min:1',
            'assigned_to' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

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

