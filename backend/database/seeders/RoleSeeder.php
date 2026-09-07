<?php

namespace Database\Seeders;

use App\Enums\Department;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class RoleSeeder extends Seeder
{
    /**
     * The eight professions requested for the staff â€” each is also a role
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
                'description' => 'Otelin gÃ¼nlÃ¼k gelir-gider takibini, Ã¶deme kayÄ±tlarÄ±nÄ± ve faturalandÄ±rma sÃ¼reÃ§lerini yÃ¶netir.',
                'permissions' => [
                    ...$dashboardCore,
                    'dashboard.widget_revenue', 'dashboard.widget_total_revenue', 'dashboard.widget_country',
                    'payments.view', 'payments.create',
                    'reservations.view',
                    'guests.view',
                    'settings.view',
                ],
                'department' => Department::Muhasebe,
            ],
            [
                'name' => 'Muhasebe MÃ¼dÃ¼rÃ¼',
                'description' => 'Muhasebe ekibini yÃ¶netir; mali raporlarÄ±, rezervasyon gelirlerini ve Ã¶deme sÃ¼reÃ§lerini denetler.',
                'permissions' => [
                    ...$dashboardCore, ...$allWidgets,
                    'payments.view', 'payments.create',
                    'reservations.view', 'reservations.edit',
                    'guests.view', 'guests.edit',
                    'rooms.view', 'room_types.view',
                    'employees.view',
                    'roles.view',
                    'settings.view',
                ],
                'visible_professions' => ['Muhasebeci'],
                'department' => Department::Muhasebe,
            ],
            [
                'name' => 'Resepsiyonist',
                'description' => 'Misafir karÅŸÄ±lama, check-in/check-out iÅŸlemlerini ve rezervasyon sÃ¼reÃ§lerini yÃ¼rÃ¼tÃ¼r.',
                'permissions' => [
                    ...$dashboardCore,
                    'dashboard.widget_today_checkins', 'dashboard.widget_today_checkouts', 'dashboard.widget_upcoming',
                    'reservations.view', 'reservations.create', 'reservations.edit', 'reservations.confirm', 'reservations.checkin', 'reservations.checkout',
                    'calendar.view',
                    'guests.view', 'guests.create', 'guests.edit',
                    'rooms.view', 'room_types.view',
                    'room_service.view', 'room_service.create',
                    'payments.view', 'payments.create',
                    'settings.view',
                ],
                'department' => Department::Resepsiyon,
            ],
            [
                'name' => 'Resepsiyon Amiri',
                'description' => 'Ã–n bÃ¼ro ekibini yÃ¶netir; rezervasyon, oda ve misafir operasyonlarÄ±nÄ±n tamamÄ±ndan sorumludur.',
                'permissions' => [
                    ...$dashboardCore, ...$allWidgets,
                    'reservations.view', 'reservations.create', 'reservations.edit', 'reservations.confirm', 'reservations.cancel', 'reservations.checkin', 'reservations.checkout',
                    'calendar.view',
                    'guests.view', 'guests.create', 'guests.edit',
                    'rooms.view', 'rooms.edit', 'rooms.deactivate', 'room_types.view', 'room_types.create', 'room_types.edit', 'room_types.delete',
                    'room_service.view', 'room_service.create',
                    'payments.view', 'payments.create',
                    'employees.view',
                    'settings.view',
                ],
                'visible_professions' => ['Resepsiyonist'],
                'department' => Department::Resepsiyon,
            ],
            [
                'name' => 'TemizlikÃ§i',
                'description' => 'OdalarÄ±n temizlik, hazÄ±rlÄ±k ve bakÄ±m kontrollerini gerÃ§ekleÅŸtirir.',
                'permissions' => [
                    ...$dashboardCore, 'dashboard.widget_room_availability',
                    'housekeeping.view', 'housekeeping.update_status', 'housekeeping.maintenance',
                    'rooms.view', 'room_types.view',
                    'settings.view',
                ],
                'department' => Department::TemizlikTamir,
            ],
            [
                'name' => 'Tamirci',
                'description' => 'Odalardaki arÄ±za ve bakÄ±m taleplerini karÅŸÄ±lar, tesisatÄ± onarÄ±r.',
                'permissions' => [
                    ...$dashboardCore, 'dashboard.widget_room_availability',
                    'housekeeping.view', 'housekeeping.update_status', 'housekeeping.maintenance',
                    'rooms.view', 'room_types.view',
                    'settings.view',
                ],
                'department' => Department::TemizlikTamir,
            ],
            [
                'name' => 'Temizlik & Tamir Sorumlusu',
                'description' => 'Temizlik ve tamir ekibinin planlamasÄ±nÄ± yapar, oda hazÄ±rlÄ±k ve bakÄ±m standartlarÄ±nÄ± denetler.',
                'permissions' => [
                    ...$dashboardCore, 'dashboard.widget_room_availability',
                    'housekeeping.view', 'housekeeping.update_status', 'housekeeping.assign_staff', 'housekeeping.maintenance', 'housekeeping.mark_priority',
                    'rooms.view', 'rooms.edit', 'room_types.view',
                    'employees.view',
                    'settings.view',
                ],
                'visible_professions' => ['TemizlikÃ§i', 'Tamirci'],
                'department' => Department::TemizlikTamir,
            ],
            [
                'name' => 'Garson',
                'description' => 'Oda servisi sipariÅŸlerini karÅŸÄ±lar ve misafirlere odalarÄ±nda servis yapar.',
                'permissions' => [
                    ...$dashboardCore, 'dashboard.widget_today_checkins',
                    'reservations.view',
                    'room_service.view', 'room_service.create',
                    'settings.view',
                ],
                'department' => Department::Servis,
            ],
            [
                'name' => 'Garson Åefi',
                'description' => 'Oda servisi ekibini yÃ¶netir; sipariÅŸ, menÃ¼ ve servis kalitesi sÃ¼reÃ§lerini denetler.',
                'permissions' => [
                    ...$dashboardCore, 'dashboard.widget_today_checkins',
                    'reservations.view',
                    'room_service.view', 'room_service.create', 'room_service.delete',
                    'employees.view',
                    'settings.view',
                ],
                'visible_professions' => ['Garson'],
                'department' => Department::Servis,
            ],
        ];
    }

    /**
     * Renamed roles keyed by their old name â€” applied before the definitions
     * loop so an in-place rename doesn't leave the old row behind as an
     * orphan alongside a freshly-created one under the new name.
     */
    private const RENAMES = [
        'Temizlik Sorumlusu' => 'Temizlik & Tamir Sorumlusu',
    ];

    public function run(): void
    {
        foreach (self::RENAMES as $oldName => $newName) {
            Role::where('name', $oldName)->update(['name' => $newName]);
        }

        $permissionIdsByKey = Permission::query()->pluck('id', 'key');

        foreach (self::definitions() as $def) {
            $role = Role::updateOrCreate(
                ['name' => $def['name']],
                [
                    'slug' => Str::slug($def['name']),
                    'description' => $def['description'],
                    'is_system' => true,
                    'visible_professions' => $def['visible_professions'] ?? null,
                    'department' => $def['department'] ?? null,
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
