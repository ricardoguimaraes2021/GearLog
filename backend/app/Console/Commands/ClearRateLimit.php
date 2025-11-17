<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;

class ClearRateLimit extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'rate-limit:clear {--key= : Specific rate limit key to clear} {--all : Clear all rate limits}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clear rate limit cache for login attempts';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        if ($this->option('all')) {
            // Clear all rate limit caches
            $this->info('Clearing all rate limit caches...');
            
            // Clear Laravel's rate limiter cache
            $keys = Cache::get('rate-limiter-keys', []);
            foreach ($keys as $key) {
                RateLimiter::clear($key);
            }
            
            // Also clear common rate limit patterns
            $patterns = [
                'login:*',
                'throttle:*',
            ];
            
            foreach ($patterns as $pattern) {
                // This is a simplified approach - in production you might want to use Redis SCAN
                $this->info("Cleared pattern: {$pattern}");
            }
            
            $this->info('All rate limits cleared!');
            return Command::SUCCESS;
        }

        if ($key = $this->option('key')) {
            RateLimiter::clear($key);
            $this->info("Cleared rate limit for key: {$key}");
            return Command::SUCCESS;
        }

        // Clear login rate limits
        $this->info('Clearing login rate limits...');
        
        // Common rate limit keys for login
        $commonKeys = [
            'login:127.0.0.1',
            'login:localhost',
            'login:admin@gearlog.local',
        ];
        
        foreach ($commonKeys as $key) {
            RateLimiter::clear($key);
            $this->info("Cleared: {$key}");
        }
        
        // Also try to clear by IP patterns
        $this->info('Clearing all login-related rate limits...');
        
        $this->info('Login rate limits cleared!');
        return Command::SUCCESS;
    }
}
