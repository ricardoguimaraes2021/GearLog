<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use App\Models\Ticket;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Get the tecnico role
        $tecnicoRole = Role::where('name', 'tecnico')->first();
        
        if (!$tecnicoRole) {
            return; // Role doesn't exist, skip
        }

        // Create additional technician users with different names
        $technicians = [
            [
                'name' => 'John Smith',
                'email' => 'john.smith.tech@gearlog.local',
            ],
            [
                'name' => 'Sarah Johnson',
                'email' => 'sarah.johnson.tech@gearlog.local',
            ],
            [
                'name' => 'Mike Davis',
                'email' => 'mike.davis.tech@gearlog.local',
            ],
            [
                'name' => 'Emily Wilson',
                'email' => 'emily.wilson.tech@gearlog.local',
            ],
        ];

        $createdTechnicians = [];
        foreach ($technicians as $techData) {
            $technician = User::firstOrCreate(
                ['email' => $techData['email']],
                [
                    'name' => $techData['name'],
                    'password' => Hash::make('password'),
                ]
            );
            
            if (!$technician->hasRole('tecnico')) {
                $technician->assignRole($tecnicoRole);
            }
            
            $createdTechnicians[] = $technician;
        }

        // Get all existing technicians (including the original one)
        $allTechnicians = User::role('tecnico')->get();
        
        if ($allTechnicians->count() === 0) {
            return; // No technicians found
        }

        // Redistribute tickets among all technicians
        $tickets = Ticket::whereNotNull('assigned_to')->get();
        
        foreach ($tickets as $ticket) {
            // Randomly assign to one of the technicians
            $randomTechnician = $allTechnicians->random();
            $ticket->update(['assigned_to' => $randomTechnician->id]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Get the original technician user
        $originalTech = User::where('email', 'tecnico@gearlog.local')->first();
        
        if (!$originalTech) {
            return;
        }

        // Reassign all tickets to the original technician
        Ticket::whereNotNull('assigned_to')
            ->update(['assigned_to' => $originalTech->id]);

        // Delete the additional technician users
        $additionalTechEmails = [
            'john.smith.tech@gearlog.local',
            'sarah.johnson.tech@gearlog.local',
            'mike.davis.tech@gearlog.local',
            'emily.wilson.tech@gearlog.local',
        ];

        User::whereIn('email', $additionalTechEmails)->delete();
    }
};
