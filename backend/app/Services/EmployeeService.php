<?php

namespace App\Services;

use App\Exceptions\BusinessRuleException;
use App\Models\Employee;
use App\Models\EmployeeLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class EmployeeService
{
    public function createEmployee(array $data): Employee
    {
        return DB::transaction(function () use ($data) {
            // Generate employee code if not provided
            if (empty($data['employee_code'])) {
                $data['employee_code'] = Employee::generateEmployeeCode();
            }

            $employee = Employee::create($data);

            // Log creation
            $this->logEmployeeAction($employee, 'created', null, $employee->toArray());

            Log::info("Employee created: {$employee->employee_code} - {$employee->name}", [
                'employee_id' => $employee->id,
                'user_id' => Auth::id(),
            ]);

            return $employee->fresh(['department']);
        });
    }

    public function updateEmployee(Employee $employee, array $data): Employee
    {
        return DB::transaction(function () use ($employee, $data) {
            $oldValues = $employee->toArray();
            
            $employee->update($data);
            $employee->refresh();

            // Log update
            $this->logEmployeeAction($employee, 'updated', $oldValues, $employee->toArray());

            Log::info("Employee updated: {$employee->employee_code} - {$employee->name}", [
                'employee_id' => $employee->id,
                'user_id' => Auth::id(),
            ]);

            return $employee->fresh(['department']);
        });
    }

    public function deactivateEmployee(Employee $employee): Employee
    {
        return DB::transaction(function () use ($employee) {
            if ($employee->status === 'inactive') {
                throw new BusinessRuleException(
                    "Employee '{$employee->name}' is already inactive.",
                    "Employee {$employee->id} is already inactive",
                    ['employee_id' => $employee->id]
                );
            }

            // Check if employee has active assignments
            if ($employee->activeAssignments()->count() > 0) {
                throw new BusinessRuleException(
                    "Cannot deactivate employee '{$employee->name}' because they have active asset assignments. Please return all assigned assets first.",
                    "Employee {$employee->id} has active assignments",
                    ['employee_id' => $employee->id, 'active_assignments' => $employee->activeAssignments()->count()]
                );
            }

            $oldValues = $employee->toArray();
            $employee->update(['status' => 'inactive']);

            // Log deactivation
            $this->logEmployeeAction($employee, 'deactivated', $oldValues, $employee->toArray());

            Log::info("Employee deactivated: {$employee->employee_code} - {$employee->name}", [
                'employee_id' => $employee->id,
                'user_id' => Auth::id(),
            ]);

            return $employee->fresh(['department']);
        });
    }

    public function reactivateEmployee(Employee $employee): Employee
    {
        return DB::transaction(function () use ($employee) {
            if ($employee->status === 'active') {
                throw new BusinessRuleException(
                    "Employee '{$employee->name}' is already active.",
                    "Employee {$employee->id} is already active",
                    ['employee_id' => $employee->id]
                );
            }

            $oldValues = $employee->toArray();
            $employee->update(['status' => 'active']);

            // Log reactivation
            $this->logEmployeeAction($employee, 'reactivated', $oldValues, $employee->toArray());

            Log::info("Employee reactivated: {$employee->employee_code} - {$employee->name}", [
                'employee_id' => $employee->id,
                'user_id' => Auth::id(),
            ]);

            return $employee->fresh(['department']);
        });
    }

    public function deleteEmployee(Employee $employee): bool
    {
        return DB::transaction(function () use ($employee) {
            // Business rule: Cannot delete if has active assignments
            if (!$employee->canDelete()) {
                $activeAssignments = $employee->activeAssignments()->count();
                
                throw new BusinessRuleException(
                    "Cannot delete employee '{$employee->name}' because they have {$activeAssignments} active asset assignment(s). Please return all assigned assets first.",
                    "Employee {$employee->id} cannot be deleted",
                    [
                        'employee_id' => $employee->id,
                        'active_assignments' => $activeAssignments,
                    ]
                );
            }

            // Delete associated logs
            $employee->logs()->delete();

            $employeeCode = $employee->employee_code;
            $employeeName = $employee->name;
            $employeeId = $employee->id;

            $employee->delete();

            Log::info("Employee deleted: {$employeeCode} - {$employeeName}", [
                'employee_id' => $employeeId,
                'user_id' => Auth::id(),
            ]);

            return true;
        });
    }

    protected function logEmployeeAction(Employee $employee, string $action, ?array $oldValue, ?array $newValue): void
    {
        EmployeeLog::create([
            'employee_id' => $employee->id,
            'user_id' => Auth::id(),
            'action' => $action,
            'old_value' => $oldValue,
            'new_value' => $newValue,
        ]);
    }
}

