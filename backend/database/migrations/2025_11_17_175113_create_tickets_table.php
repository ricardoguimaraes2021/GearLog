<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->foreignId('product_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('opened_by')->constrained('users')->onDelete('restrict');
            $table->foreignId('assigned_to')->nullable()->constrained('users')->onDelete('set null');
            $table->enum('priority', ['low', 'medium', 'high', 'critical'])->default('medium');
            $table->enum('type', ['damage', 'maintenance', 'update', 'audit', 'other'])->default('other');
            $table->enum('status', ['open', 'in_progress', 'waiting_parts', 'resolved', 'closed'])->default('open');
            $table->text('description');
            $table->text('resolution')->nullable();
            $table->json('attachments')->nullable();
            $table->timestamps();
            
            $table->index('status');
            $table->index('priority');
            $table->index('assigned_to');
            $table->index('product_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};
