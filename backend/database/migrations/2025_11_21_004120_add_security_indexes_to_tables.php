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
        // Add indexes for frequently queried columns to improve performance and prevent DoS
        // Note: Laravel will handle duplicate index errors gracefully
        try {
            if (Schema::hasTable('products')) {
                Schema::table('products', function (Blueprint $table) {
                    try {
                        $table->index('status', 'products_status_index');
                    } catch (\Exception $e) {}
                    try {
                        $table->index('quantity', 'products_quantity_index');
                    } catch (\Exception $e) {}
                    try {
                        $table->index('company_id', 'products_company_id_index');
                    } catch (\Exception $e) {}
                    try {
                        $table->index(['company_id', 'status'], 'products_company_status_index');
                    } catch (\Exception $e) {}
                    try {
                        $table->index(['company_id', 'category_id'], 'products_company_category_index');
                    } catch (\Exception $e) {}
                });
            }

            if (Schema::hasTable('movements')) {
                Schema::table('movements', function (Blueprint $table) {
                    try {
                        $table->index('type', 'movements_type_index');
                    } catch (\Exception $e) {}
                    try {
                        $table->index('created_at', 'movements_created_at_index');
                    } catch (\Exception $e) {}
                    try {
                        $table->index(['product_id', 'created_at'], 'movements_product_created_index');
                    } catch (\Exception $e) {}
                    try {
                        $table->index('company_id', 'movements_company_id_index');
                    } catch (\Exception $e) {}
                });
            }

            if (Schema::hasTable('tickets')) {
                Schema::table('tickets', function (Blueprint $table) {
                    try {
                        $table->index('company_id', 'tickets_company_id_index');
                    } catch (\Exception $e) {}
                    try {
                        $table->index(['company_id', 'status'], 'tickets_company_status_index');
                    } catch (\Exception $e) {}
                    try {
                        $table->index(['company_id', 'priority'], 'tickets_company_priority_index');
                    } catch (\Exception $e) {}
                    try {
                        $table->index('created_at', 'tickets_created_at_index');
                    } catch (\Exception $e) {}
                    if (Schema::hasColumn('tickets', 'sla_violated')) {
                        try {
                            $table->index('sla_violated', 'tickets_sla_violated_index');
                        } catch (\Exception $e) {}
                    }
                });
            }

            if (Schema::hasTable('employees')) {
                Schema::table('employees', function (Blueprint $table) {
                    try {
                        $table->index('status', 'employees_status_index');
                    } catch (\Exception $e) {}
                    try {
                        $table->index('company_id', 'employees_company_id_index');
                    } catch (\Exception $e) {}
                    try {
                        $table->index(['company_id', 'status'], 'employees_company_status_index');
                    } catch (\Exception $e) {}
                });
            }

            if (Schema::hasTable('asset_assignments')) {
                Schema::table('asset_assignments', function (Blueprint $table) {
                    try {
                        $table->index('returned_at', 'asset_assignments_returned_at_index');
                    } catch (\Exception $e) {}
                    try {
                        $table->index(['employee_id', 'returned_at'], 'asset_assignments_employee_returned_index');
                    } catch (\Exception $e) {}
                    try {
                        $table->index(['product_id', 'returned_at'], 'asset_assignments_product_returned_index');
                    } catch (\Exception $e) {}
                    try {
                        $table->index('company_id', 'asset_assignments_company_id_index');
                    } catch (\Exception $e) {}
                });
            }

            if (Schema::hasTable('users')) {
                Schema::table('users', function (Blueprint $table) {
                    try {
                        $table->index('company_id', 'users_company_id_index');
                    } catch (\Exception $e) {}
                });
            }

            if (Schema::hasTable('categories')) {
                Schema::table('categories', function (Blueprint $table) {
                    try {
                        $table->index('company_id', 'categories_company_id_index');
                    } catch (\Exception $e) {}
                });
            }

            if (Schema::hasTable('departments')) {
                Schema::table('departments', function (Blueprint $table) {
                    try {
                        $table->index('company_id', 'departments_company_id_index');
                    } catch (\Exception $e) {}
                });
            }
        } catch (\Exception $e) {
            // Migration will continue even if some indexes already exist
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Note: Dropping indexes can be complex, so we'll leave them in place
        // If you need to remove them, do it manually or create a separate migration
    }
};
