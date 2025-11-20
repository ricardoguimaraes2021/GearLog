<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Create new permissions if they don't exist
        Permission::firstOrCreate(['name' => 'categories.view']);
        Permission::firstOrCreate(['name' => 'departments.view']);
        
        // Get the viewer role
        $viewerRole = Role::where('name', 'viewer')->first();
        
        if ($viewerRole) {
            // Add new view permissions
            $viewerRole->givePermissionTo([
                'employees.view',
                'departments.view',
                'categories.view',
            ]);
            
            // Remove any create/update/delete permissions that might exist
            $viewerRole->revokePermissionTo([
                'products.create',
                'products.update',
                'products.delete',
                'categories.manage',
                'departments.manage',
                'employees.create',
                'employees.update',
                'employees.delete',
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $viewerRole = Role::where('name', 'viewer')->first();
        
        if ($viewerRole) {
            // Remove the view permissions
            $viewerRole->revokePermissionTo([
                'employees.view',
                'departments.view',
                'categories.view',
            ]);
        }
    }
};
