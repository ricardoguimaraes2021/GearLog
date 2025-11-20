<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Company;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create demo company
        $company = Company::firstOrCreate(
            ['name' => 'GearLog Demo Company'],
            [
                'country' => 'Portugal',
                'timezone' => 'Europe/Lisbon',
                'plan_type' => 'FREE',
                'max_users' => 3,
                'max_products' => 500,
                'max_tickets' => 150,
                'is_active' => true,
            ]
        );

        // Create permissions
        $permissions = [
            'products.view',
            'products.create',
            'products.update',
            'products.delete',
            'categories.view',
            'categories.manage',
            'movements.create',
            'movements.view',
            'dashboard.view',
            'exports.generate',
            // Employee management permissions
            'employees.view',
            'employees.create',
            'employees.update',
            'employees.delete',
            'departments.view',
            'departments.manage',
            'assignments.create',
            'assignments.view',
            'assignments.return',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Create roles
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $gestorRole = Role::firstOrCreate(['name' => 'gestor']);
        $tecnicoRole = Role::firstOrCreate(['name' => 'tecnico']);
        $viewerRole = Role::firstOrCreate(['name' => 'viewer']);

        // Assign permissions to roles
        $adminRole->givePermissionTo(Permission::all());

        $gestorRole->givePermissionTo([
            'products.view',
            'products.create',
            'products.update',
            'products.delete',
            'categories.manage',
            'movements.create',
            'movements.view',
            'dashboard.view',
            'exports.generate',
            'employees.view',
            'employees.create',
            'employees.update',
            'departments.manage',
            'assignments.create',
            'assignments.view',
            'assignments.return',
        ]);

        $tecnicoRole->givePermissionTo([
            'products.view',
            'movements.create',
            'movements.view',
            'dashboard.view',
            'employees.view',
            'assignments.create',
            'assignments.view',
            'assignments.return',
        ]);

        $viewerRole->givePermissionTo([
            'products.view',
            'movements.view',
            'dashboard.view',
            'employees.view',
            'departments.view',
            'categories.view',
        ]);

        // Create users (update company_id if user already exists)
        $admin = User::firstOrCreate(
            ['email' => 'admin@gearlog.local'],
            [
                'name' => 'Administrator',
                'password' => Hash::make('password'),
                'company_id' => $company->id,
                'is_owner' => true,
            ]
        );
        // Update company_id if user already existed
        if (!$admin->company_id) {
            $admin->update(['company_id' => $company->id, 'is_owner' => true]);
        }
        $admin->assignRole($adminRole);

        $gestor = User::firstOrCreate(
            ['email' => 'gestor@gearlog.local'],
            [
                'name' => 'Manager',
                'password' => Hash::make('password'),
                'company_id' => $company->id,
                'is_owner' => false,
            ]
        );
        // Update company_id if user already existed
        if (!$gestor->company_id) {
            $gestor->update(['company_id' => $company->id, 'is_owner' => false]);
        }
        $gestor->assignRole($gestorRole);

        $tecnico = User::firstOrCreate(
            ['email' => 'tecnico@gearlog.local'],
            [
                'name' => 'Technician',
                'password' => Hash::make('password'),
                'company_id' => $company->id,
                'is_owner' => false,
            ]
        );
        // Update company_id if user already existed
        if (!$tecnico->company_id) {
            $tecnico->update(['company_id' => $company->id, 'is_owner' => false]);
        }
        $tecnico->assignRole($tecnicoRole);

        // Create sample categories
        $categories = [
            ['name' => 'Laptops'],
            ['name' => 'Desktops'],
            ['name' => 'Monitors'],
            ['name' => 'Keyboards'],
            ['name' => 'Mice'],
            ['name' => 'Networking'],
            ['name' => 'Storage'],
        ];

        foreach ($categories as $categoryData) {
            Category::firstOrCreate(
                ['name' => $categoryData['name'], 'company_id' => $company->id],
                ['company_id' => $company->id]
            );
        }

        // Seed departments and employees (pass company_id)
        $this->call([
            DepartmentSeeder::class,
            EmployeeSeeder::class,
        ]);
        
        // Update seeders to use company_id
        // Note: We pass company_id through the seeder classes
        $this->command->info("Demo company created: {$company->name} (ID: {$company->id})");
    }
}

