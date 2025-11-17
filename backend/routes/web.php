<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'message' => 'GearLog API',
        'version' => '1.0.0',
        'docs' => url('/api/documentation'),
    ]);
});

// Sanctum CSRF cookie route
Route::get('/sanctum/csrf-cookie', function () {
    return response()->json(['message' => 'CSRF cookie set']);
})->middleware('web');

