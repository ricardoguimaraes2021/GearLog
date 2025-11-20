<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            // Remove old unique constraints
            $table->dropUnique(['employee_code']);
            $table->dropUnique(['email']);
            
            // Add composite unique constraints with company_id
            $table->unique(['employee_code', 'company_id'], 'employees_employee_code_company_unique');
            $table->unique(['email', 'company_id'], 'employees_email_company_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            // Remove composite unique constraints
            $table->dropUnique('employees_employee_code_company_unique');
            $table->dropUnique('employees_email_company_unique');
            
            // Restore old unique constraints
            $table->unique('employee_code');
            $table->unique('email');
        });
    }
};
