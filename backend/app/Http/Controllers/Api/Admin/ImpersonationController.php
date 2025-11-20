<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Laravel\Sanctum\PersonalAccessToken;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'Admin', description: 'Super admin endpoints for user impersonation')]
class ImpersonationController extends Controller
{
    #[OA\Post(
        path: '/api/v1/admin/impersonate/{userId}',
        summary: 'Impersonate a user (Super Admin only)',
        tags: ['Admin'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'userId', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Impersonation started successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'user', type: 'object'),
                        new OA\Property(property: 'token', type: 'string'),
                        new OA\Property(property: 'original_user_id', type: 'integer'),
                    ]
                )
            ),
            new OA\Response(response: 403, description: 'Unauthorized'),
            new OA\Response(response: 404, description: 'User not found'),
        ]
    )]
    public function impersonate($userId)
    {
        $targetUser = User::withoutGlobalScopes()->find($userId);

        if (!$targetUser) {
            return response()->json([
                'error' => 'User not found.',
            ], 404);
        }

        $adminUser = Auth::user();

        // Create impersonation token
        $token = $targetUser->createToken('impersonation-token', ['impersonated'])->plainTextToken;

        // Store original user ID in token metadata (we'll use a custom approach)
        // Since Sanctum doesn't support metadata directly, we'll log it and return it
        
        Log::info('User impersonation started', [
            'admin_user_id' => $adminUser->id,
            'admin_email' => $adminUser->email,
            'target_user_id' => $targetUser->id,
            'target_email' => $targetUser->email,
            'target_company_id' => $targetUser->company_id,
        ]);

        return response()->json([
            'user' => $targetUser->load('roles', 'company'),
            'token' => $token,
            'original_user_id' => $adminUser->id,
            'message' => 'Impersonation started. Use this token to authenticate as the target user.',
        ]);
    }

    #[OA\Post(
        path: '/api/v1/admin/stop-impersonation',
        summary: 'Stop impersonation and return to admin account (Super Admin only)',
        tags: ['Admin'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Impersonation stopped successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string'),
                        new OA\Property(property: 'original_user_id', type: 'integer'),
                    ]
                )
            ),
            new OA\Response(response: 403, description: 'Unauthorized'),
        ]
    )]
    public function stopImpersonation(Request $request)
    {
        $currentUser = Auth::user();
        
        // Delete current impersonation token
        try {
            $token = $currentUser->currentAccessToken();
            if ($token && $token instanceof PersonalAccessToken) {
                $token->delete();
            }
        } catch (\Exception $e) {
            // Token might not exist or already deleted
        }

        Log::info('User impersonation stopped', [
            'user_id' => $currentUser->id,
            'email' => $currentUser->email,
        ]);

        return response()->json([
            'message' => 'Impersonation stopped. Please login again with your admin credentials.',
        ]);
    }
}
