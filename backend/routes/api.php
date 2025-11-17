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
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware('throttle:60,1')->group(function () {
    // Public routes
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:20,1');
    Route::get('/products/{product}/public', [ProductController::class, 'showPublic']);

    // Protected routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/user', [AuthController::class, 'user']);

        // Products
        Route::apiResource('products', ProductController::class);
        Route::post('/products/{product}/movements', [MovementController::class, 'store']);
        Route::get('/products/{product}/movements', [MovementController::class, 'index']);
        Route::get('/products/export/{format}', [ProductController::class, 'export'])->name('products.export');

        // Categories
        Route::apiResource('categories', CategoryController::class);

        // Dashboard
        Route::get('/dashboard', [DashboardController::class, 'index']);

        // Users (for assignment)
        Route::get('/users', [UserController::class, 'index']);

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

            // Departments
            Route::apiResource('departments', DepartmentController::class);

            // Assignments
            Route::post('/assignments/checkout', [AssignmentController::class, 'checkout']);
            Route::post('/assignments/{assignment}/checkin', [AssignmentController::class, 'checkin']);
            Route::get('/assignments/history/employee/{employee}', [AssignmentController::class, 'historyByEmployee']);
            Route::get('/assignments/history/asset/{product}', [AssignmentController::class, 'historyByAsset']);
        });
    });

