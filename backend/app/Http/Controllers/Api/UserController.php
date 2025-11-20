<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'Users', description: 'User management endpoints')]
class UserController extends Controller
{
    #[OA\Get(
        path: '/api/v1/users',
        summary: 'List users (Admin/Manager only)',
        tags: ['Users'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'role', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'search', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'List of users',
                content: new OA\JsonContent(type: 'array', items: new OA\Items(type: 'object'))
            ),
            new OA\Response(response: 403, description: 'Unauthorized'),
        ]
    )]
    public function index(Request $request)
    {
        // Only admin and manager can list users
        $user = $request->user();
        if (!$user->hasAnyRole(['admin', 'gestor'])) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $query = User::with('roles');

        // CRITICAL: Filter by company_id to ensure tenant isolation
        // Only return users from the same company as the authenticated user
        if ($user->company_id) {
            $query->where('company_id', $user->company_id);
        } else {
            // If user has no company, return empty (should not happen in normal flow)
            return response()->json([]);
        }

        // Filter by role if provided
        if ($request->has('role')) {
            $query->whereHas('roles', function ($q) use ($request) {
                $q->where('name', $request->role);
            });
        }

        // Search by name or email
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->orderBy('name')->get();

        return response()->json($users);
    }

    #[OA\Put(
        path: '/api/v1/users/{id}/roles',
        summary: 'Update user roles (Owner/Admin only)',
        tags: ['Users'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['roles'],
                properties: [
                    new OA\Property(property: 'roles', type: 'array', items: new OA\Items(type: 'string'), description: 'Array of role names'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'User roles updated successfully'),
            new OA\Response(response: 403, description: 'Unauthorized'),
            new OA\Response(response: 404, description: 'User not found'),
        ]
    )]
    public function updateRoles(Request $request, $id)
    {
        $currentUser = $request->user();
        
        // Only owner or admin can update roles
        if (!$currentUser->is_owner && !$currentUser->hasRole('admin')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'roles' => 'required|array',
            'roles.*' => 'required|string|in:admin,gestor,tecnico,viewer',
        ]);

        $user = User::find($id);
        
        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        // Ensure user belongs to the same company
        if ($currentUser->company_id && $user->company_id !== $currentUser->company_id) {
            return response()->json(['error' => 'Cannot update roles for users from different companies'], 403);
        }

        // Prevent removing owner's admin role
        if ($user->is_owner && !in_array('admin', $validated['roles'])) {
            return response()->json(['error' => 'Cannot remove admin role from company owner'], 400);
        }

        // Prevent current user from removing their own admin role (unless they are owner)
        if ($user->id === $currentUser->id && !$currentUser->is_owner && !in_array('admin', $validated['roles'])) {
            return response()->json(['error' => 'Cannot remove your own admin role'], 400);
        }

        // Sync roles
        $user->syncRoles($validated['roles']);

        return response()->json([
            'message' => 'User roles updated successfully',
            'user' => $user->load('roles'),
        ]);
    }

    #[OA\Post(
        path: '/api/v1/users',
        summary: 'Create a new user in the company (Owner/Admin only)',
        tags: ['Users'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['name', 'email', 'password', 'roles'],
                properties: [
                    new OA\Property(property: 'name', type: 'string', example: 'John Doe'),
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'john@example.com'),
                    new OA\Property(property: 'password', type: 'string', format: 'password', example: 'password123'),
                    new OA\Property(property: 'roles', type: 'array', items: new OA\Items(type: 'string'), description: 'Array of role names', example: ['tecnico']),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'User created successfully'),
            new OA\Response(response: 403, description: 'Unauthorized'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function store(Request $request)
    {
        $currentUser = $request->user();
        
        // Only owner or admin can create users
        if (!$currentUser->is_owner && !$currentUser->hasRole('admin')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Ensure current user has a company
        if (!$currentUser->company_id) {
            return response()->json(['error' => 'You must belong to a company to create users'], 400);
        }

        // Check plan limits
        $company = $currentUser->company;
        if (!$company) {
            return response()->json(['error' => 'Company not found'], 404);
        }

        $usage = User::where('company_id', $currentUser->company_id)->count();
        if ($usage >= $company->max_users) {
            return response()->json(['error' => 'User limit reached for your plan'], 400);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'roles' => 'required|array|min:1',
            'roles.*' => 'required|string|in:admin,gestor,tecnico,viewer',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'company_id' => $currentUser->company_id,
            'is_owner' => false,
        ]);

        // Assign roles
        $user->syncRoles($validated['roles']);

        return response()->json([
            'message' => 'User created successfully',
            'user' => $user->load('roles'),
        ], 201);
    }
}
