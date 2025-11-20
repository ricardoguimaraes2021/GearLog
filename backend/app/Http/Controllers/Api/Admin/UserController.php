<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'Admin', description: 'Super admin endpoints')]
class UserController extends Controller
{
    #[OA\Get(
        path: '/api/v1/admin/users',
        summary: 'Get all users (Super Admin only)',
        tags: ['Admin'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(response: 200, description: 'List of all users'),
            new OA\Response(response: 403, description: 'Unauthorized'),
        ]
    )]
    public function index(Request $request)
    {
        $users = User::withoutGlobalScopes()
            ->with(['roles', 'company'])
            ->orderBy('name')
            ->get();
        
        return response()->json($users);
    }
}

