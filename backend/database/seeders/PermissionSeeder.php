<?php

namespace Database\Seeders;

use App\Models\Permission;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    /**
     * The full permission catalog, grouped by nav page. Each group's first
     * entry (is_page_permission = true) gates whether that page is visible
     * at all; the rest are in-page permissions only meaningful once the page
     * one is granted â€” the roles page renders them nested under it for
     * exactly that reason.
     */
    public static function catalog(): array
    {
        return [
            'dashboard' => [
                'label' => 'Dashboard',
                'permissions' => [
                    'dashboard.view' => ['DashboardÄ± GÃ¶rÃ¼ntÃ¼leme', true],
                    'dashboard.widget_room_availability' => ['BileÅŸen: Oda Durumu', false],
                    'dashboard.widget_revenue' => ['BileÅŸen: Gelir GrafiÄŸi', false],
                    'dashboard.widget_status_donut' => ['BileÅŸen: Rezervasyon Durum DaÄŸÄ±lÄ±mÄ±', false],
                    'dashboard.widget_country' => ['BileÅŸen: Ãœlkelere GÃ¶re Rezervasyonlar', false],
                    'dashboard.widget_today_checkins' => ['BileÅŸen: BugÃ¼nkÃ¼ GiriÅŸler', false],
                    'dashboard.widget_today_checkouts' => ['BileÅŸen: BugÃ¼nkÃ¼ Ã‡Ä±kÄ±ÅŸlar', false],
                    'dashboard.widget_total_revenue' => ['BileÅŸen: Toplam Gelir / Son Ã–demeler', false],
                    'dashboard.widget_upcoming' => ['BileÅŸen: YaklaÅŸan Rezervasyonlar', false],
                ],
            ],
            'reservations' => [
                'label' => 'Rezervasyonlar',
                'permissions' => [
                    'reservations.view' => ['SayfayÄ± GÃ¶rÃ¼ntÃ¼leme', true],
                    'reservations.create' => ['Yeni Rezervasyon OluÅŸturma', false],
                    'reservations.edit' => ['Rezervasyon DÃ¼zenleme', false],
                    'reservations.confirm' => ['Rezervasyon Onaylama', false],
                    'reservations.cancel' => ['Rezervasyon Ä°ptal Etme', false],
                    'reservations.checkin' => ['Check-in Yapma', false],
                    'reservations.checkout' => ['Check-out Yapma', false],
                    'reservations.delete' => ['Rezervasyon Silme', false],
                ],
            ],
            'calendar' => [
                'label' => 'Takvim',
                'permissions' => [
                    'calendar.view' => ['SayfayÄ± GÃ¶rÃ¼ntÃ¼leme', true],
                ],
            ],
            'guests' => [
                'label' => 'Misafirler',
                'permissions' => [
                    'guests.view' => ['SayfayÄ± GÃ¶rÃ¼ntÃ¼leme', true],
                    'guests.create' => ['Yeni Misafir Ekleme', false],
                    'guests.edit' => ['Misafir DÃ¼zenleme', false],
                ],
            ],
            'rooms' => [
                'label' => 'Odalar',
                'permissions' => [
                    'rooms.view' => ['SayfayÄ± GÃ¶rÃ¼ntÃ¼leme', true],
                    'rooms.create' => ['Yeni Oda Ekleme', false],
                    'rooms.edit' => ['Oda DÃ¼zenleme', false],
                    'rooms.deactivate' => ['Oda Pasife Alma', false],
                ],
            ],
            'room_types' => [
                'label' => 'Oda Tipleri',
                'permissions' => [
                    'room_types.view' => ['SayfayÄ± GÃ¶rÃ¼ntÃ¼leme', true],
                    'room_types.create' => ['Yeni Oda Tipi Ekleme', false],
                    'room_types.edit' => ['Oda Tipi DÃ¼zenleme', false],
                    'room_types.delete' => ['Oda Tipi Silme', false],
                ],
            ],
            'housekeeping' => [
                'label' => 'Temizlik',
                'permissions' => [
                    'housekeeping.view' => ['SayfayÄ± GÃ¶rÃ¼ntÃ¼leme', true],
                    'housekeeping.update_status' => ['Temizlik Durumu GÃ¼ncelleme', false],
                    'housekeeping.assign_staff' => ['Temizlik Personeli Atama', false],
                    'housekeeping.maintenance' => ['ArÄ±za Bildirme / Giderme', false],
                    'housekeeping.mark_priority' => ['Ã–ncelikli Temizlik Ä°ÅŸaretleme', false],
                ],
            ],
            'room_service' => [
                'label' => 'Oda Servisi',
                'permissions' => [
                    'room_service.view' => ['SayfayÄ± GÃ¶rÃ¼ntÃ¼leme', true],
                    'room_service.create' => ['SipariÅŸ Ekleme', false],
                    'room_service.delete' => ['SipariÅŸ Silme', false],
                ],
            ],
            'addons' => [
                'label' => 'Ekstra Hizmetler',
                'permissions' => [
                    'addons.view' => ['SayfayÄ± GÃ¶rÃ¼ntÃ¼leme', true],
                    'addons.create' => ['Yeni Hizmet Ekleme', false],
                    'addons.edit' => ['Hizmet DÃ¼zenleme', false],
                    'addons.delete' => ['Hizmet Silme', false],
                ],
            ],
            'reviews' => [
                'label' => 'Yorum YÃ¶netimi',
                'permissions' => [
                    'reviews.view' => ['SayfayÄ± GÃ¶rÃ¼ntÃ¼leme', true],
                    'reviews.approve' => ['Yorum Onaylama/Reddetme', false],
                ],
            ],
            'payments' => [
                'label' => 'Ã–demeler',
                'permissions' => [
                    'payments.view' => ['SayfayÄ± GÃ¶rÃ¼ntÃ¼leme', true],
                    'payments.create' => ['Ã–deme Alma', false],
                ],
            ],
            'employees' => [
                'label' => 'Ã‡alÄ±ÅŸanlar',
                'permissions' => [
                    'employees.view' => ['SayfayÄ± GÃ¶rÃ¼ntÃ¼leme', true],
                    'employees.create' => ['Yeni Ã‡alÄ±ÅŸan Ekleme', false],
                    'employees.edit' => ['Ã‡alÄ±ÅŸan DÃ¼zenleme', false],
                ],
            ],
            'roles' => [
                'label' => 'Roller',
                'permissions' => [
                    'roles.view' => ['SayfayÄ± GÃ¶rÃ¼ntÃ¼leme', true],
                    'roles.create' => ['Yeni Rol Ekleme', false],
                    'roles.edit' => ['Rol DÃ¼zenleme', false],
                    'roles.delete' => ['Rol Silme', false],
                ],
            ],
            'settings' => [
                'label' => 'Ayarlar',
                'permissions' => [
                    'settings.view' => ['SayfayÄ± GÃ¶rÃ¼ntÃ¼leme', true],
                ],
            ],
            'audit_logs' => [
                'label' => 'Aktivite KayÄ±tlarÄ±',
                'permissions' => [
                    'audit_logs.view' => ['SayfayÄ± GÃ¶rÃ¼ntÃ¼leme (Kendi DepartmanÄ±)', true],
                    'audit_logs.view_all' => ['TÃ¼m DepartmanlarÄ± GÃ¶rÃ¼ntÃ¼leme', false],
                ],
            ],
        ];
    }

    public function run(): void
    {
        $sort = 0;
        foreach (self::catalog() as $group => $def) {
            foreach ($def['permissions'] as $key => [$label, $isPage]) {
                Permission::updateOrCreate(
                    ['key' => $key],
                    [
                        'label' => $label,
                        'group' => $group,
                        'group_label' => $def['label'],
                        'is_page_permission' => $isPage,
                        'sort_order' => $sort++,
                    ]
                );
            }
        }
    }
}
