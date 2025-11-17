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
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware('throttle:60,1')->group(function () {
    // Public routes
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
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
        Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy']);
    });
});

