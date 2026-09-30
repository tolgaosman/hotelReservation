<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Employee>
 */
class EmployeeFactory extends Factory
{
    public function definition(): array
    {
        return [
            'full_name' => fake()->name(),
            'profession' => fake()->randomElement(['Resepsiyonist', 'Kat Görevlisi', 'Garson', 'Müdür']),
            'role_id' => null,
            'email' => fake()->unique()->safeEmail(),
            'phone' => fake()->numerify('+90 5## ### ## ##'),
            'hire_date' => fake()->dateTimeBetween('-3 years', 'now'),
            'status' => 'active',
            'notes' => null,
        ];
    }
}
