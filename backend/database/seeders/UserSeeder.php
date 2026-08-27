<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::factory()->admin()->create([
            'name' => 'Admin',
            'email' => 'admin@hotel.test',
        ]);

        User::factory()->create([
            'name' => 'Personel',
            'email' => 'personel@hotel.test',
        ]);
    }
}
