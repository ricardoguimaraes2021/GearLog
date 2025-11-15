<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Support\Facades\Storage;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class QRCodeService
{
    public function generateForProduct(Product $product): string
    {
        $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
        $url = "{$frontendUrl}/products/{$product->id}";

        $qrCodePath = "qrcodes/product-{$product->id}.svg";
        $fullPath = storage_path("app/public/{$qrCodePath}");

        // Ensure directory exists
        $directory = dirname($fullPath);
        if (!is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        // Generate QR code
        QrCode::format('svg')
            ->size(300)
            ->generate($url, $fullPath);

        // Update product with QR code URL
        $product->update([
            'qr_code_url' => $qrCodePath,
        ]);

        return $qrCodePath;
    }

    public function getQRCodeUrl(Product $product): ?string
    {
        if (!$product->qr_code_url) {
            $this->generateForProduct($product);
        }

        return Storage::url($product->qr_code_url);
    }
}

