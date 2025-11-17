<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ticket_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('restrict');
            $table->enum('action', ['created', 'status_changed', 'comment_added', 'assigned', 'unassigned', 'closed', 'resolved'])->default('created');
            $table->json('old_value')->nullable();
            $table->json('new_value')->nullable();
            $table->timestamps();
            
            $table->index('ticket_id');
            $table->index('user_id');
            $table->index('action');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_logs');
    }
};
