<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'Categories', description: 'Category management endpoints')]
class CategoryController extends Controller
{
    #[OA\Get(
        path: '/api/v1/categories',
        summary: 'List all categories',
        tags: ['Categories'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'List of categories with product count',
                content: new OA\JsonContent(
                    type: 'array',
                    items: new OA\Items(
                        properties: [
                            new OA\Property(property: 'id', type: 'integer'),
                            new OA\Property(property: 'name', type: 'string'),
                            new OA\Property(property: 'slug', type: 'string'),
                            new OA\Property(property: 'products_count', type: 'integer'),
                            new OA\Property(property: 'created_at', type: 'string', format: 'date-time'),
                            new OA\Property(property: 'updated_at', type: 'string', format: 'date-time'),
                        ]
                    )
                )
            ),
        ]
    )]
    public function index()
    {
        // Allow view access for viewers, manage access for others
        $user = request()->user();
        if (!$user->can('categories.view') && !$user->can('categories.manage')) {
            abort(403, 'Unauthorized');
        }
        
        $categories = Category::withCount('products')->orderBy('name')->get();
        return response()->json($categories);
    }

    #[OA\Post(
        path: '/api/v1/categories',
        summary: 'Create a new category',
        tags: ['Categories'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['name'],
                properties: [
                    new OA\Property(property: 'name', type: 'string', maxLength: 255, example: 'Laptops'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Category created successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'id', type: 'integer'),
                        new OA\Property(property: 'name', type: 'string'),
                        new OA\Property(property: 'slug', type: 'string'),
                    ]
                )
            ),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function store(Request $request)
    {
        // Check permissions - viewers cannot create categories
        $user = $request->user();
        if (!$user->can('categories.manage')) {
            abort(403, 'Unauthorized: You do not have permission to create categories');
        }
        
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:categories,name',
        ]);

        $category = Category::create($validated);

        return response()->json($category, 201);
    }

    #[OA\Put(
        path: '/api/v1/categories/{id}',
        summary: 'Update a category',
        tags: ['Categories'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['name'],
                properties: [
                    new OA\Property(property: 'name', type: 'string', maxLength: 255, example: 'Laptops'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Category updated successfully'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function update(Request $request, Category $category)
    {
        // Check permissions - viewers cannot update categories
        $user = $request->user();
        if (!$user->can('categories.manage')) {
            abort(403, 'Unauthorized: You do not have permission to update categories');
        }
        
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:categories,name,' . $category->id,
        ]);

        $category->update($validated);

        return response()->json($category);
    }

    #[OA\Delete(
        path: '/api/v1/categories/{id}',
        summary: 'Delete a category',
        tags: ['Categories'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Category deleted successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'Category deleted successfully'),
                    ]
                )
            ),
            new OA\Response(
                response: 400,
                description: 'Cannot delete category with associated products',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'error', type: 'string'),
                        new OA\Property(property: 'context', type: 'object'),
                    ]
                )
            ),
        ]
    )]
    public function destroy(Category $category)
    {
        // Check permissions - viewers cannot delete categories
        $user = request()->user();
        if (!$user->can('categories.manage')) {
            abort(403, 'Unauthorized: You do not have permission to delete categories');
        }
        
        // Business rule: Deleting a category only allowed if no products use it
        if (!$category->canDelete()) {
            $productCount = $category->products()->count();
            return response()->json([
                'error' => "Cannot delete category '{$category->name}' because it has {$productCount} associated product(s). Please reassign or delete these products first.",
                'context' => [
                    'category_id' => $category->id,
                    'category_name' => $category->name,
                    'product_count' => $productCount,
                ],
            ], 400);
        }

        $category->delete();

        return response()->json(['message' => 'Category deleted successfully']);
    }
}

