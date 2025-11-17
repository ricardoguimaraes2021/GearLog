<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ticket extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'product_id',
        'opened_by',
        'assigned_to',
        'priority',
        'type',
        'status',
        'description',
        'resolution',
        'attachments',
    ];

    protected $casts = [
        'attachments' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function openedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'opened_by');
    }

    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(TicketComment::class)->orderBy('created_at', 'asc');
    }

    public function logs(): HasMany
    {
        return $this->hasMany(TicketLog::class)->orderBy('created_at', 'desc');
    }

    public function canBeEdited(): bool
    {
        return $this->status !== 'closed';
    }

    public function canBeClosed(): bool
    {
        return in_array($this->status, ['open', 'in_progress', 'waiting_parts', 'resolved']);
    }

    public function isResolved(): bool
    {
        return in_array($this->status, ['resolved', 'closed']);
    }
}
