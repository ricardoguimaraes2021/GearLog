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
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('action'); // e.g., 'login', 'password_changed', 'created', 'updated', 'deleted', 'permission_changed'
            $table->string('table')->nullable(); // e.g., 'users', 'products', 'tickets'
            $table->unsignedBigInteger('record_id')->nullable(); // ID of the affected record
            $table->json('old_value')->nullable(); // Previous values
            $table->json('new_value')->nullable(); // New values
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();

            // Indexes for faster queries
            $table->index(['user_id', 'created_at']);
            $table->index(['action', 'created_at']);
            $table->index(['table', 'record_id']);
            $table->index('created_at'); // For cleanup queries
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
