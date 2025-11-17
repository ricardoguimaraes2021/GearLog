<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'category_id',
        'brand',
        'model',
        'serial_number',
        'status',
        'quantity',
        'value',
        'purchase_date',
        'specs',
        'description',
        'image_url',
        'qr_code_url',
    ];

    protected $casts = [
        'specs' => 'array',
        'purchase_date' => 'date',
        'value' => 'decimal:2',
        'quantity' => 'integer',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function movements(): HasMany
    {
        return $this->hasMany(Movement::class)->orderBy('created_at', 'desc');
    }

    public function canDelete(): bool
    {
        return $this->quantity === 0;
    }

    public function canAllocate(): bool
    {
        return $this->status !== 'damaged' && $this->quantity > 0;
    }

    public function getImageUrlAttribute($value): ?string
    {
        if (!$value) {
            return null;
        }

        if (filter_var($value, FILTER_VALIDATE_URL)) {
            return $value;
        }

        return Storage::url($value);
    }

    public function getQrCodeUrlAttribute($value): ?string
    {
        if (!$value) {
            return null;
        }

        if (filter_var($value, FILTER_VALIDATE_URL)) {
            return $value;
        }

        return Storage::url($value);
    }
}

