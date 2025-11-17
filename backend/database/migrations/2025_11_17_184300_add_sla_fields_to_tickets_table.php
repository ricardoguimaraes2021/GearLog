<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->timestamp('first_response_deadline')->nullable()->after('status');
            $table->timestamp('resolution_deadline')->nullable()->after('first_response_deadline');
            $table->timestamp('first_response_at')->nullable()->after('resolution_deadline');
            $table->boolean('sla_violated')->default(false)->after('first_response_at');
            
            $table->index('first_response_deadline');
            $table->index('resolution_deadline');
            $table->index('sla_violated');
        });
    }

    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropIndex(['first_response_deadline']);
            $table->dropIndex(['resolution_deadline']);
            $table->dropIndex(['sla_violated']);
            
            $table->dropColumn([
                'first_response_deadline',
                'resolution_deadline',
                'first_response_at',
                'sla_violated',
            ]);
        });
    }
};
