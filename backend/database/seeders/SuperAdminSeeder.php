<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $superAdmin = User::updateOrCreate(
            ['email' => 'admin@admin.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('admin123'), // Password temporária para testes
                'company_id' => null, // Super admin não precisa de company
                'is_owner' => false,
            ]
        );

        // Assign admin role if it exists
        if ($superAdmin->hasRole('admin')) {
            $superAdmin->syncRoles(['admin']);
        } else {
            // If admin role doesn't exist, just assign viewer role for now
            $superAdmin->assignRole('viewer');
        }

        $this->command->info('Super Admin created:');
        $this->command->info('Email: admin@admin.com');
        $this->command->info('Password: admin123');
        $this->command->warn('⚠️  Remember to change the password in production!');
    }
}
