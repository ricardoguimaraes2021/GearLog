<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
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
            'roles.*' => 'required|string|in:admin,gestor,tecnico,consulta',
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
}
