<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\MovementController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\TicketController;
use App\Http\Controllers\Api\TicketCommentController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\TicketDashboardController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\AssignmentController;
use App\Http\Controllers\Api\Admin\CompanyController as AdminCompanyController;
use App\Http\Controllers\Api\Admin\ImpersonationController as AdminImpersonationController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\CompanySettingsController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware('throttle:60,1')->group(function () {
    // Public routes
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:30,1');
    Route::get('/products/{product}/public', [ProductController::class, 'showPublic']);

    // Public auth routes (no tenant required - for registration/onboarding)
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/onboarding', [AuthController::class, 'onboarding'])->middleware('auth:sanctum');

    // Protected routes (require auth but not tenant - for logout/user info)
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/user', [AuthController::class, 'user']);
    });

    // Protected routes (require auth AND tenant)
    Route::middleware(['auth:sanctum', 'tenant'])->group(function () {

        // Profile
        Route::get('/profile', [ProfileController::class, 'show']);
        Route::put('/profile', [ProfileController::class, 'update']);
        Route::put('/profile/password', [ProfileController::class, 'updatePassword']);

        // Company Settings
        Route::get('/company', [CompanySettingsController::class, 'show']);
        Route::put('/company', [CompanySettingsController::class, 'update']);
        Route::get('/company/usage', [CompanySettingsController::class, 'usage']);
        Route::get('/company/plan', [CompanySettingsController::class, 'plan']);

        // Products
        Route::apiResource('products', ProductController::class);
        Route::post('/products/{product}/movements', [MovementController::class, 'store']);
        Route::get('/products/{product}/movements', [MovementController::class, 'index']);
        Route::get('/products/export/{format}', [ProductController::class, 'export'])->name('products.export');

        // Categories
        Route::apiResource('categories', CategoryController::class);

        // Dashboard
        Route::get('/dashboard', [DashboardController::class, 'index']);

        // Users (for assignment and role management)
        Route::get('/users', [UserController::class, 'index']);
        Route::put('/users/{id}/roles', [UserController::class, 'updateRoles']);

        // Tickets
        Route::get('/tickets/dashboard', [TicketDashboardController::class, 'index']);
        Route::apiResource('tickets', TicketController::class);
        Route::post('/tickets/{ticket}/assign', [TicketController::class, 'assign']);
        Route::post('/tickets/{ticket}/status', [TicketController::class, 'updateStatus']);
        Route::post('/tickets/{ticket}/resolve', [TicketController::class, 'resolve']);
        Route::post('/tickets/{ticket}/close', [TicketController::class, 'close']);
        Route::get('/tickets/{ticket}/logs', [TicketController::class, 'logs']);
        Route::get('/tickets/{ticket}/comments', [TicketCommentController::class, 'index']);
        Route::post('/tickets/{ticket}/comments', [TicketCommentController::class, 'store']);

            // Notifications
            Route::get('/notifications', [NotificationController::class, 'index']);
            Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
            Route::post('/notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
            Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
            Route::post('/notifications/test', [NotificationController::class, 'test']);
            Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy']);

            // Employees
            Route::apiResource('employees', EmployeeController::class);
            Route::post('/employees/{employee}/deactivate', [EmployeeController::class, 'deactivate']);
            Route::post('/employees/{employee}/reactivate', [EmployeeController::class, 'reactivate']);
            Route::get('/employees/export/{format}', [EmployeeController::class, 'export'])->name('employees.export');

            // Departments
            Route::apiResource('departments', DepartmentController::class);
            Route::get('/departments/stats/usage', [DepartmentController::class, 'usageStats']);

            // Assignments
            Route::post('/assignments/checkout', [AssignmentController::class, 'checkout']);
            Route::post('/assignments/{assignment}/checkin', [AssignmentController::class, 'checkin']);
            Route::get('/assignments/history/employee/{employee}', [AssignmentController::class, 'historyByEmployee']);
            Route::get('/assignments/history/asset/{product}', [AssignmentController::class, 'historyByAsset']);
        });

    // Super Admin routes (no tenant middleware, but requires super admin)
    Route::prefix('admin')->middleware(['auth:sanctum', 'superadmin'])->group(function () {
        // Company management
        Route::get('/companies', [AdminCompanyController::class, 'index']);
        Route::get('/companies/{id}', [AdminCompanyController::class, 'show']);
        Route::post('/companies/{id}/suspend', [AdminCompanyController::class, 'suspend']);
        Route::post('/companies/{id}/activate', [AdminCompanyController::class, 'activate']);
        Route::put('/companies/{id}/plan', [AdminCompanyController::class, 'updatePlan']);
        Route::get('/companies/{id}/logs', [AdminCompanyController::class, 'logs']);

        // User management
        Route::get('/users', [\App\Http\Controllers\Api\Admin\UserController::class, 'index']);

        // Analytics
        Route::get('/analytics/global', [\App\Http\Controllers\Api\Admin\AnalyticsController::class, 'global']);

        // Security logs
        Route::get('/logs/security', [\App\Http\Controllers\Api\Admin\SecurityLogController::class, 'index']);

        // User impersonation
        Route::post('/impersonate/{userId}', [AdminImpersonationController::class, 'impersonate']);
        Route::post('/stop-impersonation', [AdminImpersonationController::class, 'stopImpersonation']);
    });
});

