<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Product extends Model
{
    use HasFactory, BelongsToCompany;

    protected $fillable = [
        'name',
        'category_id',
        'company_id',
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
        'invoice_url',
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

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class)->orderBy('created_at', 'desc');
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(AssetAssignment::class)->orderBy('assigned_at', 'desc');
    }

    public function activeAssignment(): ?AssetAssignment
    {
        return $this->assignments()->whereNull('returned_at')->first();
    }

    public function canBeAssigned(): bool
    {
        // Only items with status: new, used, repair can be assigned
        // Items marked as damaged, broken, under repair, or reserved cannot be assigned
        $assignableStatuses = ['new', 'used', 'repair'];
        $unassignableStatuses = ['damaged', 'reserved'];
        
        if (in_array($this->status, $unassignableStatuses)) {
            return false;
        }
        
        return in_array($this->status, $assignableStatuses) 
            && $this->quantity > 0 
            && $this->activeAssignment() === null;
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

    public function getInvoiceUrlAttribute($value): ?string
    {
        if (!$value) {
            return null;
        }

        if (filter_var($value, FILTER_VALIDATE_URL)) {
            return $value;
        }

        return Storage::url($value);
    }

    /**
     * Calculate warranty expiration date (3 years from purchase date)
     */
    public function getWarrantyExpiresAtAttribute(): ?string
    {
        if (!$this->purchase_date) {
            return null;
        }

        $purchaseDate = is_string($this->purchase_date) 
            ? \Carbon\Carbon::parse($this->purchase_date) 
            : \Carbon\Carbon::instance($this->purchase_date);
        
        // Use copy() to avoid modifying the original date
        return $purchaseDate->copy()->addYears(3)->format('Y-m-d');
    }

    /**
     * Check if warranty is still valid
     */
    public function isWarrantyValid(): bool
    {
        if (!$this->purchase_date) {
            return false;
        }

        $warrantyExpires = $this->warranty_expires_at;
        if (!$warrantyExpires) {
            return false;
        }

        return \Carbon\Carbon::parse($warrantyExpires)->isFuture();
    }
}

