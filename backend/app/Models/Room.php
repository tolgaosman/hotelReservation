<?php

namespace App\Models;

use App\Enums\RoomStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Room extends Model
{
    use HasFactory;

    protected $fillable = [
        'number',
        'type',
        'capacity',
        'nightly_rate',
        'amenities',
        'status',
        'housekeeping_status',
        'active',
    ];

    protected function casts(): array
    {
        return [
            'capacity' => 'integer',
            'nightly_rate' => 'decimal:2',
            'amenities' => 'array',
            'status' => RoomStatus::class,
            'housekeeping_status' => \App\Enums\HousekeepingStatus::class,
            'active' => 'boolean',
        ];
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    public function scopeActive($query)
    {
        return $query->where('active', true);
    }
}
