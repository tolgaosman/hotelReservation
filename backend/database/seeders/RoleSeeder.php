<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class RoleSeeder extends Seeder
{
    /**
     * The eight professions requested for the staff — each is also a role
     * carrying its own job description and a sensible default permission set.
     */
    public static function definitions(): array
    {
        $dashboardCore = ['dashboard.view'];
        $allWidgets = [
            'dashboard.widget_room_availability',
            'dashboard.widget_revenue',
            'dashboard.widget_status_donut',
            'dashboard.widget_country',
            'dashboard.widget_today_checkins',
            'dashboard.widget_today_checkouts',
            'dashboard.widget_total_revenue',
            'dashboard.widget_upcoming',
        ];

        return [
            [
                'name' => 'Muhasebeci',
                'description' => 'Otelin günlük gelir-gider takibini, ödeme kayıtlarını ve faturalandırma süreçlerini yönetir.',
                'permissions' => [
                    ...$dashboardCore,
                    'dashboard.widget_revenue', 'dashboard.widget_total_revenue', 'dashboard.widget_country',
                    'payments.view', 'payments.create',
                    'reservations.view',
                    'guests.view',
                    'settings.view',
                ],
            ],
            [
                'name' => 'Muhasebe Müdürü',
                'description' => 'Muhasebe ekibini yönetir; mali raporları, rezervasyon gelirlerini ve ödeme süreçlerini denetler.',
                'permissions' => [
                    ...$dashboardCore, ...$allWidgets,
                    'payments.view', 'payments.create',
                    'reservations.view', 'reservations.edit',
                    'guests.view', 'guests.edit',
                    'rooms.view',
                    'employees.view',
                    'roles.view',
                    'settings.view',
                ],
            ],
            [
                'name' => 'Resepsiyonist',
                'description' => 'Misafir karşılama, check-in/check-out işlemlerini ve rezervasyon süreçlerini yürütür.',
                'permissions' => [
                    ...$dashboardCore,
                    'dashboard.widget_today_checkins', 'dashboard.widget_today_checkouts', 'dashboard.widget_upcoming',
                    'reservations.view', 'reservations.create', 'reservations.edit', 'reservations.confirm', 'reservations.cancel', 'reservations.checkin', 'reservations.checkout',
                    'calendar.view',
                    'guests.view', 'guests.create', 'guests.edit',
                    'rooms.view',
                    'room_service.view', 'room_service.create',
                    'payments.view', 'payments.create',
                    'settings.view',
                ],
            ],
            [
                'name' => 'Resepsiyon Amiri',
                'description' => 'Ön büro ekibini yönetir; rezervasyon, oda ve misafir operasyonlarının tamamından sorumludur.',
                'permissions' => [
                    ...$dashboardCore, ...$allWidgets,
                    'reservations.view', 'reservations.create', 'reservations.edit', 'reservations.confirm', 'reservations.cancel', 'reservations.checkin', 'reservations.checkout',
                    'calendar.view',
                    'guests.view', 'guests.create', 'guests.edit',
                    'rooms.view', 'rooms.edit', 'rooms.deactivate',
                    'room_service.view', 'room_service.create',
                    'payments.view', 'payments.create',
                    'employees.view',
                    'settings.view',
                ],
            ],
            [
                'name' => 'Temizlikçi',
                'description' => 'Odaların temizlik, hazırlık ve bakım kontrollerini gerçekleştirir.',
                'permissions' => [
                    ...$dashboardCore, 'dashboard.widget_room_availability',
                    'housekeeping.view', 'housekeeping.update_status', 'housekeeping.maintenance',
                    'rooms.view',
                    'settings.view',
                ],
            ],
            [
                'name' => 'Temizlik Sorumlusu',
                'description' => 'Temizlik ekibinin planlamasını yapar, oda hazırlık standartlarını denetler.',
                'permissions' => [
                    ...$dashboardCore, 'dashboard.widget_room_availability',
                    'housekeeping.view', 'housekeeping.update_status', 'housekeeping.assign_staff', 'housekeeping.maintenance',
                    'rooms.view', 'rooms.edit',
                    'employees.view',
                    'settings.view',
                ],
            ],
            [
                'name' => 'Garson',
                'description' => 'Oda servisi siparişlerini karşılar ve misafirlere odalarında servis yapar.',
                'permissions' => [
                    ...$dashboardCore, 'dashboard.widget_today_checkins',
                    'reservations.view',
                    'room_service.view', 'room_service.create',
                    'settings.view',
                ],
            ],
            [
                'name' => 'Garson Şefi',
                'description' => 'Oda servisi ekibini yönetir; sipariş, menü ve servis kalitesi süreçlerini denetler.',
                'permissions' => [
                    ...$dashboardCore, 'dashboard.widget_today_checkins',
                    'reservations.view',
                    'room_service.view', 'room_service.create', 'room_service.delete',
                    'employees.view',
                    'settings.view',
                ],
            ],
        ];
    }

    public function run(): void
    {
        $permissionIdsByKey = Permission::query()->pluck('id', 'key');

        foreach (self::definitions() as $def) {
            $role = Role::updateOrCreate(
                ['name' => $def['name']],
                [
                    'slug' => Str::slug($def['name']),
                    'description' => $def['description'],
                    'is_system' => true,
                ]
            );

            $ids = collect($def['permissions'])
                ->map(fn ($key) => $permissionIdsByKey[$key] ?? null)
                ->filter()
                ->values()
                ->all();

            $role->permissions()->sync($ids);
        }
    }
}
