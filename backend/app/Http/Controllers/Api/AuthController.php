<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'Authentication', description: 'User authentication endpoints')]
class AuthController extends Controller
{
    #[OA\Post(
        path: '/api/v1/login',
        summary: 'User login',
        tags: ['Authentication'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['email', 'password'],
                properties: [
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'admin@gearlog.local'),
                    new OA\Property(property: 'password', type: 'string', format: 'password', example: 'password'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Login successful',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'user', type: 'object'),
                        new OA\Property(property: 'token', type: 'string'),
                    ]
                )
            ),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $user = Auth::user();
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user->load('roles'),
            'token' => $token,
        ]);
    }

    #[OA\Post(
        path: '/api/v1/logout',
        summary: 'User logout',
        tags: ['Authentication'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(response: 200, description: 'Logout successful'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function logout(Request $request)
    {
        // Delete the current access token if it exists
        // If token was already deleted or doesn't exist, that's fine - user is already logged out
        try {
            $user = $request->user();
            if ($user) {
                try {
                    $token = $user->currentAccessToken();
                    
                    // Only delete if it's a PersonalAccessToken (not TransientToken from cookies)
                    // TransientToken doesn't have a delete() method and doesn't need to be deleted
                    if ($token && $token instanceof PersonalAccessToken) {
                        $token->delete();
                    }
                } catch (\Exception $tokenException) {
                    // currentAccessToken() might throw if token doesn't exist
                    // Or it might be a TransientToken which doesn't need deletion
                    // This is fine - user is already logged out
                    Log::debug('Logout: Token handling', [
                        'user_id' => $user->id,
                        'error' => $tokenException->getMessage(),
                    ]);
                }
            }
        } catch (\Exception $e) {
            // Any other error - log but don't fail
            // User is effectively logged out anyway
            Log::warning('Logout: Error during logout process', [
                'error' => $e->getMessage(),
                'user_id' => $request->user()?->id ?? null,
            ]);
        }

        return response()->json(['message' => 'Logged out successfully']);
    }

    #[OA\Get(
        path: '/api/v1/user',
        summary: 'Get current authenticated user',
        tags: ['Authentication'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'User information',
                content: new OA\JsonContent(type: 'object')
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function user(Request $request)
    {
        return response()->json($request->user()->load('roles', 'permissions'));
    }
}
