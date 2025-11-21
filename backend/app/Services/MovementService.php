<?php

namespace App\Services;

use App\Exceptions\BusinessRuleException;
use App\Models\Movement;
use App\Models\Product;
use App\Models\Employee;
use App\Models\AssetAssignment;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MovementService
{
    public function createMovement(Product $product, array $data): Movement
    {
        return DB::transaction(function () use ($product, $data) {
            // Lock the product row for update to prevent race conditions
            $product = Product::lockForUpdate()->findOrFail($product->id);

            // Validate business rules
            $this->validateMovement($product, $data);

            // For allocation type, create AssetAssignment if employee_id is provided
            if ($data['type'] === 'allocation' && !empty($data['employee_id'])) {
                $employee = Employee::findOrFail($data['employee_id']);
                
                // Validate that employee can receive assets
                if (!$employee->canReceiveAssets()) {
                    throw new BusinessRuleException(
                        "Cannot assign asset to employee '{$employee->name}' because they are inactive.",
                        "Employee {$employee->id} is inactive",
                        ['employee_id' => $employee->id, 'employee_status' => $employee->status]
                    );
                }

                // Validate that product can be assigned
                if (!$product->canBeAssigned()) {
                    $activeAssignment = $product->activeAssignment();
                    $reason = $activeAssignment 
                        ? "Product is already assigned to another employee."
                        : "Product cannot be assigned. Status: {$product->status}, Quantity: {$product->quantity}";
                    
                    throw new BusinessRuleException(
                        "Cannot assign product '{$product->name}'. {$reason}",
                        "Product {$product->id} cannot be assigned",
                        [
                            'product_id' => $product->id,
                            'product_status' => $product->status,
                            'product_quantity' => $product->quantity,
                            'has_active_assignment' => $activeAssignment !== null,
                        ]
                    );
                }

                // Create AssetAssignment (one per product, regardless of quantity)
                // The quantity in movement is for stock control, assignment is per product
                AssetAssignment::create([
                    'product_id' => $product->id,
                    'employee_id' => $employee->id,
                    'assigned_by' => Auth::id(),
                    'assigned_at' => now(),
                    'notes' => $data['notes'] ?? null,
                ]);

                // Update product status to 'used' if it's 'new' (first assignment)
                if ($product->status === 'new') {
                    $product->update(['status' => 'used']);
                }

                // Store employee name in assigned_to for display purposes
                $data['assigned_to'] = $employee->name . ($employee->employee_code ? " ({$employee->employee_code})" : '');
            }

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
                'employee_id' => $data['employee_id'] ?? null,
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

