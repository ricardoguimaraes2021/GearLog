<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Movement;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Intervention\Image\Laravel\Facades\Image;

class ProductService
{
    public function __construct(
        protected QRCodeService $qrCodeService
    ) {
    }

    public function createProduct(array $data, ?UploadedFile $image = null, ?UploadedFile $invoice = null): Product
    {
        return \Illuminate\Support\Facades\DB::transaction(function () use ($data, $image, $invoice) {
            // Handle image upload
            if ($image) {
                $data['image_url'] = $this->storeImage($image);
            }

            // Handle invoice upload
            if ($invoice) {
                $data['invoice_url'] = $this->storeInvoice($invoice);
            }

            // Create product
            $product = Product::create($data);

            // Generate QR code
            $this->qrCodeService->generateForProduct($product);

            $product->refresh();

            // Create initial entry movement if quantity > 0
            if (isset($data['quantity']) && $data['quantity'] > 0) {
                Movement::create([
                    'product_id' => $product->id,
                    'company_id' => Auth::user()->company_id ?? $product->company_id,
                    'type' => 'entry',
                    'quantity' => $data['quantity'],
                    'assigned_to' => null,
                    'notes' => 'Initial stock entry',
                ]);
            }

            // Fire notification events
            // If product is created as damaged
            if ($product->status === 'damaged') {
                event(new \App\Events\ProductDamaged($product));
            }

            // If product is created with low stock
            if ($product->quantity <= 1) {
                event(new \App\Events\LowStockAlert($product));
            }

            return $product->fresh();
        });
    }

    public function updateProduct(Product $product, array $data, ?UploadedFile $image = null, ?UploadedFile $invoice = null): Product
    {
        return DB::transaction(function () use ($product, $data, $image, $invoice) {
            $oldStatus = $product->status;
            $oldQuantity = $product->quantity;

            // Handle image upload
            if ($image) {
                // Delete old image if exists
                if ($product->image_url) {
                    Storage::disk('public')->delete($product->image_url);
                }
                $data['image_url'] = $this->storeImage($image);
            }

            // Handle invoice upload
            if ($invoice) {
                // Delete old invoice if exists
                if ($product->invoice_url) {
                    Storage::disk('public')->delete($product->invoice_url);
                }
                $data['invoice_url'] = $this->storeInvoice($invoice);
            }

            $product->update($data);
            $product->refresh();

            // Fire notification events
            // If status changed to damaged
            if (isset($data['status']) && $data['status'] === 'damaged' && $oldStatus !== 'damaged') {
                event(new \App\Events\ProductDamaged($product));
            }

            // If quantity changed to low stock (<= 1)
            if (isset($data['quantity']) && $data['quantity'] <= 1 && $oldQuantity > 1) {
                event(new \App\Events\LowStockAlert($product));
            }

            return $product->fresh();
        });
    }

    public function deleteProduct(Product $product): bool
    {
        return DB::transaction(function () use ($product) {
            // Business rule: A product cannot be deleted if it still has stock
            if (!$product->canDelete()) {
                throw new \App\Exceptions\BusinessRuleException(
                    "Cannot delete product '{$product->name}' because it still has {$product->quantity} item(s) in stock. Please remove all stock before deleting.",
                    "Product {$product->id} cannot be deleted: quantity = {$product->quantity}",
                    ['product_id' => $product->id, 'quantity' => $product->quantity]
                );
            }

            // Delete associated files
            if ($product->image_url) {
                Storage::disk('public')->delete($product->image_url);
            }
            if ($product->qr_code_url) {
                Storage::disk('public')->delete($product->qr_code_url);
            }
            if ($product->invoice_url) {
                Storage::disk('public')->delete($product->invoice_url);
            }

            return $product->delete();
        });
    }

    protected function storeImage(UploadedFile $image): string
    {
        // Use uniqid with more entropy for better uniqueness, fallback if uuid fails
        try {
            $filename = Str::uuid() . '.jpg';
        } catch (\Exception $e) {
            // Fallback if UUID generation fails (e.g., missing PHP uuid extension on Windows)
            $filename = uniqid('img_', true) . '_' . time() . '.jpg';
        }
        $path = storage_path('app/public/products/' . $filename);
        
        // Ensure directory exists
        $directory = dirname($path);
        if (!is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        // Resize and optimize image
        $img = Image::read($image);
        
        // Resize to max 1200px width while maintaining aspect ratio
        $img->scale(width: 1200);
        
        // Save as optimized JPEG (quality 85)
        $img->toJpeg(85)->save($path);

        return 'products/' . $filename;
    }

    protected function storeInvoice(UploadedFile $invoice): string
    {
        // Generate unique filename
        try {
            $originalName = pathinfo($invoice->getClientOriginalName(), PATHINFO_FILENAME);
            $extension = $invoice->getClientOriginalExtension();
            $filename = Str::slug($originalName) . '_' . Str::uuid() . '.' . $extension;
        } catch (\Exception $e) {
            // Fallback if UUID generation fails
            $extension = $invoice->getClientOriginalExtension();
            $filename = 'invoice_' . uniqid('', true) . '_' . time() . '.' . $extension;
        }
        
        $path = storage_path('app/public/invoices/' . $filename);
        
        // Ensure directory exists
        $directory = dirname($path);
        if (!is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        // Store the file
        $invoice->move($directory, $filename);

        return 'invoices/' . $filename;
    }
}

