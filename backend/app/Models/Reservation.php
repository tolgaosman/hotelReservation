<?php

namespace App\Models;

use App\Enums\ReservationStatus;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Reservation extends Model
{
    use HasFactory;

    protected $fillable = [
        'guest_id',
        'room_id',
        'check_in',
        'check_out',
        'guest_count',
        'status',
        'total_amount',
        'created_by',
        'checked_in_at',
        'checked_out_at',
        'cancelled_at',
    ];

    protected function casts(): array
    {
        return [
            'check_in' => 'date',
            'check_out' => 'date',
            'guest_count' => 'integer',
            'status' => ReservationStatus::class,
            'total_amount' => 'decimal:2',
            'checked_in_at' => 'datetime',
            'checked_out_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public function guest(): BelongsTo
    {
        return $this->belongsTo(Guest::class);
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function roomServices(): HasMany
    {
        return $this->hasMany(RoomService::class);
    }

    /**
     * Other people staying alongside the primary guest â€” informational only,
     * the reservation itself still belongs to exactly one guest/room.
     */
    public function companions(): BelongsToMany
    {
        return $this->belongsToMany(Guest::class, 'reservation_guests')->withTimestamps();
    }

    public function scopeActiveStatuses($query)
    {
        return $query->whereIn('status', array_map(
            fn (ReservationStatus $s) => $s->value,
            ReservationStatus::activeStatuses()
        ));
    }

    /**
     * Prefers the aggregate loaded by ->withSum('payments', 'amount'); the query
     * fallback only runs on single-model paths that never eager-load it. Without
     * shouldCache() every read re-runs the sum, and `balance` reads it again.
     */
    protected function paidAmount(): Attribute
    {
        return Attribute::make(
            get: fn () => array_key_exists('payments_sum_amount', $this->attributes)
                ? (float) $this->attributes['payments_sum_amount']
                : (float) $this->payments()->sum('amount'),
        )->shouldCache();
    }

    protected function balance(): Attribute
    {
        return Attribute::make(
            get: fn () => round((float) $this->total_amount - $this->paid_amount, 2),
        )->shouldCache();
    }
}
