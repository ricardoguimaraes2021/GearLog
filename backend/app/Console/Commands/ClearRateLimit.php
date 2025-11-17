<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\RateLimiter;

class ClearRateLimit extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'rate-limit:clear {key? : The rate limiter key to clear (default: all)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clear rate limiting cache for login or all endpoints';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $key = $this->argument('key');

        if ($key) {
            RateLimiter::clear($key);
            $this->info("Rate limit cleared for: {$key}");
        } else {
            // Clear common rate limit keys
            RateLimiter::clear('login');
            RateLimiter::clear('api');
            $this->info('Rate limits cleared for all endpoints');
        }

        return Command::SUCCESS;
    }
}
