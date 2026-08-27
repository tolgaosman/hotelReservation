<?php

namespace Database\Factories;

use App\Enums\RoomStatus;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Room>
 */
class RoomFactory extends Factory
{
    private const ROOM_TYPES = [
        ['type' => 'Standart', 'capacity' => 2, 'rate' => 1450],
        ['type' => 'Deluxe', 'capacity' => 3, 'rate' => 2200],
        ['type' => 'Aile Odası', 'capacity' => 4, 'rate' => 2800],
        ['type' => 'Suite', 'capacity' => 4, 'rate' => 3600],
        ['type' => 'King Suite', 'capacity' => 5, 'rate' => 5500],
    ];

    private const AMENITY_POOL = ['Deniz Manzarası', 'Balkon', 'Klima', 'Mini Bar', 'Jakuzi', 'Wi-Fi', 'Kasa'];

    public function definition(): array
    {
        $spec = fake()->randomElement(self::ROOM_TYPES);

        return [
            'number' => fake()->unique()->numerify('###'),
            'type' => $spec['type'],
            'capacity' => $spec['capacity'],
            'nightly_rate' => $spec['rate'],
            'amenities' => fake()->randomElements(self::AMENITY_POOL, fake()->numberBetween(1, 4)),
            'status' => RoomStatus::Available,
            'active' => true,
        ];
    }
}
