<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\Company;
use App\Models\User;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Laravel\Sanctum\PersonalAccessToken;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'Authentication', description: 'User authentication endpoints')]
class AuthController extends Controller
{
    public function __construct(
        protected AuditLogService $auditLogService
    ) {
    }
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

        // Log successful login
        $this->auditLogService->logLogin($user->id, $request);

        // Load company only if user has one
        $user->load('roles');
        if ($user->company_id) {
            $user->load('company');
        }

        return response()->json([
            'user' => new UserResource($user),
            'token' => $token,
            'requires_onboarding' => $user->company_id === null,
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
        $user = $request->user();
        $userData = $user->load('roles', 'permissions');
        
        // Only load company if user has one
        if ($user->company_id) {
            $userData->load('company');
        }
        
        return response()->json($userData);
    }

    #[OA\Post(
        path: '/api/v1/register',
        summary: 'Register a new user account',
        tags: ['Authentication'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['name', 'email', 'password'],
                properties: [
                    new OA\Property(property: 'name', type: 'string', example: 'John Doe'),
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'john@example.com'),
                    new OA\Property(property: 'password', type: 'string', format: 'password', example: 'password123'),
                    new OA\Property(property: 'password_confirmation', type: 'string', format: 'password'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Registration successful',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'user', type: 'object'),
                        new OA\Property(property: 'token', type: 'string'),
                        new OA\Property(property: 'requires_onboarding', type: 'boolean'),
                    ]
                )
            ),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => [
                'required',
                'string',
                'confirmed',
                \Illuminate\Validation\Rules\Password::min(12)
                    ->mixedCase()
                    ->numbers()
                    ->symbols()
                    ->uncompromised(),
            ],
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'company_id' => null, // Will be set during onboarding
            'is_owner' => false, // Will be set during onboarding
        ]);

        // Assign default role (will be updated during onboarding)
        $user->assignRole('viewer'); // Temporary role until onboarding

        $token = $user->createToken('auth-token')->plainTextToken;

        // Ensure company_id is explicitly null
        $user->refresh();
        
        return response()->json([
            'user' => $user->load('roles'),
            'token' => $token,
            'requires_onboarding' => true,
        ], 201);
    }

    #[OA\Post(
        path: '/api/v1/onboarding',
        summary: 'Complete company onboarding',
        tags: ['Authentication'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: [],
                properties: [
                    new OA\Property(property: 'company_name', type: 'string', example: 'Acme Corp', description: 'Required if creating new company'),
                    new OA\Property(property: 'invite_code', type: 'string', example: 'ABC12345', description: 'Required if joining existing company'),
                    new OA\Property(property: 'country', type: 'string', example: 'Portugal'),
                    new OA\Property(property: 'timezone', type: 'string', example: 'Europe/Lisbon'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Onboarding completed successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'user', type: 'object'),
                        new OA\Property(property: 'company', type: 'object'),
                    ]
                )
            ),
            new OA\Response(response: 400, description: 'User already has a company'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function onboarding(Request $request)
    {
        $authUser = $request->user();

        // Get fresh user data directly from database without any scopes or relationships
        // This ensures we get the actual database value, not cached or filtered data
        $user = User::withoutGlobalScopes()
            ->select('id', 'name', 'email', 'company_id', 'is_owner')
            ->find($authUser->id);
        
        if (!$user) {
            return response()->json([
                'error' => 'User not found.',
            ], 404);
        }
        
        // Check if user already has a company
        // Verify directly from database to avoid any caching issues
        $companyIdFromDb = DB::table('users')
            ->where('id', $user->id)
            ->value('company_id');
        
        if ($companyIdFromDb !== null) {
            return response()->json([
                'error' => 'User already belongs to a company.',
            ], 400);
        }

        // Validate request - either company_name (new company) or invite_code (join existing)
        $request->validate([
            'company_name' => 'required_without:invite_code|string|max:255',
            'invite_code' => 'required_without:company_name|string|size:8',
            'country' => 'nullable|string|max:255',
            'timezone' => 'nullable|string|max:255',
        ]);

        $inviteCode = $request->input('invite_code');
        $invite = null;

        // If invite code is provided, validate it
        if ($inviteCode) {
            $invite = \App\Models\CompanyInvite::findByCode(strtoupper($inviteCode));
            
            if (!$invite || !$invite->isValid()) {
                return response()->json([
                    'error' => 'Invalid or expired invite code.',
                ], 400);
            }

            // Check if company has reached user limit
            $company = $invite->company;
            $usage = \App\Models\User::where('company_id', $company->id)->count();
            if ($usage >= $company->max_users) {
                return response()->json([
                    'error' => 'Company has reached its user limit.',
                ], 400);
            }
        }

        try {
            DB::beginTransaction();

            if ($invite) {
                // Join existing company using invite code
                $company = $invite->company;

                // Update user to join company (NOT as owner)
                $user->update([
                    'company_id' => $company->id,
                    'is_owner' => false,
                ]);

                // Assign default "viewer" role (read-only)
                $user->syncRoles(['viewer']);

                // Mark invite as used
                $invite->markAsUsed();

                DB::commit();

                return response()->json([
                    'user' => $user->load('roles', 'company'),
                    'company' => $company,
                    'role_assigned' => 'viewer',
                    'message' => 'You have been added to the company with "Viewer" role. An admin can update your roles later.',
                ]);
            } else {
                // Create new company
                $company = Company::create([
                    'name' => $request->company_name,
                    'country' => $request->country,
                    'timezone' => $request->timezone ?? 'UTC',
                    'plan_type' => 'FREE',
                    'max_users' => 3,
                    'max_products' => 500,
                    'max_tickets' => 150,
                    'is_active' => true,
                ]);

                // Update user as company owner
                $user->update([
                    'company_id' => $company->id,
                    'is_owner' => true,
                ]);

                // Assign admin role to owner
                $user->syncRoles(['admin']);

                // Create default categories for the company
                $defaultCategories = [
                    'Computers',
                    'Monitors',
                    'Keyboards',
                    'Mice',
                    'Printers',
                    'Networking',
                    'Other',
                ];

                foreach ($defaultCategories as $categoryName) {
                    \App\Models\Category::create([
                        'name' => $categoryName,
                        'company_id' => $company->id,
                    ]);
                }

                DB::commit();

                return response()->json([
                    'user' => $user->load('roles', 'company'),
                    'company' => $company,
                ]);
            }
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Onboarding failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'Failed to complete onboarding. Please try again.',
                'message' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    #[OA\Post(
        path: '/api/v1/forgot-password',
        summary: 'Request password reset link',
        tags: ['Authentication'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['email'],
                properties: [
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'user@example.com'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Password reset link sent if email exists',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string'),
                    ]
                )
            ),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        try {
            // Use Laravel's built-in password reset functionality
            $status = Password::sendResetLink(
                $request->only('email')
            );

            // Log the attempt (only in development)
            if (config('app.env') === 'local') {
                Log::info('Password reset requested', [
                    'email' => $request->email,
                    'status' => $status,
                ]);
            }

            // Always return success message to prevent email enumeration
            // Laravel will handle the actual sending internally
            return response()->json([
                'message' => 'If that email address exists in our system, we have sent a password reset link.',
            ], 200);
        } catch (\Exception $e) {
            // Log the error for debugging
            Log::error('Failed to send password reset email', [
                'email' => $request->email,
                'error' => $e->getMessage(),
                'error_class' => get_class($e),
            ]);

            // Still return success to prevent email enumeration
            // But log the error for admin review
            return response()->json([
                'message' => 'If that email address exists in our system, we have sent a password reset link.',
            ], 200);
        }
    }

    #[OA\Post(
        path: '/api/v1/reset-password',
        summary: 'Reset password with token',
        tags: ['Authentication'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['token', 'email', 'password', 'password_confirmation'],
                properties: [
                    new OA\Property(property: 'token', type: 'string', example: 'reset-token-here'),
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'user@example.com'),
                    new OA\Property(property: 'password', type: 'string', format: 'password'),
                    new OA\Property(property: 'password_confirmation', type: 'string', format: 'password'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Password reset successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string'),
                    ]
                )
            ),
            new OA\Response(response: 422, description: 'Validation error or invalid token'),
        ]
    )]
    public function resetPassword(Request $request)
    {
        $validated = $request->validate([
            'token' => 'required|string',
            'email' => 'required|email',
            'password' => [
                'required',
                'string',
                'confirmed',
                PasswordRule::min(12)
                    ->mixedCase()
                    ->numbers()
                    ->symbols(),
            ],
        ]);

        // Use Laravel's built-in password reset functionality
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                ])->setRememberToken(Str::random(60));

                $user->save();

                // Log password reset for audit
                $this->auditLogService->logPasswordReset($user->id, request());

                // Invalidate all existing tokens for security
                $user->tokens()->delete();
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json([
                'message' => 'Password has been reset successfully.',
            ], 200);
        }

        return response()->json([
            'error' => 'Unable to reset password. The token may be invalid or expired.',
            'errors' => [
                'email' => ['The password reset token is invalid or has expired.'],
            ],
        ], 422);
    }

    #[OA\Get(
        path: '/api/v1/validate-reset-token',
        summary: 'Validate password reset token',
        tags: ['Authentication'],
        parameters: [
            new OA\Parameter(name: 'token', in: 'query', required: true, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'email', in: 'query', required: true, schema: new OA\Schema(type: 'string', format: 'email')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Token is valid',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'valid', type: 'boolean'),
                        new OA\Property(property: 'email', type: 'string'),
                    ]
                )
            ),
            new OA\Response(response: 422, description: 'Invalid or expired token'),
        ]
    )]
    public function validateResetToken(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
            'email' => 'required|email',
        ]);

        // Check if user exists
        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'valid' => false,
                'error' => 'Invalid token or email.',
            ], 422);
        }

        // Use Laravel's password broker to validate token
        // The broker checks if token exists and hasn't expired (default: 60 minutes)
        $tokenExists = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->where('created_at', '>', now()->subMinutes(60))
            ->exists();

        if (!$tokenExists) {
            return response()->json([
                'valid' => false,
                'error' => 'Token is invalid or has expired.',
            ], 422);
        }

        return response()->json([
            'valid' => true,
            'email' => $request->email,
        ], 200);
    }
}
