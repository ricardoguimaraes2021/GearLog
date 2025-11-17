<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Update products.status enum values
        DB::statement("ALTER TABLE products MODIFY COLUMN status ENUM('new', 'used', 'damaged', 'repair', 'reserved') DEFAULT 'new'");
        
        // Update existing product status values
        DB::table('products')->where('status', 'novo')->update(['status' => 'new']);
        DB::table('products')->where('status', 'usado')->update(['status' => 'used']);
        DB::table('products')->where('status', 'avariado')->update(['status' => 'damaged']);
        DB::table('products')->where('status', 'reparação')->update(['status' => 'repair']);
        DB::table('products')->where('status', 'reservado')->update(['status' => 'reserved']);

        // Update movements.type enum values
        DB::statement("ALTER TABLE movements MODIFY COLUMN type ENUM('entry', 'exit', 'allocation', 'return')");
        
        // Update existing movement type values
        DB::table('movements')->where('type', 'entrada')->update(['type' => 'entry']);
        DB::table('movements')->where('type', 'saida')->update(['type' => 'exit']);
        DB::table('movements')->where('type', 'alocacao')->update(['type' => 'allocation']);
        DB::table('movements')->where('type', 'devolucao')->update(['type' => 'return']);
    }

    public function down(): void
    {
        // Revert movement type values
        DB::table('movements')->where('type', 'entry')->update(['type' => 'entrada']);
        DB::table('movements')->where('type', 'exit')->update(['type' => 'saida']);
        DB::table('movements')->where('type', 'allocation')->update(['type' => 'alocacao']);
        DB::table('movements')->where('type', 'return')->update(['type' => 'devolucao']);
        DB::statement("ALTER TABLE movements MODIFY COLUMN type ENUM('entrada', 'saida', 'alocacao', 'devolucao')");

        // Revert product status values
        DB::table('products')->where('status', 'new')->update(['status' => 'novo']);
        DB::table('products')->where('status', 'used')->update(['status' => 'usado']);
        DB::table('products')->where('status', 'damaged')->update(['status' => 'avariado']);
        DB::table('products')->where('status', 'repair')->update(['status' => 'reparação']);
        DB::table('products')->where('status', 'reserved')->update(['status' => 'reservado']);
        DB::statement("ALTER TABLE products MODIFY COLUMN status ENUM('novo', 'usado', 'avariado', 'reparação', 'reservado') DEFAULT 'novo'");
    }
};
