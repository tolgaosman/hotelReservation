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
            // Muhasebe
            ['name' => 'AyÅŸe YÄ±ldÄ±z', 'role' => 'Muhasebeci', 'email' => 'ayse.yildiz@hotel.test', 'phone' => '0532 111 22 33', 'hire' => '2022-03-14'],
            ['name' => 'Zeynep Kara', 'role' => 'Muhasebeci', 'email' => 'zeynep.kara@hotel.test', 'phone' => '0532 111 22 41', 'hire' => '2022-04-10'],
            ['name' => 'Caner Polat', 'role' => 'Muhasebeci', 'email' => 'caner.polat@hotel.test', 'phone' => '0532 111 22 42', 'hire' => '2021-08-15'],
            ['name' => 'BÃ¼ÅŸra YÄ±lmaz', 'role' => 'Muhasebeci', 'email' => 'busra.yilmaz@hotel.test', 'phone' => '0532 111 22 43', 'hire' => '2023-02-20'],
            ['name' => 'Kemal Er', 'role' => 'Muhasebe MÃ¼dÃ¼rÃ¼', 'email' => 'kemal.er@hotel.test', 'phone' => '0532 111 22 34', 'hire' => '2019-06-01'],

            // Resepsiyon
            ['name' => 'Elif Demir', 'role' => 'Resepsiyonist', 'email' => 'elif.demir@hotel.test', 'phone' => '0532 111 22 35', 'hire' => '2023-01-10'],
            ['name' => 'Ali Vefa', 'role' => 'Resepsiyonist', 'email' => 'ali.vefa@hotel.test', 'phone' => '0532 111 22 44', 'hire' => '2022-11-05'],
            ['name' => 'Merve Ã‡elik', 'role' => 'Resepsiyonist', 'email' => 'merve.celik@hotel.test', 'phone' => '0532 111 22 45', 'hire' => '2023-03-12'],
            ['name' => 'Orhan KoÃ§', 'role' => 'Resepsiyonist', 'email' => 'orhan.koc@hotel.test', 'phone' => '0532 111 22 46', 'hire' => '2021-05-18'],
            ['name' => 'Burak Åahin', 'role' => 'Resepsiyon Amiri', 'email' => 'burak.sahin@hotel.test', 'phone' => '0532 111 22 36', 'hire' => '2020-09-21'],

            // Temizlik
            ['name' => 'Hatice AydÄ±n', 'role' => 'TemizlikÃ§i', 'email' => 'hatice.aydin@hotel.test', 'phone' => '0532 111 22 37', 'hire' => '2023-05-02'],
            ['name' => 'Fatma Åen', 'role' => 'TemizlikÃ§i', 'email' => 'fatma.sen@hotel.test', 'phone' => '0532 111 22 47', 'hire' => '2022-09-01'],
            ['name' => 'GÃ¼lÅŸen Ã–ztÃ¼rk', 'role' => 'TemizlikÃ§i', 'email' => 'gulsen.ozturk@hotel.test', 'phone' => '0532 111 22 48', 'hire' => '2023-01-25'],
            ['name' => 'Ramazan Arslan', 'role' => 'Tamirci', 'email' => 'ramazan.arslan@hotel.test', 'phone' => '0532 111 22 49', 'hire' => '2021-12-10'],
            ['name' => 'Mehmet Kaya', 'role' => 'Temizlik & Tamir Sorumlusu', 'email' => 'mehmet.kaya@hotel.test', 'phone' => '0532 111 22 38', 'hire' => '2021-11-15'],

            // Garson
            ['name' => 'Deniz Aksoy', 'role' => 'Garson', 'email' => 'deniz.aksoy@hotel.test', 'phone' => '0532 111 22 39', 'hire' => '2023-08-07'],
            ['name' => 'Cemal DoÄŸan', 'role' => 'Garson', 'email' => 'cemal.dogan@hotel.test', 'phone' => '0532 111 22 50', 'hire' => '2022-07-20'],
            ['name' => 'Esra KÄ±lÄ±Ã§', 'role' => 'Garson', 'email' => 'esra.kilic@hotel.test', 'phone' => '0532 111 22 51', 'hire' => '2023-04-11'],
            ['name' => 'Hakan Aslan', 'role' => 'Garson', 'email' => 'hakan.aslan@hotel.test', 'phone' => '0532 111 22 52', 'hire' => '2021-10-08'],
            ['name' => 'Serkan YÄ±lmaz', 'role' => 'Garson Åefi', 'email' => 'serkan.yilmaz@hotel.test', 'phone' => '0532 111 22 40', 'hire' => '2020-02-18'],
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
