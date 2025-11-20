<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
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

        // Load company only if user has one
        $userData = $user->load('roles');
        if ($user->company_id) {
            $userData->load('company');
        }

        return response()->json([
            'user' => $userData,
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
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'company_id' => null, // Will be set during onboarding
            'is_owner' => false, // Will be set during onboarding
        ]);

        // Assign default role (will be updated during onboarding)
        $user->assignRole('consulta'); // Temporary role until onboarding

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
                required: ['company_name', 'country', 'timezone'],
                properties: [
                    new OA\Property(property: 'company_name', type: 'string', example: 'Acme Corp'),
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

        $request->validate([
            'company_name' => 'required|string|max:255',
            'country' => 'nullable|string|max:255',
            'timezone' => 'nullable|string|max:255',
        ]);

        try {
            DB::beginTransaction();

            // Create company
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
}
