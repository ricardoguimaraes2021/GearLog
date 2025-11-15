<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\ProductService;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Barryvdh\DomPDF\Facade\Pdf;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ProductController extends Controller
{
    public function __construct(
        protected ProductService $productService
    ) {
    }

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

        return response()->json($products);
    }

    public function show(Product $product)
    {
        $product->load(['category', 'movements']);
        return response()->json($product);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'brand' => 'nullable|string|max:255',
            'model' => 'nullable|string|max:255',
            'serial_number' => 'nullable|string|unique:products,serial_number',
            'status' => 'required|in:novo,usado,avariado,reparação,reservado',
            'quantity' => 'required|integer|min:0',
            'value' => 'nullable|numeric|min:0',
            'purchase_date' => 'nullable|date',
            'specs' => 'nullable|array',
            'description' => 'nullable|string',
            'image' => 'nullable|image|max:2048',
        ]);

        $image = $request->hasFile('image') ? $request->file('image') : null;
        unset($validated['image']);

        $product = $this->productService->createProduct($validated, $image);

        return response()->json($product->load('category'), 201);
    }

    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'category_id' => 'sometimes|required|exists:categories,id',
            'brand' => 'nullable|string|max:255',
            'model' => 'nullable|string|max:255',
            'serial_number' => 'nullable|string|unique:products,serial_number,' . $product->id,
            'status' => 'sometimes|required|in:novo,usado,avariado,reparação,reservado',
            'quantity' => 'sometimes|required|integer|min:0',
            'value' => 'nullable|numeric|min:0',
            'purchase_date' => 'nullable|date',
            'specs' => 'nullable|array',
            'description' => 'nullable|string',
            'image' => 'nullable|image|max:2048',
        ]);

        $image = $request->hasFile('image') ? $request->file('image') : null;
        unset($validated['image']);

        $product = $this->productService->updateProduct($product, $validated, $image);

        return response()->json($product->load('category'));
    }

    public function destroy(Product $product)
    {
        try {
            $this->productService->deleteProduct($product);
            return response()->json(['message' => 'Product deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
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

