<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Laravel\Facades\Image;

class ProductService
{
    public function __construct(
        protected QRCodeService $qrCodeService
    ) {
    }

    public function createProduct(array $data, ?UploadedFile $image = null): Product
    {
        // Handle image upload
        if ($image) {
            $data['image_url'] = $this->storeImage($image);
        }

        // Create product
        $product = Product::create($data);

        // Generate QR code
        $this->qrCodeService->generateForProduct($product);

        return $product->fresh();
    }

    public function updateProduct(Product $product, array $data, ?UploadedFile $image = null): Product
    {
        // Handle image upload
        if ($image) {
            // Delete old image if exists
            if ($product->image_url) {
                Storage::disk('public')->delete($product->image_url);
            }
            $data['image_url'] = $this->storeImage($image);
        }

        $product->update($data);

        return $product->fresh();
    }

    public function deleteProduct(Product $product): bool
    {
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

        return $product->delete();
    }

    protected function storeImage(UploadedFile $image): string
    {
        $filename = Str::uuid() . '.jpg';
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
}

