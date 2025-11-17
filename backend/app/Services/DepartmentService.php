<?php

namespace App\Services;

use App\Models\Department;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DepartmentService
{
    public function createDepartment(array $data): Department
    {
        return DB::transaction(function () use ($data) {
            $department = Department::create($data);

            Log::info("Department created: {$department->name}", [
                'department_id' => $department->id,
            ]);

            return $department->fresh(['manager']);
        });
    }

    public function updateDepartment(Department $department, array $data): Department
    {
        return DB::transaction(function () use ($department, $data) {
            $department->update($data);

            Log::info("Department updated: {$department->name}", [
                'department_id' => $department->id,
            ]);

            return $department->fresh(['manager']);
        });
    }

    public function deleteDepartment(Department $department): bool
    {
        return DB::transaction(function () use ($department) {
            // Check if department has employees
            $employeeCount = $department->employees()->count();
            if ($employeeCount > 0) {
                throw new \App\Exceptions\BusinessRuleException(
                    "Cannot delete department '{$department->name}' because it has {$employeeCount} employee(s). Please reassign or remove these employees first.",
                    "Department {$department->id} has employees",
                    ['department_id' => $department->id, 'employee_count' => $employeeCount]
                );
            }

            $departmentName = $department->name;
            $departmentId = $department->id;

            $department->delete();

            Log::info("Department deleted: {$departmentName}", [
                'department_id' => $departmentId,
            ]);

            return true;
        });
    }
}

