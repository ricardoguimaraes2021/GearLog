<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

// Schedule database backup daily at 2 AM
Schedule::command('db:backup --compress')
    ->dailyAt('02:00')
    ->onFailure(function () {
        \Illuminate\Support\Facades\Log::error('Scheduled database backup failed');
    });

// Schedule SLA violations update hourly
Schedule::command('tickets:update-sla-violations')
    ->hourly();

