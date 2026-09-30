<?php

namespace Database\Factories;

use App\Models\Reservation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\RoomService>
 */
class RoomServiceFactory extends Factory
{
    public function definition(): array
    {
        return [
            'reservation_id' => Reservation::factory(),
            'description' => fake()->randomElement(['Minibar', 'Oda Servisi Kahvaltı', 'Çamaşırhane', 'Spa']),
            'amount' => fake()->randomFloat(2, 20, 500),
        ];
    }
}
