<?php

namespace Database\Seeders;

use App\Models\Category;
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
        // Create permissions
        $permissions = [
            'products.view',
            'products.create',
            'products.update',
            'products.delete',
            'categories.manage',
            'movements.create',
            'movements.view',
            'dashboard.view',
            'exports.generate',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Create roles
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $gestorRole = Role::firstOrCreate(['name' => 'gestor']);
        $tecnicoRole = Role::firstOrCreate(['name' => 'tecnico']);
        $consultaRole = Role::firstOrCreate(['name' => 'consulta']);

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
        ]);

        $tecnicoRole->givePermissionTo([
            'products.view',
            'movements.create',
            'movements.view',
            'dashboard.view',
        ]);

        $consultaRole->givePermissionTo([
            'products.view',
            'movements.view',
            'dashboard.view',
        ]);

        // Create users
        $admin = User::firstOrCreate(
            ['email' => 'admin@gearlog.local'],
            [
                'name' => 'Administrator',
                'password' => Hash::make('password'),
            ]
        );
        $admin->assignRole($adminRole);

        $gestor = User::firstOrCreate(
            ['email' => 'gestor@gearlog.local'],
            [
                'name' => 'Manager',
                'password' => Hash::make('password'),
            ]
        );
        $gestor->assignRole($gestorRole);

        $tecnico = User::firstOrCreate(
            ['email' => 'tecnico@gearlog.local'],
            [
                'name' => 'Technician',
                'password' => Hash::make('password'),
            ]
        );
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
            Category::firstOrCreate(['name' => $categoryData['name']]);
        }
    }
}

