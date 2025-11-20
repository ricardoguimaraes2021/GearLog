<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Company extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'country',
        'timezone',
        'plan_type',
        'max_users',
        'max_products',
        'max_tickets',
        'is_active',
        'suspended_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'suspended_at' => 'datetime',
        'max_users' => 'integer',
        'max_products' => 'integer',
        'max_tickets' => 'integer',
    ];

    /**
     * Get all users belonging to this company
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Get the company owner
     */
    public function owner(): ?User
    {
        return $this->users()->where('is_owner', true)->first();
    }

    /**
     * Get all products for this company
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    /**
     * Get all tickets for this company
     */
    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class);
    }

    /**
     * Get all employees for this company
     */
    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class);
    }

    /**
     * Get all departments for this company
     */
    public function departments(): HasMany
    {
        return $this->hasMany(Department::class);
    }

    /**
     * Check if company is suspended
     */
    public function isSuspended(): bool
    {
        return $this->suspended_at !== null;
    }

    /**
     * Check if company can create more users
     */
    public function canCreateUser(): bool
    {
        if (!$this->is_active || $this->isSuspended()) {
            return false;
        }

        $currentUserCount = $this->users()->count();
        return $currentUserCount < $this->max_users;
    }

    /**
     * Check if company can create more products
     */
    public function canCreateProduct(): bool
    {
        if (!$this->is_active || $this->isSuspended()) {
            return false;
        }

        // Use withoutGlobalScopes to avoid filtering by authenticated user's company_id
        $currentProductCount = Product::withoutGlobalScopes()
            ->where('company_id', $this->id)
            ->count();
        return $currentProductCount < $this->max_products;
    }

    /**
     * Check if company can create more tickets this month
     */
    public function canCreateTicket(): bool
    {
        if (!$this->is_active || $this->isSuspended()) {
            return false;
        }

        // Use withoutGlobalScopes to avoid filtering by authenticated user's company_id
        $currentMonthTickets = Ticket::withoutGlobalScopes()
            ->where('company_id', $this->id)
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        return $currentMonthTickets < $this->max_tickets;
    }

    /**
     * Get current usage statistics
     */
    public function getUsageStats(): array
    {
        // Use withoutGlobalScopes to avoid filtering by authenticated user's company_id
        // when Super Admin is viewing statistics for a specific company
        $productsCount = Product::withoutGlobalScopes()
            ->where('company_id', $this->id)
            ->count();
        
        $ticketsCountThisMonth = Ticket::withoutGlobalScopes()
            ->where('company_id', $this->id)
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();
        
        $usersCount = $this->users()->count();
        
        return [
            'users' => [
                'current' => $usersCount,
                'max' => $this->max_users,
                'percentage' => $this->max_users > 0 
                    ? round(($usersCount / $this->max_users) * 100, 2) 
                    : 0,
            ],
            'products' => [
                'current' => $productsCount,
                'max' => $this->max_products,
                'percentage' => $this->max_products > 0 
                    ? round(($productsCount / $this->max_products) * 100, 2) 
                    : 0,
            ],
            'tickets_this_month' => [
                'current' => $ticketsCountThisMonth,
                'max' => $this->max_tickets,
                'percentage' => $this->max_tickets > 0 
                    ? round(($ticketsCountThisMonth / $this->max_tickets) * 100, 2) 
                    : 0,
            ],
        ];
    }
}
