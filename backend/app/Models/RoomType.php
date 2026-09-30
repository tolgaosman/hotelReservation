<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RoomType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'capacity',
        'nightly_rate',
        'amenities',
        'bed_type',
        'size_m2',
        'view',
        'images',
        'active',
    ];

    protected function casts(): array
    {
        return [
            'capacity' => 'integer',
            'nightly_rate' => 'decimal:2',
            'amenities' => 'array',
            'images' => 'array',
            'size_m2' => 'integer',
            'active' => 'boolean',
        ];
    }

    public function rooms(): HasMany
    {
        return $this->hasMany(Room::class);
    }

    /**
     * The single writer of the denormalized snapshot every Room carries
     * (type/capacity/nightly_rate/amenities). Reservation pricing reads
     * those columns on the room, not this model, so a rate change here only
     * reaches future reservations once it's propagated through this array —
     * see RoomTypeController::update.
     */
    public function roomAttributes(): array
    {
        return [
            'type' => $this->name,
            'capacity' => $this->capacity,
            'nightly_rate' => $this->nightly_rate,
            'amenities' => $this->amenities ?? [],
        ];
    }
}
