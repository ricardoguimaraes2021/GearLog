<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rules\Password;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'Profile', description: 'User profile management endpoints')]
class ProfileController extends Controller
{
    public function __construct(
        protected AuditLogService $auditLogService
    ) {
    }
    #[OA\Get(
        path: '/api/v1/profile',
        summary: 'Get current user profile',
        tags: ['Profile'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'User profile data',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'user', type: 'object'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function show(Request $request)
    {
        $user = $request->user()->load('roles', 'company');
        
        return response()->json([
            'user' => $user,
        ]);
    }

    #[OA\Put(
        path: '/api/v1/profile',
        summary: 'Update user profile',
        tags: ['Profile'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['name'],
                properties: [
                    new OA\Property(property: 'name', type: 'string', maxLength: 255),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Profile updated successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string'),
                        new OA\Property(property: 'user', type: 'object'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function update(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $user->update($validated);

        Log::info('User profile updated', [
            'user_id' => $user->id,
            'email' => $user->email,
        ]);

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => $user->fresh()->load('roles', 'company'),
        ]);
    }

    #[OA\Put(
        path: '/api/v1/profile/password',
        summary: 'Change user password',
        tags: ['Profile'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['current_password', 'password', 'password_confirmation'],
                properties: [
                    new OA\Property(property: 'current_password', type: 'string'),
                    new OA\Property(property: 'password', type: 'string', minLength: 8),
                    new OA\Property(property: 'password_confirmation', type: 'string'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Password changed successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function updatePassword(Request $request)
    {
        try {
            // Only log in development to avoid performance issues
            if (config('app.env') === 'local') {
                Log::info('Password update request received', [
                    'user_id' => $request->user()?->id,
                    'email' => $request->user()?->email,
                ]);
            }

            $user = $request->user();

            if (!$user) {
                Log::error('Password update failed: User not authenticated');
                return response()->json([
                    'error' => 'User not authenticated.',
                ], 401);
            }

            $validated = $request->validate([
                'current_password' => 'required|string',
                'password' => [
                    'required',
                    'string',
                    'confirmed',
                    Password::min(12)
                        ->mixedCase()
                        ->numbers()
                        ->symbols()
                        // Temporariamente desabilitado devido a erro SSL
                        // ->uncompromised(),
                ],
            ]);

            // Verify current password
            if (!Hash::check($validated['current_password'], $user->password)) {
                if (config('app.env') === 'local') {
                    Log::warning('Password update failed: Current password incorrect', ['user_id' => $user->id]);
                }
                return response()->json([
                    'error' => 'Current password is incorrect.',
                ], 422);
            }

            // Check if password was used recently
            if ($user->hasUsedPassword($validated['password'])) {
                if (config('app.env') === 'local') {
                    Log::warning('Password update failed: Password was used recently', ['user_id' => $user->id]);
                }
                return response()->json([
                    'error' => 'You cannot reuse your last 5 passwords. Please choose a different password.',
                ], 422);
            }

            // Save current password to history before updating
            try {
                $currentPasswordHash = $user->password;
                $user->savePasswordToHistory($currentPasswordHash);
            } catch (\Exception $e) {
                // Log error but don't fail password update
                if (config('app.env') === 'local') {
                    Log::error('Failed to save password to history', [
                        'user_id' => $user->id,
                        'error' => $e->getMessage(),
                    ]);
                }
                // Continue with password update even if history save fails
            }

            // Update password
            $newPasswordHash = Hash::make($validated['password']);
            $user->update([
                'password' => $newPasswordHash,
            ]);

            // Log password change to audit log (wrap in try-catch to prevent failure if audit log fails)
            try {
                $this->auditLogService->logPasswordChange($user->id, $request);
            } catch (\Exception $e) {
                // Log error but don't fail password update
                if (config('app.env') === 'local') {
                    Log::warning('Failed to log password change to audit log', [
                        'user_id' => $user->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            return response()->json([
                'message' => 'Password changed successfully.',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Password update validation failed', [
                'user_id' => $request->user()?->id,
                'errors' => $e->errors(),
            ]);
            throw $e;
        } catch (\Exception $e) {
            Log::error('Password update failed with exception', [
                'user_id' => $request->user()?->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'error' => 'An error occurred while updating your password. Please try again.',
            ], 500);
        }
    }
}
