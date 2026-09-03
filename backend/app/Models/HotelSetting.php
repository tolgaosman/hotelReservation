<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HotelSetting extends Model
{
    protected $fillable = [
        'name',
        'email',
        'phone',
        'tax_rate',
        'check_in_time',
        'check_out_time',
    ];

    protected $casts = [
        'tax_rate' => 'decimal:2',
    ];

    // Single-row config table — every call returns (and lazily creates) the
    // same record instead of the frontend ever needing to know an id.
    public static function current(): self
    {
        return static::query()->firstOrCreate([], [
            'name' => 'Oasis Resort',
            'email' => 'info@oasisresort.com',
            'phone' => '+90 212 555 10 00',
            'tax_rate' => 18,
            'check_in_time' => '14:00',
            'check_out_time' => '12:00',
        ]);
    }
}
