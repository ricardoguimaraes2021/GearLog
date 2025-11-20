<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CompanyInvite;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'Company Invites', description: 'Company invite management endpoints')]
class CompanyInviteController extends Controller
{
    #[OA\Post(
        path: '/api/v1/company/invites',
        summary: 'Generate a new company invite (Owner/Admin only)',
        tags: ['Company Invites'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 201,
                description: 'Invite created successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'invite', type: 'object'),
                        new OA\Property(property: 'code', type: 'string'),
                    ]
                )
            ),
            new OA\Response(response: 403, description: 'Unauthorized'),
        ]
    )]
    public function store(Request $request)
    {
        $user = $request->user();
        
        // Only owner or admin can create invites
        if (!$user->is_owner && !$user->hasRole('admin')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Ensure user has a company
        if (!$user->company_id) {
            return response()->json(['error' => 'You must belong to a company to create invites'], 400);
        }

        // Check plan limits
        $company = $user->company;
        if (!$company) {
            return response()->json(['error' => 'Company not found'], 404);
        }

        $usage = \App\Models\User::where('company_id', $user->company_id)->count();
        if ($usage >= $company->max_users) {
            return response()->json(['error' => 'User limit reached for your plan'], 400);
        }

        // Create invite
        $invite = CompanyInvite::createInvite($user->company_id, $user->id);

        return response()->json([
            'message' => 'Invite created successfully',
            'invite' => $invite->load('company', 'creator'),
            'code' => $invite->code,
        ], 201);
    }

    #[OA\Get(
        path: '/api/v1/company/invites',
        summary: 'List all company invites (Owner/Admin only)',
        tags: ['Company Invites'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'List of invites',
                content: new OA\JsonContent(type: 'array', items: new OA\Items(type: 'object'))
            ),
            new OA\Response(response: 403, description: 'Unauthorized'),
        ]
    )]
    public function index(Request $request)
    {
        $user = $request->user();
        
        // Only owner or admin can list invites
        if (!$user->is_owner && !$user->hasRole('admin')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Ensure user has a company
        if (!$user->company_id) {
            return response()->json(['error' => 'You must belong to a company to view invites'], 400);
        }

        $invites = CompanyInvite::where('company_id', $user->company_id)
            ->with(['creator', 'company'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($invites);
    }

    #[OA\Get(
        path: '/api/v1/invites/{code}/validate',
        summary: 'Validate an invite code (Public)',
        tags: ['Company Invites'],
        parameters: [
            new OA\Parameter(name: 'code', in: 'path', required: true, schema: new OA\Schema(type: 'string')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Invite is valid',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'valid', type: 'boolean'),
                        new OA\Property(property: 'company', type: 'object'),
                    ]
                )
            ),
            new OA\Response(response: 404, description: 'Invite not found or invalid'),
        ]
    )]
    public function validateInvite(string $code)
    {
        $invite = CompanyInvite::findByCode(strtoupper($code));

        if (!$invite || !$invite->isValid()) {
            return response()->json([
                'valid' => false,
                'error' => 'Invalid or expired invite code',
            ], 404);
        }

        return response()->json([
            'valid' => true,
            'company' => $invite->company->only(['id', 'name']),
            'code' => $invite->code,
        ]);
    }

    #[OA\Delete(
        path: '/api/v1/company/invites/{id}',
        summary: 'Deactivate an invite (Owner/Admin only)',
        tags: ['Company Invites'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Invite deactivated successfully'),
            new OA\Response(response: 403, description: 'Unauthorized'),
            new OA\Response(response: 404, description: 'Invite not found'),
        ]
    )]
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        
        // Only owner or admin can deactivate invites
        if (!$user->is_owner && !$user->hasRole('admin')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $invite = CompanyInvite::find($id);

        if (!$invite) {
            return response()->json(['error' => 'Invite not found'], 404);
        }

        // Ensure invite belongs to user's company
        if ($invite->company_id !== $user->company_id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $invite->update(['is_active' => false]);

        return response()->json([
            'message' => 'Invite deactivated successfully',
        ]);
    }
}