<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Guest>
 */
class GuestFactory extends Factory
{
    public function definition(): array
    {
        return [
            'full_name' => fake()->name(),
            'phone' => fake()->numerify('+90 5## ### ## ##'),
            'email' => fake()->unique()->safeEmail(),
            'identity_number' => fake()->unique()->numerify('###########'),
            'country' => fake()->randomElement(['Türkiye', 'Almanya', 'Rusya', 'Birleşik Krallık', 'Fransa', 'ABD', 'Hollanda']),
        ];
    }
}
