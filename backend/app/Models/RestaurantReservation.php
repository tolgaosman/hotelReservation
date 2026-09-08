<?php

namespace App\Models;

use App\Enums\RestaurantPaymentStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RestaurantReservation extends Model
{
    protected $fillable = [
        'full_name',
        'phone',
        'email',
        'party_size',
        'date',
        'time',
        'note',
        'is_hotel_guest',
        'reservation_id',
        'payment_status',
        'amount',
        'card_holder_name',
        'card_last_four',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'party_size' => 'integer',
            'is_hotel_guest' => 'boolean',
            'payment_status' => RestaurantPaymentStatus::class,
            'amount' => 'decimal:2',
        ];
    }

    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class);
    }
}
