<?php

namespace Database\Seeders;

use App\Models\Employee;
use App\Models\Role;
use Illuminate\Database\Seeder;

class EmployeeSeeder extends Seeder
{
    public function run(): void
    {
        $roster = [
            ['name' => 'Ayşe Yıldız', 'role' => 'Muhasebeci', 'email' => 'ayse.yildiz@hotel.test', 'phone' => '0532 111 22 33', 'hire' => '2022-03-14'],
            ['name' => 'Kemal Er', 'role' => 'Muhasebe Müdürü', 'email' => 'kemal.er@hotel.test', 'phone' => '0532 111 22 34', 'hire' => '2019-06-01'],
            ['name' => 'Elif Demir', 'role' => 'Resepsiyonist', 'email' => 'elif.demir@hotel.test', 'phone' => '0532 111 22 35', 'hire' => '2023-01-10'],
            ['name' => 'Burak Şahin', 'role' => 'Resepsiyon Amiri', 'email' => 'burak.sahin@hotel.test', 'phone' => '0532 111 22 36', 'hire' => '2020-09-21'],
            ['name' => 'Hatice Aydın', 'role' => 'Temizlikçi', 'email' => 'hatice.aydin@hotel.test', 'phone' => '0532 111 22 37', 'hire' => '2023-05-02'],
            ['name' => 'Mehmet Kaya', 'role' => 'Temizlik Sorumlusu', 'email' => 'mehmet.kaya@hotel.test', 'phone' => '0532 111 22 38', 'hire' => '2021-11-15'],
            ['name' => 'Deniz Aksoy', 'role' => 'Garson', 'email' => 'deniz.aksoy@hotel.test', 'phone' => '0532 111 22 39', 'hire' => '2023-08-07'],
            ['name' => 'Serkan Yılmaz', 'role' => 'Garson Şefi', 'email' => 'serkan.yilmaz@hotel.test', 'phone' => '0532 111 22 40', 'hire' => '2020-02-18'],
        ];

        foreach ($roster as $person) {
            $role = Role::where('name', $person['role'])->first();

            Employee::updateOrCreate(
                ['email' => $person['email']],
                [
                    'full_name' => $person['name'],
                    'profession' => $person['role'],
                    'role_id' => $role?->id,
                    'phone' => $person['phone'],
                    'hire_date' => $person['hire'],
                    'status' => 'active',
                ]
            );
        }
    }
}
