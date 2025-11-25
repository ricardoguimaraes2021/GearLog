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

// Debug endpoint to check system status
Route::get('/debug-status', function () {
    try {
        $roles = \Spatie\Permission\Models\Role::all()->pluck('name');
        $userCount = \App\Models\User::count();
        $companyCount = \App\Models\Company::count();
        
        return response()->json([
            'status' => 'ok',
            'database' => 'connected',
            'roles' => $roles,
            'users_count' => $userCount,
            'companies_count' => $companyCount,
            'app_env' => config('app.env'),
            'app_debug' => config('app.debug'),
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => $e->getMessage(),
            'trace' => config('app.debug') ? $e->getTraceAsString() : null,
        ], 500);
    }
});

// Run database seeder (temporary endpoint for production setup)
Route::get('/run-seeder', function () {
    try {
        // Run the DatabaseSeeder
        \Illuminate\Support\Facades\Artisan::call('db:seed', [
            '--class' => 'DatabaseSeeder',
            '--force' => true,
        ]);
        
        $output = \Illuminate\Support\Facades\Artisan::output();
        
        // Get updated counts
        $roles = \Spatie\Permission\Models\Role::all()->pluck('name');
        $permissions = \Spatie\Permission\Models\Permission::all()->pluck('name');
        $userCount = \App\Models\User::count();
        $companyCount = \App\Models\Company::count();
        
        return response()->json([
            'status' => 'success',
            'message' => 'Database seeded successfully',
            'output' => $output,
            'roles' => $roles,
            'permissions_count' => $permissions->count(),
            'users_count' => $userCount,
            'companies_count' => $companyCount,
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => $e->getMessage(),
            'trace' => config('app.debug') ? $e->getTraceAsString() : null,
        ], 500);
    }
});




