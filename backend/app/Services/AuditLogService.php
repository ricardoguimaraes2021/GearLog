<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AuditLogService
{
    /**
     * Log an audit event
     */
    public function log(
        string $action,
        ?int $userId = null,
        ?string $table = null,
        ?int $recordId = null,
        ?array $oldValue = null,
        ?array $newValue = null,
        ?Request $request = null
    ): AuditLog {
        try {
            $ipAddress = $request?->ip();
            $userAgent = $request?->userAgent();

            return AuditLog::create([
                'user_id' => $userId ?? auth()->id(),
                'action' => $action,
                'table' => $table,
                'record_id' => $recordId,
                'old_value' => $oldValue,
                'new_value' => $newValue,
                'ip_address' => $ipAddress,
                'user_agent' => $userAgent,
            ]);
        } catch (\Exception $e) {
            // Log error but don't fail the operation
            Log::error('Failed to create audit log', [
                'action' => $action,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Log user login
     */
    public function logLogin(int $userId, Request $request): void
    {
        $this->log('login', $userId, 'users', $userId, null, null, $request);
    }

    /**
     * Log password change
     */
    public function logPasswordChange(int $userId, Request $request): void
    {
        $this->log('password_changed', $userId, 'users', $userId, null, null, $request);
    }

    /**
     * Log data modification
     */
    public function logDataModification(
        string $action,
        string $table,
        int $recordId,
        ?array $oldValue = null,
        ?array $newValue = null
    ): void {
        $this->log($action, auth()->id(), $table, $recordId, $oldValue, $newValue, request());
    }

    /**
     * Log permission/role change
     */
    public function logPermissionChange(int $userId, array $oldRoles, array $newRoles, Request $request): void
    {
        $this->log(
            'permission_changed',
            auth()->id(),
            'users',
            $userId,
            ['roles' => $oldRoles],
            ['roles' => $newRoles],
            $request
        );
    }

    /**
     * Cleanup old audit logs (older than 1 year)
     */
    public function cleanupOldLogs(): int
    {
        $cutoffDate = now()->subYear();
        return AuditLog::where('created_at', '<', $cutoffDate)->delete();
    }
}

