<?php

namespace App\Events;

use App\Models\Product;
use App\Services\NotificationService;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LowStockAlert
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
    public function handle(): void
    {
        $notificationService = app(\App\Services\NotificationService::class);
        $notificationService->notifyByRole(
            'admin',
            'low_stock',
            '⚠️ Low Stock Alert',
            "Product {$this->product->name} is running low. Current quantity: {$this->product->quantity}",
            [
                'product_id' => $this->product->id,
                'product_name' => $this->product->name,
                'quantity' => $this->product->quantity,
            ]
        );

        $notificationService->notifyByRole(
            'gestor',
            'low_stock',
            '⚠️ Low Stock Alert',
            "Product {$this->product->name} is running low. Current quantity: {$this->product->quantity}",
            [
                'product_id' => $this->product->id,
                'product_name' => $this->product->name,
                'quantity' => $this->product->quantity,
            ]
        );
    }
}
