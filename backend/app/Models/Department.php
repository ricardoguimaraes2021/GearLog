<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Department extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'manager_employee_id',
        'cost_center',
    ];

    public function manager(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'manager_employee_id');
    }

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class);
    }

    public function activeEmployees(): HasMany
    {
        return $this->hasMany(Employee::class)->where('status', 'active');
    }

    public function getTotalAssignedAssetsAttribute(): int
    {
        return AssetAssignment::whereHas('employee', function ($query) {
            $query->where('department_id', $this->id);
        })
        ->whereNull('returned_at')
        ->count();
    }

    public function getTotalAssetValueAttribute(): float
    {
        return AssetAssignment::whereHas('employee', function ($query) {
            $query->where('department_id', $this->id);
        })
        ->whereNull('returned_at')
        ->with('product')
        ->get()
        ->sum(function ($assignment) {
            return $assignment->product->value ?? 0;
        });
    }
}
