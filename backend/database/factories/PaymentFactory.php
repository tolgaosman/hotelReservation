<?php

namespace Database\Factories;

use App\Enums\PaymentMethod;
use App\Models\Reservation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Payment>
 */
class PaymentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'reservation_id' => Reservation::factory(),
            'amount' => fake()->randomFloat(2, 100, 2000),
            'method' => fake()->randomElement(PaymentMethod::cases()),
            'note' => null,
        ];
    }
}
