<?php

namespace App\Events;

use App\Models\Product;
use App\Services\NotificationService;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProductDamaged
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $product;

    /**
     * Create a new event instance.
     */
    public function __construct(Product $product)
    {
        $this->product = $product;
    }

    /**
     * Handle the event.
     */
    public function handle(NotificationService $notificationService): void
    {
        $notificationService->notifyByRole(
            'admin',
            'product_damaged',
            'Product Marked as Damaged',
            "Product {$this->product->name} has been marked as damaged",
            [
                'product_id' => $this->product->id,
                'product_name' => $this->product->name,
            ]
        );

        $notificationService->notifyByRole(
            'gestor',
            'product_damaged',
            'Product Marked as Damaged',
            "Product {$this->product->name} has been marked as damaged",
            [
                'product_id' => $this->product->id,
                'product_name' => $this->product->name,
            ]
        );
    }
}
