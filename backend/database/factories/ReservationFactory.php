<?php

namespace Database\Factories;

use App\Enums\ReservationStatus;
use App\Models\Guest;
use App\Models\Room;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Reservation>
 */
class ReservationFactory extends Factory
{
    public function definition(): array
    {
        $checkIn = fake()->dateTimeBetween('-6 months', '+2 months');
        $nights = fake()->numberBetween(1, 7);
        $checkOut = (clone $checkIn)->modify("+{$nights} days");

        $room = Room::inRandomOrder()->first() ?? Room::factory()->create();

        return [
            'guest_id' => Guest::inRandomOrder()->first()?->id ?? Guest::factory(),
            'room_id' => $room->id,
            'check_in' => $checkIn,
            'check_out' => $checkOut,
            'guest_count' => fake()->numberBetween(1, $room->capacity),
            'status' => fake()->randomElement(ReservationStatus::cases()),
            'total_amount' => round((float) $room->nightly_rate * $nights, 2),
        ];
    }
}
