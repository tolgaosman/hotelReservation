<?php

namespace Database\Seeders;

use App\Models\Role;
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

        // Demo personel account is assigned the Resepsiyonist role so the
        // permission-driven dashboard/nav can be exercised without an admin login.
        $receptionRole = Role::where('name', 'Resepsiyonist')->first();

        User::factory()->create([
            'name' => 'Personel',
            'email' => 'personel@hotel.test',
            'role_id' => $receptionRole?->id,
        ]);
    }
}
