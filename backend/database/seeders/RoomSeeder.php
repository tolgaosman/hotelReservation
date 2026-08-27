<?php

namespace Database\Seeders;

use App\Models\Room;
use Illuminate\Database\Seeder;

class RoomSeeder extends Seeder
{
    private const ROOM_TYPES = [
        ['type' => 'Standart', 'capacity' => 2, 'rate' => 1450],
        ['type' => 'Deluxe', 'capacity' => 3, 'rate' => 2200],
        ['type' => 'Aile Odası', 'capacity' => 4, 'rate' => 2800],
        ['type' => 'Suite', 'capacity' => 4, 'rate' => 3600],
        ['type' => 'King Suite', 'capacity' => 5, 'rate' => 5500],
    ];

    private const AMENITY_POOL = ['Deniz Manzarası', 'Balkon', 'Klima', 'Mini Bar', 'Jakuzi', 'Wi-Fi', 'Kasa'];

    public function run(): void
    {
        $counter = 0;

        foreach ([1, 2, 3, 4, 5] as $floor) {
            for ($unit = 1; $unit <= 12; $unit++) {
                $spec = self::ROOM_TYPES[$counter % count(self::ROOM_TYPES)];
                $amenities = array_values(array_filter(self::AMENITY_POOL, fn ($_, $i) => ($counter + $i) % 3 === 0, ARRAY_FILTER_USE_BOTH));

                Room::create([
                    'number' => sprintf('%d%02d', $floor, $unit),
                    'type' => $spec['type'],
                    'capacity' => $spec['capacity'],
                    'nightly_rate' => $spec['rate'],
                    'amenities' => $amenities,
                    'status' => 'available',
                    'active' => true,
                ]);

                $counter++;
            }
        }
    }
}
