<?php

namespace Database\Seeders;

use App\Models\Department;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        $departments = [
            [
                'name' => 'IT Department',
                'description' => 'Information Technology department responsible for infrastructure and support',
                'cost_center' => 'IT-001',
            ],
            [
                'name' => 'Sales',
                'description' => 'Sales team responsible for customer relations and revenue',
                'cost_center' => 'SALES-001',
            ],
            [
                'name' => 'Marketing',
                'description' => 'Marketing department handling campaigns and brand management',
                'cost_center' => 'MKT-001',
            ],
            [
                'name' => 'Human Resources',
                'description' => 'HR department managing personnel and recruitment',
                'cost_center' => 'HR-001',
            ],
            [
                'name' => 'Finance',
                'description' => 'Finance department managing budgets and accounting',
                'cost_center' => 'FIN-001',
            ],
            [
                'name' => 'Operations',
                'description' => 'Operations department managing day-to-day business activities',
                'cost_center' => 'OPS-001',
            ],
        ];

        foreach ($departments as $departmentData) {
            Department::firstOrCreate(
                ['name' => $departmentData['name']],
                $departmentData
            );
        }
    }
}
