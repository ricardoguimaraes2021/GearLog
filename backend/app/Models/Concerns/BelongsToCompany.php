<?php

namespace App\Models\Concerns;

use App\Models\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait BelongsToCompany
{
    /**
     * Boot the trait and apply tenant scope
     */
    protected static function bootBelongsToCompany(): void
    {
        static::addGlobalScope(new TenantScope());

        // Automatically set company_id when creating a new model
        static::creating(function ($model) {
            // Only set company_id if it's not already set and user is authenticated with company
            if (is_null($model->company_id) && auth()->check()) {
                $user = auth()->user();
                if ($user && $user->company_id) {
                    $model->company_id = $user->company_id;
                }
            }
        });
    }

    /**
     * Get the company this model belongs to
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Company::class);
    }
}

