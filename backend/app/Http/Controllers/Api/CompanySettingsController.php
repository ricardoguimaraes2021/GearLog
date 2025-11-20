<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'Company Settings', description: 'Company settings management endpoints')]
class CompanySettingsController extends Controller
{
    #[OA\Get(
        path: '/api/v1/company',
        summary: 'Get company information',
        tags: ['Company Settings'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Company information',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'company', type: 'object'),
                        new OA\Property(property: 'owner', type: 'object', nullable: true),
                        new OA\Property(property: 'statistics', type: 'object'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Forbidden - User must belong to a company'),
        ]
    )]
    public function show(Request $request)
    {
        $user = $request->user();

        if (!$user->company_id) {
            return response()->json([
                'error' => 'User does not belong to a company.',
            ], 403);
        }

        $company = $user->company;
        $owner = $company->owner();

        // Get statistics
        $statistics = [
            'total_users' => $company->users()->count(),
            'total_products' => $company->products()->count(),
            'total_employees' => $company->employees()->count(),
            'total_tickets' => $company->tickets()->count(),
            'total_departments' => $company->departments()->count(),
        ];

        return response()->json([
            'company' => $company,
            'owner' => $owner,
            'statistics' => $statistics,
        ]);
    }

    #[OA\Put(
        path: '/api/v1/company',
        summary: 'Update company information',
        tags: ['Company Settings'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['name'],
                properties: [
                    new OA\Property(property: 'name', type: 'string', maxLength: 255),
                    new OA\Property(property: 'country', type: 'string', nullable: true, maxLength: 255),
                    new OA\Property(property: 'timezone', type: 'string', nullable: true, maxLength: 255),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Company updated successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string'),
                        new OA\Property(property: 'company', type: 'object'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Forbidden - Only admin/owner can update'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function update(Request $request)
    {
        $user = $request->user();

        // Check if user can edit company settings (admin or owner)
        $userRoles = $user->roles->pluck('name')->toArray();
        $canEdit = $user->is_owner || in_array('admin', $userRoles);

        if (!$canEdit) {
            return response()->json([
                'error' => 'Only company owners and admins can update company settings.',
            ], 403);
        }

        if (!$user->company_id) {
            return response()->json([
                'error' => 'User does not belong to a company.',
            ], 403);
        }

        $company = $user->company;

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'country' => 'nullable|string|max:255',
            'timezone' => 'nullable|string|max:255',
        ]);

        $company->update($validated);

        Log::info('Company settings updated', [
            'company_id' => $company->id,
            'company_name' => $company->name,
            'updated_by' => $user->id,
        ]);

        return response()->json([
            'message' => 'Company settings updated successfully.',
            'company' => $company->fresh(),
        ]);
    }

    #[OA\Get(
        path: '/api/v1/company/usage',
        summary: 'Get company usage statistics',
        tags: ['Company Settings'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Company usage statistics',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'usage', type: 'object'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Forbidden'),
        ]
    )]
    public function usage(Request $request)
    {
        $user = $request->user();

        if (!$user->company_id) {
            return response()->json([
                'error' => 'User does not belong to a company.',
            ], 403);
        }

        $company = $user->company;
        $usageStats = $company->getUsageStats();

        return response()->json([
            'usage' => $usageStats,
        ]);
    }

    #[OA\Get(
        path: '/api/v1/company/plan',
        summary: 'Get company plan information',
        tags: ['Company Settings'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Company plan information',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'plan', type: 'object'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Forbidden'),
        ]
    )]
    public function plan(Request $request)
    {
        $user = $request->user();

        if (!$user->company_id) {
            return response()->json([
                'error' => 'User does not belong to a company.',
            ], 403);
        }

        $company = $user->company;

        $planInfo = [
            'plan_type' => $company->plan_type,
            'is_active' => $company->is_active,
            'suspended_at' => $company->suspended_at,
            'limits' => [
                'max_users' => $company->max_users,
                'max_products' => $company->max_products,
                'max_tickets' => $company->max_tickets,
            ],
            'usage' => $company->getUsageStats(),
        ];

        return response()->json([
            'plan' => $planInfo,
        ]);
    }
}
