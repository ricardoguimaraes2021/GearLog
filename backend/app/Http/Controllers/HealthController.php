<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class HealthController extends Controller
{
    public function check(): JsonResponse
    {
        $checks = [
            'database' => $this->checkDatabase(),
            'cache' => $this->checkCache(),
            'storage' => $this->checkStorage(),
            'broadcasting' => $this->checkBroadcasting(),
        ];

        $allHealthy = collect($checks)->every(fn($check) => $check['status'] === 'healthy');

        return response()->json([
            'status' => $allHealthy ? 'healthy' : 'degraded',
            'timestamp' => now()->toIso8601String(),
            'checks' => $checks,
        ], $allHealthy ? 200 : 503);
    }

    private function checkDatabase(): array
    {
        try {
            DB::connection()->getPdo();
            DB::select('SELECT 1');
            return [
                'status' => 'healthy',
                'message' => 'Database connection successful',
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'unhealthy',
                'message' => 'Database connection failed: ' . $e->getMessage(),
            ];
        }
    }

    private function checkCache(): array
    {
        try {
            $key = 'health_check_' . time();
            Cache::put($key, 'test', 10);
            $value = Cache::get($key);
            Cache::forget($key);

            if ($value === 'test') {
                return [
                    'status' => 'healthy',
                    'message' => 'Cache is working',
                ];
            }

            return [
                'status' => 'unhealthy',
                'message' => 'Cache read/write test failed',
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'unhealthy',
                'message' => 'Cache check failed: ' . $e->getMessage(),
            ];
        }
    }

    private function checkStorage(): array
    {
        try {
            $testFile = 'health_check_' . time() . '.txt';
            Storage::disk('public')->put($testFile, 'test');
            $exists = Storage::disk('public')->exists($testFile);
            Storage::disk('public')->delete($testFile);

            if ($exists) {
                return [
                    'status' => 'healthy',
                    'message' => 'Storage is writable',
                ];
            }

            return [
                'status' => 'unhealthy',
                'message' => 'Storage write test failed',
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'unhealthy',
                'message' => 'Storage check failed: ' . $e->getMessage(),
            ];
        }
    }

    private function checkBroadcasting(): array
    {
        $driver = config('broadcasting.default');
        
        if ($driver === 'log' || $driver === 'null') {
            return [
                'status' => 'healthy',
                'message' => 'Broadcasting disabled (using ' . $driver . ' driver)',
            ];
        }

        if ($driver === 'pusher') {
            $required = ['PUSHER_APP_ID', 'PUSHER_APP_KEY', 'PUSHER_APP_SECRET', 'PUSHER_APP_CLUSTER'];
            $missing = collect($required)->filter(fn($key) => empty(env($key)));

            if ($missing->isEmpty()) {
                return [
                    'status' => 'healthy',
                    'message' => 'Pusher configuration present',
                ];
            }

            return [
                'status' => 'degraded',
                'message' => 'Pusher configured but missing: ' . $missing->join(', '),
            ];
        }

        return [
            'status' => 'healthy',
            'message' => 'Broadcasting driver: ' . $driver,
        ];
    }
}

