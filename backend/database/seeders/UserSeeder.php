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

        // Resepsiyonist
        $receptionRole = Role::where('name', 'Resepsiyonist')->first();
        User::factory()->create([
            'name' => 'Elif Demir',
            'email' => 'elif.demir@hotel.test',
            'password' => bcrypt('12345678'),
            'role_id' => $receptionRole?->id,
        ]);

        // Muhasebeci
        $accountingRole = Role::where('name', 'Muhasebeci')->first();
        User::factory()->create([
            'name' => 'Ayşe Yıldız',
            'email' => 'ayse.yildiz@hotel.test',
            'password' => bcrypt('12345678'),
            'role_id' => $accountingRole?->id,
        ]);

        // Temizlikçi
        $housekeepingRole = Role::where('name', 'Temizlikçi')->first();
        User::factory()->create([
            'name' => 'Hatice Aydın',
            'email' => 'hatice.aydin@hotel.test',
            'password' => bcrypt('12345678'),
            'role_id' => $housekeepingRole?->id,
        ]);

        // Garson
        $waiterRole = Role::where('name', 'Garson')->first();
        User::factory()->create([
            'name' => 'Deniz Aksoy',
            'email' => 'deniz.aksoy@hotel.test',
            'password' => bcrypt('12345678'),
            'role_id' => $waiterRole?->id,
        ]);

        // --- Yöneticiler / Şefler ---

        // Resepsiyon Amiri
        $receptionManagerRole = Role::where('name', 'Resepsiyon Amiri')->first();
        User::factory()->create([
            'name' => 'Burak Şahin',
            'email' => 'burak.sahin@hotel.test',
            'password' => bcrypt('12345678'),
            'role_id' => $receptionManagerRole?->id,
        ]);

        // Muhasebe Müdürü
        $accountingManagerRole = Role::where('name', 'Muhasebe Müdürü')->first();
        User::factory()->create([
            'name' => 'Kemal Er',
            'email' => 'kemal.er@hotel.test',
            'password' => bcrypt('12345678'),
            'role_id' => $accountingManagerRole?->id,
        ]);

        // Temizlik Sorumlusu
        $housekeepingManagerRole = Role::where('name', 'Temizlik Sorumlusu')->first();
        User::factory()->create([
            'name' => 'Mehmet Kaya',
            'email' => 'mehmet.kaya@hotel.test',
            'password' => bcrypt('12345678'),
            'role_id' => $housekeepingManagerRole?->id,
        ]);

        // Garson Şefi
        $waiterManagerRole = Role::where('name', 'Garson Şefi')->first();
        User::factory()->create([
            'name' => 'Serkan Yılmaz',
            'email' => 'serkan.yilmaz@hotel.test',
            'password' => bcrypt('12345678'),
            'role_id' => $waiterManagerRole?->id,
        ]);
    }
}
