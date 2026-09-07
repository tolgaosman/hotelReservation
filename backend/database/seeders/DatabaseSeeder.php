<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Artisan;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            PermissionSeeder::class,
            RoleSeeder::class,
            UserSeeder::class,
            EmployeeSeeder::class,
            RoomTypeSeeder::class,
            DatasetSeeder::class,
        ]);

        // dataset.json's dates are frozen at dump time, so its forward book
        // thins out and eventually stops â€” top it back up relative to
        // *today* every time the app is (re)seeded.
        $this->command->info('Filling forward calendar...');
        Artisan::call('hotel:fill-calendar');
    }
}
