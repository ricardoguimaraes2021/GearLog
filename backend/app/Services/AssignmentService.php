<?php

namespace App\Services;

use App\Exceptions\BusinessRuleException;
use App\Models\AssetAssignment;
use App\Models\Employee;
use App\Models\Product;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AssignmentService
{
    public function checkout(Product $product, Employee $employee, array $data): AssetAssignment
    {
        return DB::transaction(function () use ($product, $employee, $data) {
            // Validate business rules
            $this->validateCheckout($product, $employee);

            // Create assignment
            $assignment = AssetAssignment::create([
                'product_id' => $product->id,
                'employee_id' => $employee->id,
                'assigned_by' => Auth::id(),
                'assigned_at' => now(),
                'notes' => $data['notes'] ?? null,
            ]);

            Log::info("Asset assigned: Product {$product->id} to Employee {$employee->id}", [
                'assignment_id' => $assignment->id,
                'product_id' => $product->id,
                'employee_id' => $employee->id,
                'user_id' => Auth::id(),
            ]);

            return $assignment->fresh(['product', 'employee', 'assignedBy']);
        });
    }

    public function checkin(AssetAssignment $assignment, array $data): AssetAssignment
    {
        return DB::transaction(function () use ($assignment, $data) {
            // Validate that assignment is active
            if ($assignment->returned_at !== null) {
                throw new BusinessRuleException(
                    "This asset has already been returned.",
                    "Assignment {$assignment->id} is already returned",
                    ['assignment_id' => $assignment->id]
                );
            }

            // Update assignment
            $assignment->update([
                'returned_by' => Auth::id(),
                'returned_at' => now(),
                'condition_on_return' => $data['condition_on_return'] ?? null,
                'notes' => $data['notes'] ?? $assignment->notes,
            ]);

            // Optionally update product status if provided
            if (isset($data['product_status'])) {
                $validStatuses = ['new', 'used', 'damaged', 'repair', 'reserved'];
                if (in_array($data['product_status'], $validStatuses)) {
                    $assignment->product->update(['status' => $data['product_status']]);
                }
            }

            Log::info("Asset returned: Assignment {$assignment->id}", [
                'assignment_id' => $assignment->id,
                'product_id' => $assignment->product_id,
                'employee_id' => $assignment->employee_id,
                'user_id' => Auth::id(),
            ]);

            return $assignment->fresh(['product', 'employee', 'assignedBy', 'returnedBy']);
        });
    }

    protected function validateCheckout(Product $product, Employee $employee): void
    {
        // Rule: Product must be assignable
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

        // Rule: Employee must be active
        if (!$employee->canReceiveAssets()) {
            throw new BusinessRuleException(
                "Cannot assign asset to employee '{$employee->name}' because they are inactive.",
                "Employee {$employee->id} is inactive",
                ['employee_id' => $employee->id, 'employee_status' => $employee->status]
            );
        }
    }
}

