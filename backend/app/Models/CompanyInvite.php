<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class CompanyInvite extends Model
{
    protected $fillable = [
        'company_id',
        'code',
        'created_by',
        'is_active',
        'used_count',
        'last_used_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'used_count' => 'integer',
        'last_used_at' => 'datetime',
    ];

    /**
     * Generate a unique 8-character alphanumeric code
     * Ensures it contains both letters and numbers
     */
    public static function generateCode(): string
    {
        $letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $numbers = '0123456789';
        
        do {
            // Generate code with at least 2 letters and 2 numbers, randomly mixed
            $codeChars = [];
            
            // Add random letters (at least 2)
            $letterCount = rand(2, 5);
            for ($i = 0; $i < $letterCount; $i++) {
                $codeChars[] = $letters[rand(0, strlen($letters) - 1)];
            }
            
            // Add random numbers (at least 2, total must be 8)
            $numberCount = 8 - $letterCount;
            for ($i = 0; $i < $numberCount; $i++) {
                $codeChars[] = $numbers[rand(0, strlen($numbers) - 1)];
            }
            
            // Shuffle the array to mix letters and numbers
            shuffle($codeChars);
            $code = implode('', $codeChars);
            
        } while (self::where('code', $code)->exists());

        return $code;
    }

    /**
     * Create a new invite for a company
     */
    public static function createInvite(int $companyId, int $createdBy): self
    {
        return self::create([
            'company_id' => $companyId,
            'code' => self::generateCode(),
            'created_by' => $createdBy,
            'is_active' => true,
            'used_count' => 0,
        ]);
    }

    /**
     * Find invite by code
     */
    public static function findByCode(string $code): ?self
    {
        return self::where('code', $code)
            ->where('is_active', true)
            ->first();
    }

    /**
     * Mark invite as used
     */
    public function markAsUsed(): void
    {
        $this->increment('used_count');
        $this->update(['last_used_at' => now()]);
    }

    /**
     * Get the company that owns this invite
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Get the user who created this invite
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Check if invite is valid (active and company is active)
     */
    public function isValid(): bool
    {
        return $this->is_active && 
               $this->company && 
               $this->company->is_active && 
               !$this->company->isSuspended();
    }
}
