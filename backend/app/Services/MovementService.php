<?php

namespace App\Services;

use App\Exceptions\BusinessRuleException;
use App\Models\Movement;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MovementService
{
    public function createMovement(Product $product, array $data): Movement
    {
        return DB::transaction(function () use ($product, $data) {
            // Refresh product to get latest quantity (prevent race conditions)
            $product->refresh();

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

            // Double-check before updating (additional safety check)
            if ($newQuantity < 0) {
                throw new BusinessRuleException(
                    "Insufficient stock. Current stock: {$product->quantity}, requested: {$data['quantity']}. Stock cannot go below zero.",
                    "Stock would go negative: current={$product->quantity}, change={$quantityChange}",
                    ['current_quantity' => $product->quantity, 'requested_quantity' => $data['quantity'], 'movement_type' => $data['type']]
                );
            }

            $oldQuantity = $product->quantity;
            $product->update(['quantity' => $newQuantity]);
            $product->refresh();

            // Fire notification events
            // If movement results in low stock (<= 1)
            if ($newQuantity <= 1 && $oldQuantity > 1) {
                event(new \App\Events\LowStockAlert($product));
            }

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
        // Rule: A product with status "damaged" cannot be allocated
        if ($data['type'] === 'allocation' && $product->status === 'damaged') {
            throw new BusinessRuleException(
                "Cannot allocate product '{$product->name}' because it is marked as damaged. Please repair or remove the product first.",
                "Product {$product->id} is damaged and cannot be allocated",
                ['product_id' => $product->id, 'product_name' => $product->name, 'status' => $product->status]
            );
        }

        // Rule: No movement may reduce stock below zero
        if (in_array($data['type'], ['saida', 'alocacao'])) {
            $quantityChange = -$data['quantity'];
            if ($product->quantity + $quantityChange < 0) {
                $available = $product->quantity;
                throw new BusinessRuleException(
                    "Insufficient stock for {$data['type']}. Available: {$available} item(s), requested: {$data['quantity']} item(s).",
                    "Insufficient stock: available={$available}, requested={$data['quantity']}",
                    ['available_quantity' => $available, 'requested_quantity' => $data['quantity'], 'movement_type' => $data['type']]
                );
            }
        }
    }

    protected function calculateQuantityChange(string $type, int $quantity): int
    {
        return match ($type) {
            'entry', 'return' => $quantity,
            'exit', 'allocation' => -$quantity,
            default => 0,
        };
    }
}

