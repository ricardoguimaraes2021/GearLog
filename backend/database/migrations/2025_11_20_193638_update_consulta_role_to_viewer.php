<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update the 'consulta' role name to 'viewer' in the roles table
        DB::table('roles')
            ->where('name', 'consulta')
            ->where('guard_name', 'web')
            ->update(['name' => 'viewer']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert the 'viewer' role name back to 'consulta'
        DB::table('roles')
            ->where('name', 'viewer')
            ->where('guard_name', 'web')
            ->update(['name' => 'consulta']);
    }
};
