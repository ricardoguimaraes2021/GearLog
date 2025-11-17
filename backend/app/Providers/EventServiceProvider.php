<?php

namespace App\Providers;

use App\Events\TicketCreated;
use App\Events\TicketAssigned;
use App\Events\TicketCommented;
use App\Events\TicketStatusChanged;
use App\Events\SlaViolated;
use App\Events\LowStockAlert;
use App\Events\ProductDamaged;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        TicketCreated::class => [
            // Listeners will be auto-discovered
        ],
        TicketAssigned::class => [
            // Listeners will be auto-discovered
        ],
        TicketCommented::class => [
            // Listeners will be auto-discovered
        ],
        TicketStatusChanged::class => [
            // Listeners will be auto-discovered
        ],
        SlaViolated::class => [
            // Listeners will be auto-discovered
        ],
        LowStockAlert::class => [
            // Listeners will be auto-discovered
        ],
        ProductDamaged::class => [
            // Listeners will be auto-discovered
        ],
    ];

    /**
     * Register any events for your application.
     */
    public function boot(): void
    {
        // Auto-discover event listeners
        parent::boot();
    }
}

