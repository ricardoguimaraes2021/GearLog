<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Employee;
use Illuminate\Database\Seeder;

class EmployeeSeeder extends Seeder
{
    public function run(): void
    {
        $itDept = Department::where('name', 'IT Department')->first();
        $salesDept = Department::where('name', 'Sales')->first();
        $marketingDept = Department::where('name', 'Marketing')->first();
        $hrDept = Department::where('name', 'Human Resources')->first();
        $financeDept = Department::where('name', 'Finance')->first();
        $opsDept = Department::where('name', 'Operations')->first();

        $employees = [
            // IT Department
            [
                'employee_code' => 'EMP000001',
                'name' => 'John Smith',
                'email' => 'john.smith@company.com',
                'phone' => '+1-555-0101',
                'department_id' => $itDept?->id,
                'position' => 'IT Manager',
                'status' => 'active',
            ],
            [
                'employee_code' => 'EMP000002',
                'name' => 'Sarah Johnson',
                'email' => 'sarah.johnson@company.com',
                'phone' => '+1-555-0102',
                'department_id' => $itDept?->id,
                'position' => 'Senior Developer',
                'status' => 'active',
            ],
            [
                'employee_code' => 'EMP000003',
                'name' => 'Mike Davis',
                'email' => 'mike.davis@company.com',
                'phone' => '+1-555-0103',
                'department_id' => $itDept?->id,
                'position' => 'System Administrator',
                'status' => 'active',
            ],
            [
                'employee_code' => 'EMP000004',
                'name' => 'Emily Wilson',
                'email' => 'emily.wilson@company.com',
                'phone' => '+1-555-0104',
                'department_id' => $itDept?->id,
                'position' => 'IT Support Specialist',
                'status' => 'active',
            ],
            // Sales Department
            [
                'employee_code' => 'EMP000005',
                'name' => 'Robert Brown',
                'email' => 'robert.brown@company.com',
                'phone' => '+1-555-0105',
                'department_id' => $salesDept?->id,
                'position' => 'Sales Manager',
                'status' => 'active',
            ],
            [
                'employee_code' => 'EMP000006',
                'name' => 'Lisa Anderson',
                'email' => 'lisa.anderson@company.com',
                'phone' => '+1-555-0106',
                'department_id' => $salesDept?->id,
                'position' => 'Sales Representative',
                'status' => 'active',
            ],
            // Marketing Department
            [
                'employee_code' => 'EMP000007',
                'name' => 'David Martinez',
                'email' => 'david.martinez@company.com',
                'phone' => '+1-555-0107',
                'department_id' => $marketingDept?->id,
                'position' => 'Marketing Director',
                'status' => 'active',
            ],
            [
                'employee_code' => 'EMP000008',
                'name' => 'Jennifer Taylor',
                'email' => 'jennifer.taylor@company.com',
                'phone' => '+1-555-0108',
                'department_id' => $marketingDept?->id,
                'position' => 'Marketing Coordinator',
                'status' => 'active',
            ],
            // HR Department
            [
                'employee_code' => 'EMP000009',
                'name' => 'Michael Thompson',
                'email' => 'michael.thompson@company.com',
                'phone' => '+1-555-0109',
                'department_id' => $hrDept?->id,
                'position' => 'HR Manager',
                'status' => 'active',
            ],
            // Finance Department
            [
                'employee_code' => 'EMP000010',
                'name' => 'Amanda White',
                'email' => 'amanda.white@company.com',
                'phone' => '+1-555-0110',
                'department_id' => $financeDept?->id,
                'position' => 'Finance Manager',
                'status' => 'active',
            ],
            // Operations Department
            [
                'employee_code' => 'EMP000011',
                'name' => 'Christopher Lee',
                'email' => 'christopher.lee@company.com',
                'phone' => '+1-555-0111',
                'department_id' => $opsDept?->id,
                'position' => 'Operations Manager',
                'status' => 'active',
            ],
            // Inactive employee example
            [
                'employee_code' => 'EMP000012',
                'name' => 'Former Employee',
                'email' => 'former.employee@company.com',
                'phone' => '+1-555-0112',
                'department_id' => $itDept?->id,
                'position' => 'Former Position',
                'status' => 'inactive',
                'notes' => 'Left the company',
            ],
        ];

        foreach ($employees as $employeeData) {
            Employee::firstOrCreate(
                ['email' => $employeeData['email']],
                $employeeData
            );
        }

        // Update department managers
        if ($itDept) {
            $itManager = Employee::where('email', 'john.smith@company.com')->first();
            if ($itManager) {
                $itDept->update(['manager_employee_id' => $itManager->id]);
            }
        }

        if ($salesDept) {
            $salesManager = Employee::where('email', 'robert.brown@company.com')->first();
            if ($salesManager) {
                $salesDept->update(['manager_employee_id' => $salesManager->id]);
            }
        }

        if ($marketingDept) {
            $marketingDirector = Employee::where('email', 'david.martinez@company.com')->first();
            if ($marketingDirector) {
                $marketingDept->update(['manager_employee_id' => $marketingDirector->id]);
            }
        }
    }
}
