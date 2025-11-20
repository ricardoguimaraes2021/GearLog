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
        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('country')->nullable();
            $table->string('timezone')->default('UTC');
            $table->enum('plan_type', ['FREE', 'PRO', 'ENTERPRISE'])->default('FREE');
            $table->integer('max_users')->default(3);
            $table->integer('max_products')->default(500);
            $table->integer('max_tickets')->default(150)->comment('Per month');
            $table->boolean('is_active')->default(true);
            $table->timestamp('suspended_at')->nullable();
            $table->timestamps();
            
            $table->index('plan_type');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('companies');
    }
};
