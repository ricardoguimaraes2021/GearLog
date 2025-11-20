<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Movement extends Model
{
    use HasFactory, BelongsToCompany;

    protected $fillable = [
        'product_id',
        'company_id',
        'type',
        'quantity',
        'assigned_to',
        'notes',
    ];

    protected $casts = [
        'quantity' => 'integer',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function getQuantityChangeAttribute(): int
    {
        return match ($this->type) {
            'entry', 'return' => $this->quantity,
            'exit', 'allocation' => -$this->quantity,
            default => 0,
        };
    }
}

