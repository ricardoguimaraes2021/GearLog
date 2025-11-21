<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'Admin', description: 'Super admin endpoints for sending custom notifications')]
class NotificationController extends Controller
{
    public function __construct(
        protected NotificationService $notificationService
    ) {
    }

    #[OA\Post(
        path: '/api/v1/admin/notifications/send',
        summary: 'Send custom notification to users (Super Admin only)',
        tags: ['Admin'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['title', 'message', 'type', 'target_type'],
                properties: [
                    new OA\Property(property: 'title', type: 'string', example: 'System Maintenance'),
                    new OA\Property(property: 'message', type: 'string', example: 'Scheduled maintenance on Sunday'),
                    new OA\Property(property: 'type', type: 'string', example: 'system_announcement'),
                    new OA\Property(property: 'target_type', type: 'string', enum: ['all', 'company', 'companies', 'role']),
                    new OA\Property(property: 'company_id', type: 'integer', nullable: true),
                    new OA\Property(property: 'company_ids', type: 'array', items: new OA\Items(type: 'integer'), nullable: true),
                    new OA\Property(property: 'role', type: 'string', nullable: true),
                    new OA\Property(property: 'data', type: 'object', nullable: true),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Notification sent successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string'),
                        new OA\Property(property: 'users_notified', type: 'integer'),
                    ]
                )
            ),
            new OA\Response(response: 403, description: 'Unauthorized'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function send(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'type' => 'required|string|max:100',
            'target_type' => 'required|in:all,company,companies,role',
            'company_id' => 'required_if:target_type,company|nullable|integer|exists:companies,id',
            'company_ids' => 'required_if:target_type,companies|nullable|array',
            'company_ids.*' => 'integer|exists:companies,id',
            'role' => 'required_if:target_type,role|nullable|string',
            'data' => 'nullable|array',
        ]);

        $usersNotified = 0;

        try {
            switch ($validated['target_type']) {
                case 'all':
                    // Notificar todos os utilizadores de todas as empresas
                    $users = \App\Models\User::withoutGlobalScopes()
                        ->whereNotNull('company_id')
                        ->get();
                    $this->notificationService->notifyUsers(
                        $users->all(),
                        $validated['type'],
                        $validated['title'],
                        $validated['message'],
                        $validated['data'] ?? null
                    );
                    $usersNotified = $users->count();
                    break;

                case 'company':
                    // Notificar todos os utilizadores de uma empresa específica
                    $users = \App\Models\User::withoutGlobalScopes()
                        ->where('company_id', $validated['company_id'])
                        ->get();
                    $this->notificationService->notifyUsers(
                        $users->all(),
                        $validated['type'],
                        $validated['title'],
                        $validated['message'],
                        $validated['data'] ?? null
                    );
                    $usersNotified = $users->count();
                    break;

                case 'companies':
                    // Notificar utilizadores de múltiplas empresas
                    $users = \App\Models\User::withoutGlobalScopes()
                        ->whereIn('company_id', $validated['company_ids'])
                        ->get();
                    $this->notificationService->notifyUsers(
                        $users->all(),
                        $validated['type'],
                        $validated['title'],
                        $validated['message'],
                        $validated['data'] ?? null
                    );
                    $usersNotified = $users->count();
                    break;

                case 'role':
                    // Notificar utilizadores com um role específico em todas as empresas
                    $users = \App\Models\User::withoutGlobalScopes()
                        ->whereNotNull('company_id')
                        ->role($validated['role'])
                        ->get();
                    $this->notificationService->notifyUsers(
                        $users->all(),
                        $validated['type'],
                        $validated['title'],
                        $validated['message'],
                        $validated['data'] ?? null
                    );
                    $usersNotified = $users->count();
                    break;
            }

            Log::info('Custom notification sent by super admin', [
                'sent_by' => auth()->id(),
                'target_type' => $validated['target_type'],
                'users_notified' => $usersNotified,
                'type' => $validated['type'],
            ]);

            return response()->json([
                'message' => 'Notification sent successfully',
                'users_notified' => $usersNotified,
            ], 200);

        } catch (\Exception $e) {
            Log::error('Failed to send custom notification', [
                'error' => $e->getMessage(),
                'target_type' => $validated['target_type'] ?? null,
            ]);

            return response()->json([
                'error' => 'Failed to send notification: ' . $e->getMessage(),
            ], 500);
        }
    }
}

