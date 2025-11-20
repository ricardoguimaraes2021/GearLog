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
        Schema::table('categories', function (Blueprint $table) {
            // Remove old unique constraints
            $table->dropUnique(['name']);
            $table->dropUnique(['slug']);
            
            // Add composite unique constraints with company_id
            $table->unique(['name', 'company_id'], 'categories_name_company_unique');
            $table->unique(['slug', 'company_id'], 'categories_slug_company_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            // Remove composite unique constraints
            $table->dropUnique('categories_name_company_unique');
            $table->dropUnique('categories_slug_company_unique');
            
            // Restore old unique constraints
            $table->unique('name');
            $table->unique('slug');
        });
    }
};
