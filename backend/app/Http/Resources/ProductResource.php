<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'category_id' => $this->category_id,
            'category' => $this->whenLoaded('category', function () {
                return [
                    'id' => $this->category->id,
                    'name' => $this->category->name,
                ];
            }),
            'brand' => $this->brand,
            'model' => $this->model,
            'serial_number' => $this->serial_number, // Encrypted in database
            'status' => $this->status,
            'quantity' => $this->quantity,
            'value' => $this->value,
            'purchase_date' => $this->purchase_date?->format('Y-m-d'),
            'specs' => $this->specs,
            'description' => $this->description,
            'image_url' => $this->image_url,
            'qr_code_url' => $this->qr_code_url,
            'invoice_url' => $this->invoice_url,
            'warranty_expires_at' => $this->warranty_expires_at,
            'is_warranty_valid' => $this->isWarrantyValid(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}

