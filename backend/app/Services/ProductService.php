<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

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
            throw new \Exception('Cannot delete product with stock remaining.');
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
        $filename = Str::uuid() . '.' . $image->getClientOriginalExtension();
        return $image->storeAs('products', $filename, 'public');
    }
}

