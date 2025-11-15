<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index()
    {
        $categories = Category::withCount('products')->orderBy('name')->get();
        return response()->json($categories);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:categories,name',
        ]);

        $category = Category::create($validated);

        return response()->json($category, 201);
    }

    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:categories,name,' . $category->id,
        ]);

        $category->update($validated);

        return response()->json($category);
    }

    public function destroy(Category $category)
    {
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

