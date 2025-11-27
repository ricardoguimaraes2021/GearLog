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








