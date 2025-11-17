<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\MovementController;
use App\Http\Controllers\Api\ProductController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware('throttle:60,1')->group(function () {
    // Public routes
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
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
    });
});

