<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Employee extends Model
{
    use HasFactory, BelongsToCompany;

    protected $fillable = [
        'employee_code',
        'name',
        'email',
        'phone',
        'department_id',
        'company_id',
        'position',
        'status',
        'notes',
    ];

    protected $casts = [
        'status' => 'string',
        // Encrypt sensitive employee codes and emails
        'employee_code' => \App\Casts\Encrypted::class,
        'email' => \App\Casts\Encrypted::class,
    ];

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(AssetAssignment::class)->orderBy('assigned_at', 'desc');
    }

    public function activeAssignments(): HasMany
    {
        return $this->hasMany(AssetAssignment::class)
            ->whereNull('returned_at')
            ->orderBy('assigned_at', 'desc');
    }

    public function logs(): HasMany
    {
        return $this->hasMany(EmployeeLog::class)->orderBy('created_at', 'desc');
    }

    // Note: Tickets are linked to Users, not Employees directly
    // To get tickets for an employee, you would need to link via User email or create a separate relation
    // For now, this is a placeholder - you may need to adjust based on your business logic
    // public function tickets(): HasMany
    // {
    //     return $this->hasMany(Ticket::class);
    // }

    public function canDelete(): bool
    {
        // Check if employee has active assignments
        // Note: Ticket check removed as tickets are linked to Users, not Employees
        return $this->activeAssignments()->count() === 0;
    }

    public function canReceiveAssets(): bool
    {
        return $this->status === 'active';
    }

    public static function generateEmployeeCode(): string
    {
        $lastEmployee = self::orderBy('id', 'desc')->first();
        $nextNumber = $lastEmployee ? ((int) substr($lastEmployee->employee_code, 3)) + 1 : 1;
        return 'EMP' . str_pad((string) $nextNumber, 6, '0', STR_PAD_LEFT);
    }
}
