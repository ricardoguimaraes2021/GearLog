<?php

namespace App\Services;

use App\Models\Movement;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MovementService
{
    public function createMovement(Product $product, array $data): Movement
    {
        return DB::transaction(function () use ($product, $data) {
            // Validate business rules
            $this->validateMovement($product, $data);

            // Create movement
            $movement = Movement::create([
                'product_id' => $product->id,
                'type' => $data['type'],
                'quantity' => $data['quantity'],
                'assigned_to' => $data['assigned_to'] ?? null,
                'notes' => $data['notes'] ?? null,
            ]);

            // Update product quantity
            $quantityChange = $this->calculateQuantityChange($data['type'], $data['quantity']);
            $newQuantity = $product->quantity + $quantityChange;

            if ($newQuantity < 0) {
                throw new \Exception('Stock cannot go below zero.');
            }

            $product->update(['quantity' => $newQuantity]);

            // Log activity
            Log::info("Movement created: {$movement->type} for product {$product->id}", [
                'movement_id' => $movement->id,
                'product_id' => $product->id,
                'quantity_change' => $quantityChange,
            ]);

            return $movement;
        });
    }

    protected function validateMovement(Product $product, array $data): void
    {
        // Rule: A product with status "avariado" cannot be allocated
        if ($data['type'] === 'alocacao' && $product->status === 'avariado') {
            throw new \Exception('Cannot allocate a damaged product.');
        }

        // Rule: No movement may reduce stock below zero
        if (in_array($data['type'], ['saida', 'alocacao'])) {
            $quantityChange = -$data['quantity'];
            if ($product->quantity + $quantityChange < 0) {
                throw new \Exception('Insufficient stock for this movement.');
            }
        }
    }

    protected function calculateQuantityChange(string $type, int $quantity): int
    {
        return match ($type) {
            'entrada', 'devolucao' => $quantity,
            'saida', 'alocacao' => -$quantity,
            default => 0,
        };
    }
}

