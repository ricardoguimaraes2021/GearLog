<?php

use Laravel\Sanctum\Sanctum;

return [

    'stateful' => array_values(array_filter(array_unique(array_merge(
        // Development domains (only in local environment)
        config('app.env') === 'local' 
            ? explode(',', 'localhost,localhost:3000,localhost:5173,127.0.0.1,127.0.0.1:8000,::1')
            : [],
        // Custom domains from environment
        array_filter(explode(',', env('SANCTUM_STATEFUL_DOMAINS', ''))),
        // Frontend URL from environment (if set) - extract domain without protocol
        env('FRONTEND_URL') ? array_filter([parse_url(env('FRONTEND_URL'), PHP_URL_HOST)]) : [],
        // Current application URL
        array_filter([parse_url(Sanctum::currentApplicationUrlWithPort(), PHP_URL_HOST)])
    )))),

    'guard' => ['web'],

    'expiration' => null,

    'token_prefix' => env('SANCTUM_TOKEN_PREFIX', ''),

    'middleware' => [
        'authenticate_session' => Laravel\Sanctum\Http\Middleware\AuthenticateSession::class,
        'encrypt_cookies' => Illuminate\Cookie\Middleware\EncryptCookies::class,
        'validate_csrf_token' => Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
    ],

];

