<?php

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie', 'broadcasting/*', 'login', 'logout', 'register', 'onboarding'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_values(array_filter(array_unique(array_merge(
        // Development origins (only in local environment)
        config('app.env') === 'local' ? ['http://localhost:5173', 'http://127.0.0.1:5173'] : [],
        // Production/staging origins from environment
        explode(',', env('CORS_ALLOWED_ORIGINS', '')),
        // Frontend URL from environment (if set)
        env('FRONTEND_URL') ? [env('FRONTEND_URL')] : []
    )))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];

