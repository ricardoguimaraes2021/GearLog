<?php

namespace App\Models;

use App\Models\PasswordHistory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, HasRoles, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'company_id',
        'is_owner',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_owner' => 'boolean',
            // Email encryption is optional - uncomment if needed
            // 'email' => \App\Casts\Encrypted::class,
        ];
    }

    /**
     * Get the company this user belongs to
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Check if user is company owner
     */
    public function isCompanyOwner(): bool
    {
        return $this->is_owner === true;
    }

    /**
     * Get company ID (for tenant isolation)
     */
    public function getCompanyId(): ?int
    {
        return $this->company_id;
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class)->orderBy('created_at', 'desc');
    }

    public function unreadNotifications()
    {
        return $this->notifications()->whereNull('read_at');
    }

    /**
     * Get password history for this user
     */
    public function passwordHistory()
    {
        return $this->hasMany(PasswordHistory::class)->orderBy('created_at', 'desc');
    }

    /**
     * Check if password was used recently (last 5 passwords)
     */
    public function hasUsedPassword(string $password): bool
    {
        $recentPasswords = $this->passwordHistory()
            ->limit(5)
            ->pluck('password_hash');

        foreach ($recentPasswords as $hash) {
            if (\Illuminate\Support\Facades\Hash::check($password, $hash)) {
                return true;
            }
        }

        // Also check current password
        if (\Illuminate\Support\Facades\Hash::check($password, $this->password)) {
            return true;
        }

        return false;
    }

    /**
     * Save password to history
     */
    public function savePasswordToHistory(string $passwordHash): void
    {
        PasswordHistory::create([
            'user_id' => $this->id,
            'password_hash' => $passwordHash,
        ]);

        // Keep only last 5 passwords
        $this->passwordHistory()
            ->skip(5)
            ->delete();
    }

    /**
     * Check if user is super admin
     */
    public function isSuperAdmin(): bool
    {
        $superAdminEmails = config('app.super_admin_emails', ['admin@gearlog.local']);
        return in_array($this->email, array_map('trim', $superAdminEmails));
    }
}

