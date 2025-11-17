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

// Broadcasting authentication (only if Pusher is configured)
if (env('BROADCAST_DRIVER') === 'pusher' && env('PUSHER_APP_KEY')) {
    Broadcast::routes(['middleware' => ['auth:sanctum']]);
}

