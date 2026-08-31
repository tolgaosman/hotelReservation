<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Permission>
 */
class PermissionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'key' => 'test.'.fake()->unique()->word(),
            'label' => fake()->words(2, true),
            'group' => 'test',
            'group_label' => 'Test',
            'is_page_permission' => false,
            'sort_order' => 0,
        ];
    }
}
