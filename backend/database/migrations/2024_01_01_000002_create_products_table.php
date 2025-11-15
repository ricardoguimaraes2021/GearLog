<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('category_id')->constrained()->onDelete('restrict');
            $table->string('brand')->nullable();
            $table->string('model')->nullable();
            $table->string('serial_number')->unique()->nullable();
            $table->enum('status', ['novo', 'usado', 'avariado', 'reparação', 'reservado'])->default('novo');
            $table->integer('quantity')->default(0);
            $table->decimal('value', 10, 2)->nullable();
            $table->date('purchase_date')->nullable();
            $table->json('specs')->nullable();
            $table->text('description')->nullable();
            $table->string('image_url')->nullable();
            $table->string('qr_code_url')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};

