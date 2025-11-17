<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssetAssignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'employee_id',
        'assigned_by',
        'returned_by',
        'assigned_at',
        'returned_at',
        'condition_on_return',
        'notes',
    ];

    protected $casts = [
        'assigned_at' => 'datetime',
        'returned_at' => 'datetime',
    ];

    protected static function boot(): void
    {
        parent::boot();

        // Ensure returned_at is never in the future
        static::saving(function ($assignment) {
            if ($assignment->returned_at && $assignment->returned_at->isFuture()) {
                // If returned_at is in the future, set it to now or assigned_at, whichever is later
                $assignment->returned_at = now()->isAfter($assignment->assigned_at) 
                    ? now() 
                    : $assignment->assigned_at;
            }
        });
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    public function returnedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'returned_by');
    }

    public function isActive(): bool
    {
        return $this->returned_at === null;
    }

    public function getDurationAttribute(): ?int
    {
        if (!$this->returned_at) {
            return null;
        }

        return $this->assigned_at->diffInDays($this->returned_at);
    }
}
