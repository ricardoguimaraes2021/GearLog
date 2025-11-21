<?php

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Support\Facades\Crypt;

class Encrypted implements CastsAttributes
{
    /**
     * Transform the attribute from the underlying model values.
     */
    public function get($model, string $key, $value, array $attributes)
    {
        if ($value === null) {
            return null;
        }

        try {
            return Crypt::decryptString($value);
        } catch (\Exception $e) {
            // If decryption fails, return null or log error
            \Log::warning('Failed to decrypt value', [
                'key' => $key,
                'model' => get_class($model),
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Transform the attribute to its underlying model values.
     */
    public function set($model, string $key, $value, array $attributes)
    {
        if ($value === null) {
            return null;
        }

        return Crypt::encryptString($value);
    }
}

