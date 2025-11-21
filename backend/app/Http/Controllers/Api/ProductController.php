<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Services\ProductService;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Barryvdh\DomPDF\Facade\Pdf;
use OpenApi\Attributes as OA;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

#[OA\Tag(name: 'Products', description: 'Product management endpoints')]
class ProductController extends Controller
{
    public function __construct(
        protected ProductService $productService
    ) {
    }

    #[OA\Get(
        path: '/api/v1/products',
        summary: 'List products',
        tags: ['Products'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'search', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'category_id', in: 'query', required: false, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'status', in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['new', 'used', 'damaged', 'repair', 'reserved'])),
            new OA\Parameter(name: 'page', in: 'query', required: false, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'List of products'),
        ]
    )]
    public function index(Request $request)
    {
        $query = Product::with(['category', 'movements']);

        // Search
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('brand', 'like', "%{$search}%")
                    ->orWhere('model', 'like', "%{$search}%")
                    ->orWhere('serial_number', 'like', "%{$search}%");
            });
        }

        // Filters
        if ($request->has('category_id')) {
            $query->where('category_id', $request->get('category_id'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->get('status'));
        }

        if ($request->has('min_quantity')) {
            $query->where('quantity', '>=', $request->get('min_quantity'));
        }

        if ($request->has('max_quantity')) {
            $query->where('quantity', '<=', $request->get('max_quantity'));
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = $request->get('per_page', 15);
        $products = $query->paginate($perPage);

        return ProductResource::collection($products);
    }

    #[OA\Get(
        path: '/api/v1/products/{id}',
        summary: 'Get product details',
        tags: ['Products'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Product details'),
            new OA\Response(response: 404, description: 'Product not found'),
        ]
    )]
    public function show(Product $product)
    {
        $product->load(['category', 'movements']);
        return new ProductResource($product);
    }

    /**
     * Public endpoint to view product details (no authentication required)
     * Used for QR code access
     */
    public function showPublic(Product $product)
    {
        $product->load('category');
        
        // Return only public information (no movements, no sensitive data)
        return response()->json([
            'id' => $product->id,
            'name' => $product->name,
            'category' => $product->category ? [
                'id' => $product->category->id,
                'name' => $product->category->name,
            ] : null,
            'brand' => $product->brand,
            'model' => $product->model,
            'serial_number' => $product->serial_number,
            'status' => $product->status,
            'quantity' => $product->quantity,
            'value' => $product->value,
            'description' => $product->description,
            'image_url' => $product->image_url,
            'qr_code_url' => $product->qr_code_url,
            'invoice_url' => $product->invoice_url,
            'warranty_expires_at' => $product->warranty_expires_at,
            'is_warranty_valid' => $product->isWarrantyValid(),
            'created_at' => $product->created_at,
        ]);
    }

    #[OA\Post(
        path: '/api/v1/products',
        summary: 'Create a new product',
        tags: ['Products'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: 'multipart/form-data',
                schema: new OA\Schema(
                    required: ['name', 'category_id', 'status', 'quantity'],
                    properties: [
                        new OA\Property(property: 'name', type: 'string'),
                        new OA\Property(property: 'category_id', type: 'integer'),
                        new OA\Property(property: 'brand', type: 'string'),
                        new OA\Property(property: 'model', type: 'string'),
                        new OA\Property(property: 'serial_number', type: 'string'),
                        new OA\Property(property: 'status', type: 'string', enum: ['new', 'used', 'damaged', 'repair', 'reserved']),
                        new OA\Property(property: 'quantity', type: 'integer'),
                        new OA\Property(property: 'value', type: 'number'),
                        new OA\Property(property: 'image', type: 'string', format: 'binary'),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Product created'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function store(Request $request)
    {
        // Check permissions - viewers cannot create products
        $user = $request->user();
        if (!$user->can('products.create')) {
            abort(403, 'Unauthorized: You do not have permission to create products');
        }
        
        // Check if company can create more products
        if ($user->company && !$user->company->canCreateProduct()) {
            return response()->json([
                'error' => 'Product limit reached. Please upgrade your plan to add more products.',
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'brand' => 'nullable|string|max:255',
            'model' => 'nullable|string|max:255',
            'serial_number' => 'nullable|string|unique:products,serial_number',
            'status' => 'required|in:new,used,damaged,repair,reserved',
            'quantity' => 'required|integer|min:0',
            'value' => 'nullable|numeric|min:0',
            'purchase_date' => 'nullable|date|before_or_equal:today',
            'specs' => 'nullable|json',
            'description' => 'nullable|string',
            'image' => 'nullable|image|max:2048',
        ]);

        // Parse specs if it's a JSON string
        if (isset($validated['specs']) && is_string($validated['specs'])) {
            $validated['specs'] = json_decode($validated['specs'], true) ?? [];
        }
        
        // Remove specs if it's empty
        if (empty($validated['specs'])) {
            unset($validated['specs']);
        }

        $image = $request->hasFile('image') ? $request->file('image') : null;
        $invoice = $request->hasFile('invoice') ? $request->file('invoice') : null;
        unset($validated['image'], $validated['invoice']);

        $product = $this->productService->createProduct($validated, $image, $invoice);
        $product->load('category');
        
        // Add warranty info to response
        $productData = $product->toArray();
        $productData['warranty_expires_at'] = $product->warranty_expires_at;
        $productData['is_warranty_valid'] = $product->isWarrantyValid();

        return response()->json($productData, 201);
    }

    #[OA\Put(
        path: '/api/v1/products/{id}',
        summary: 'Update a product',
        tags: ['Products'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Product updated'),
            new OA\Response(response: 404, description: 'Product not found'),
        ]
    )]
    public function update(Request $request, Product $product)
    {
        // Check permissions - viewers cannot update products
        if (!$request->user()->can('products.update')) {
            abort(403, 'Unauthorized: You do not have permission to update products');
        }
        
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'category_id' => 'sometimes|required|exists:categories,id',
            'brand' => 'nullable|string|max:255',
            'model' => 'nullable|string|max:255',
            'serial_number' => 'nullable|string|unique:products,serial_number,' . $product->id,
            'status' => 'sometimes|required|in:new,used,damaged,repair,reserved',
            'quantity' => 'sometimes|required|integer|min:0',
            'value' => 'nullable|numeric|min:0',
            'purchase_date' => 'nullable|date|before_or_equal:today',
            'specs' => 'nullable|json',
            'description' => 'nullable|string',
            'image' => 'nullable|image|max:2048',
            'invoice' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        // Parse specs if it's a JSON string
        if (isset($validated['specs']) && is_string($validated['specs'])) {
            $validated['specs'] = json_decode($validated['specs'], true) ?? [];
        }
        
        // Remove specs if it's empty
        if (empty($validated['specs'])) {
            unset($validated['specs']);
        }

        $image = $request->hasFile('image') ? $request->file('image') : null;
        $invoice = $request->hasFile('invoice') ? $request->file('invoice') : null;
        unset($validated['image'], $validated['invoice']);

        $product = $this->productService->updateProduct($product, $validated, $image, $invoice);
        $product->load('category');
        
        // Add warranty info to response
        $productData = $product->toArray();
        $productData['warranty_expires_at'] = $product->warranty_expires_at;
        $productData['is_warranty_valid'] = $product->isWarrantyValid();

        return response()->json($productData);
    }

    #[OA\Delete(
        path: '/api/v1/products/{id}',
        summary: 'Delete a product',
        tags: ['Products'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Product deleted'),
            new OA\Response(response: 400, description: 'Cannot delete product with stock'),
        ]
    )]
    public function destroy(Product $product)
    {
        // Check permissions - viewers cannot delete products
        $user = request()->user();
        if (!$user->can('products.delete')) {
            abort(403, 'Unauthorized: You do not have permission to delete products');
        }
        try {
            $this->productService->deleteProduct($product);
            return response()->json(['message' => 'Product deleted successfully']);
        } catch (\App\Exceptions\BusinessRuleException $e) {
            return response()->json([
                'error' => $e->getUserMessage(),
                'context' => $e->getContext(),
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'An unexpected error occurred while deleting the product. Please try again.',
                'message' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function export(Request $request, string $format)
    {
        // Apply same filters as index
        $query = Product::with('category');

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('brand', 'like', "%{$search}%")
                    ->orWhere('model', 'like', "%{$search}%");
            });
        }

        if ($request->has('category_id')) {
            $query->where('category_id', $request->get('category_id'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->get('status'));
        }

        $products = $query->get();

        switch ($format) {
            case 'csv':
                return $this->exportCsv($products);
            case 'excel':
                return $this->exportExcel($products);
            case 'pdf':
                return $this->exportPdf($products);
            default:
                return response()->json(['error' => 'Invalid format'], 400);
        }
    }

    protected function exportCsv($products)
    {
        $filename = 'products_' . now()->format('Y-m-d_His') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($products) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['ID', 'Name', 'Category', 'Brand', 'Model', 'Serial Number', 'Status', 'Quantity', 'Value']);

            foreach ($products as $product) {
                fputcsv($file, [
                    $product->id,
                    $product->name,
                    $product->category->name ?? '',
                    $product->brand ?? '',
                    $product->model ?? '',
                    $product->serial_number ?? '',
                    $product->status,
                    $product->quantity,
                    $product->value ?? '',
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    protected function exportExcel($products)
    {
        $export = new class($products) implements FromCollection, WithHeadings, WithMapping {
            protected $products;

            public function __construct($products)
            {
                $this->products = $products;
            }

            public function collection()
            {
                return $this->products->load('category');
            }

            public function headings(): array
            {
                return [
                    'ID',
                    'Name',
                    'Category',
                    'Brand',
                    'Model',
                    'Serial Number',
                    'Status',
                    'Quantity',
                    'Value',
                    'Purchase Date',
                ];
            }

            public function map($product): array
            {
                return [
                    $product->id,
                    $product->name,
                    $product->category->name ?? '',
                    $product->brand ?? '',
                    $product->model ?? '',
                    $product->serial_number ?? '',
                    $product->status,
                    $product->quantity,
                    $product->value ?? '',
                    $product->purchase_date ?? '',
                ];
            }
        };

        $filename = 'products_' . now()->format('Y-m-d_His') . '.xlsx';
        return Excel::download($export, $filename);
    }

    protected function exportPdf($products)
    {
        $products = $products->load('category');
        $pdf = Pdf::loadView('exports.products', [
            'products' => $products,
            'date' => now()->format('Y-m-d H:i:s'),
        ]);

        $filename = 'products_' . now()->format('Y-m-d_His') . '.pdf';
        return $pdf->download($filename);
    }
}

