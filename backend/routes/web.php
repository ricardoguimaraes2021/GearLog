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

// Comprehensive database status check
Route::get('/db-status', function () {
    try {
        $status = [
            'database' => 'connected',
            'tables' => [],
            'migrations' => [],
            'roles' => [],
            'permissions' => [],
            'users' => [],
            'companies' => [],
            'issues' => [],
        ];
        
        // Check database connection
        try {
            DB::connection()->getPdo();
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Database connection failed: ' . $e->getMessage(),
            ], 500);
        }
        
        // Get all tables
        $tables = DB::select('SHOW TABLES');
        $tableNames = array_map(function($table) {
            return array_values((array)$table)[0];
        }, $tables);
        $status['tables'] = $tableNames;
        
        // Expected tables
        $expectedTables = [
            'users', 'companies', 'roles', 'permissions', 'model_has_roles',
            'model_has_permissions', 'role_has_permissions', 'categories',
            'products', 'movements', 'employees', 'departments', 'asset_assignments',
            'tickets', 'ticket_comments', 'company_invites', 'migrations',
            'password_reset_tokens', 'sessions', 'cache', 'cache_locks',
            'personal_access_tokens', 'failed_jobs', 'jobs', 'job_batches'
        ];
        
        $missingTables = array_diff($expectedTables, $tableNames);
        if (!empty($missingTables)) {
            $status['issues'][] = 'Missing tables: ' . implode(', ', $missingTables);
        }
        
        // Check migrations
        $migrations = DB::table('migrations')->pluck('migration')->toArray();
        $status['migrations'] = [
            'count' => count($migrations),
            'last_5' => array_slice($migrations, -5),
        ];
        
        // Check roles
        if (in_array('roles', $tableNames)) {
            $roles = \Spatie\Permission\Models\Role::all();
            $status['roles'] = $roles->pluck('name')->toArray();
            
            $expectedRoles = ['admin', 'gestor', 'tecnico', 'viewer'];
            $missingRoles = array_diff($expectedRoles, $status['roles']);
            if (!empty($missingRoles)) {
                $status['issues'][] = 'Missing roles: ' . implode(', ', $missingRoles);
            }
        }
        
        // Check permissions
        if (in_array('permissions', $tableNames)) {
            $permissions = \Spatie\Permission\Models\Permission::all();
            $status['permissions'] = [
                'count' => $permissions->count(),
                'names' => $permissions->pluck('name')->toArray(),
            ];
        }
        
        // Check users
        if (in_array('users', $tableNames)) {
            $users = \App\Models\User::all();
            $status['users'] = [
                'count' => $users->count(),
                'emails' => $users->pluck('email')->toArray(),
                'with_company' => $users->whereNotNull('company_id')->count(),
                'without_company' => $users->whereNull('company_id')->count(),
            ];
        }
        
        // Check companies
        if (in_array('companies', $tableNames)) {
            $companies = \App\Models\Company::all();
            $status['companies'] = [
                'count' => $companies->count(),
                'names' => $companies->pluck('name')->toArray(),
            ];
        }
        
        // Overall status
        $status['overall'] = empty($status['issues']) ? 'healthy' : 'issues_found';
        
        return response()->json($status);
        
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
        ], 500);
    }
});






