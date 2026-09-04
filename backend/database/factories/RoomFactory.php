<?php

namespace Database\Factories;

use App\Enums\RoomStatus;
use App\Models\Room;
use App\Models\RoomType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Room>
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

    private const AMENITY_POOL = ['Deniz Manzarası', 'Balkon', 'Klima', 'Mini Bar', 'Jakuzi', 'Wi-Fi', 'Kasa', 'Oda Servisi'];

    public function definition(): array
    {
        $spec = fake()->randomElement(self::ROOM_TYPES);

        return [
            'number' => fake()->unique()->numerify('###'),
            'type' => $spec['type'],
            'capacity' => $spec['capacity'],
            'nightly_rate' => $spec['rate'],
            'amenities' => fake()->randomElements(self::AMENITY_POOL, fake()->numberBetween(1, 4)),
            // `active` was dropped from the rooms table in favor of
            // status=passive (see 2026_09_01_090301_modify_rooms_status_add_passive) —
            // don't resurrect it here.
            'status' => RoomStatus::Available,
        ];
    }

    /**
     * Links the room to a real RoomType and matches its denormalized
     * snapshot, for tests that exercise the room_type_id relationship
     * (propagation, deletion guards) instead of the legacy free-string type.
     */
    public function forType(RoomType $type): static
    {
        return $this->state(fn () => [
            'room_type_id' => $type->id,
            ...$type->roomAttributes(),
        ]);
    }
}

