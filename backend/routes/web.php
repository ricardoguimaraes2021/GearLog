<?php

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'message' => 'GearLog API',
        'version' => '1.0.0',
        'docs' => url('/api/documentation'),
    ]);
});

// Health check endpoint
Route::get('/health', [\App\Http\Controllers\HealthController::class, 'check']);

// Broadcasting authentication (only if Pusher is configured)
if (config('broadcasting.default') === 'pusher' && config('broadcasting.connections.pusher.key')) {
    // Register broadcasting routes with authentication
    // LogBroadcastingAuth autentica manualmente usando Sanctum e verifica autenticação
    Broadcast::routes([
        'middleware' => [
            \App\Http\Middleware\LogBroadcastingAuth::class,
        ],
    ]);
}

// Rota temporária para limpar cache em produção (Railway)
Route::get('/clear-cache-force', function () {
    try {
        \Illuminate\Support\Facades\Artisan::call('config:clear');
        \Illuminate\Support\Facades\Artisan::call('cache:clear');
        \Illuminate\Support\Facades\Artisan::call('route:clear');
        \Illuminate\Support\Facades\Artisan::call('view:clear');
        return response()->json([
            'status' => 'success',
            'message' => 'Cache cleared successfully!',
            'output' => \Illuminate\Support\Facades\Artisan::output()
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => $e->getMessage()
        ], 500);
    }
});

