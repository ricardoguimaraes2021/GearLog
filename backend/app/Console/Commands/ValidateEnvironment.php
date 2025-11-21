<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ValidateEnvironment extends Command
{
    protected $signature = 'env:validate';
    protected $description = 'Validate critical environment variables';

    public function handle(): int
    {
        $errors = [];
        $warnings = [];

        // Critical variables
        $critical = [
            'APP_KEY' => 'Application encryption key',
            'DB_CONNECTION' => 'Database connection type',
            'DB_HOST' => 'Database host',
            'DB_DATABASE' => 'Database name',
            'DB_USERNAME' => 'Database username',
            'DB_PASSWORD' => 'Database password',
        ];

        foreach ($critical as $key => $description) {
            $value = env($key);
            if (empty($value)) {
                $errors[] = "Missing critical variable: {$key} ({$description})";
            }
        }

        // Test database connection if credentials are set
        if (env('DB_CONNECTION') && env('DB_HOST')) {
            try {
                DB::connection()->getPdo();
            } catch (\Exception $e) {
                $errors[] = "Database connection failed: " . $e->getMessage();
            }
        }

        // Important variables (warnings)
        $important = [
            'FRONTEND_URL' => 'Frontend URL for CORS',
            'BROADCAST_DRIVER' => 'Broadcasting driver',
        ];

        foreach ($important as $key => $description) {
            $value = env($key);
            if (empty($value) && config('app.env') === 'production') {
                $warnings[] = "Missing important variable in production: {$key} ({$description})";
            }
        }

        // Pusher configuration (optional but recommended)
        if (env('BROADCAST_DRIVER') === 'pusher') {
            $pusherVars = [
                'PUSHER_APP_ID' => 'Pusher App ID',
                'PUSHER_APP_KEY' => 'Pusher App Key',
                'PUSHER_APP_SECRET' => 'Pusher App Secret',
                'PUSHER_APP_CLUSTER' => 'Pusher Cluster',
            ];

            foreach ($pusherVars as $key => $description) {
                if (empty(env($key))) {
                    $warnings[] = "Pusher configured but missing: {$key} ({$description})";
                }
            }
        }

        // Display results
        if (!empty($errors)) {
            $this->error('Environment validation failed!');
            foreach ($errors as $error) {
                $this->error("  ✗ {$error}");
            }
            return Command::FAILURE;
        }

        if (!empty($warnings)) {
            $this->warn('Environment validation passed with warnings:');
            foreach ($warnings as $warning) {
                $this->warn("  ⚠ {$warning}");
            }
            return Command::SUCCESS;
        }

        $this->info('✓ Environment validation passed!');
        return Command::SUCCESS;
    }
}

