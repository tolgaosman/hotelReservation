<?php

namespace Database\Factories;

use App\Models\RoomType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<RoomType>
 */
class RoomTypeFactory extends Factory
{
    private const AMENITY_POOL = ['Deniz Manzarası', 'Balkon', 'Klima', 'Mini Bar', 'Jakuzi', 'Wi-Fi', 'Kasa'];

    public function definition(): array
    {
        return [
            'name' => fake()->unique()->words(2, true),
            'description' => fake()->sentence(),
            'capacity' => fake()->numberBetween(1, 6),
            'nightly_rate' => fake()->numberBetween(1000, 6000),
            'amenities' => fake()->randomElements(self::AMENITY_POOL, fake()->numberBetween(1, 4)),
            'bed_type' => fake()->randomElement(['Çift Kişilik', 'İki Tek Yatak', 'King']),
            'size_m2' => fake()->numberBetween(20, 90),
            'view' => fake()->randomElement(['Deniz', 'Şehir', 'Bahçe']),
            'active' => true,
        ];
    }
}
