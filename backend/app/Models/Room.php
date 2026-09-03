<?php

namespace App\Models;

use App\Enums\HousekeepingStatus;
use App\Enums\RoomStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Room extends Model
{
    use HasFactory;

    protected $fillable = [
        'number',
        'type',
        'room_type_id',
        'capacity',
        'nightly_rate',
        'amenities',
        'status',
        'housekeeping_status',
        'is_maintenance',
        'maintenance_note',
        'assigned_staff',
        'is_priority_cleaning',
    ];

    protected function casts(): array
    {
        return [
            'capacity' => 'integer',
            'nightly_rate' => 'decimal:2',
            'amenities' => 'array',
            'status' => RoomStatus::class,
            'housekeeping_status' => HousekeepingStatus::class,
            'is_maintenance' => 'boolean',
            'is_priority_cleaning' => 'boolean',
        ];
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    public function roomType(): BelongsTo
    {
        return $this->belongsTo(RoomType::class);
    }
}
