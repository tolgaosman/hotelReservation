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
     * one is granted — the roles page renders them nested under it for
     * exactly that reason.
     */
    public static function catalog(): array
    {
        return [
            'dashboard' => [
                'label' => 'Dashboard',
                'permissions' => [
                    'dashboard.view' => ['Dashboardı Görüntüleme', true],
                    'dashboard.widget_room_availability' => ['Bileşen: Oda Durumu', false],
                    'dashboard.widget_revenue' => ['Bileşen: Gelir Grafiği', false],
                    'dashboard.widget_status_donut' => ['Bileşen: Rezervasyon Durum Dağılımı', false],
                    'dashboard.widget_country' => ['Bileşen: Ülkelere Göre Rezervasyonlar', false],
                    'dashboard.widget_today_checkins' => ['Bileşen: Bugünkü Girişler', false],
                    'dashboard.widget_today_checkouts' => ['Bileşen: Bugünkü Çıkışlar', false],
                    'dashboard.widget_total_revenue' => ['Bileşen: Toplam Gelir / Son Ödemeler', false],
                    'dashboard.widget_upcoming' => ['Bileşen: Yaklaşan Rezervasyonlar', false],
                ],
            ],
            'reservations' => [
                'label' => 'Rezervasyonlar',
                'permissions' => [
                    'reservations.view' => ['Sayfayı Görüntüleme', true],
                    'reservations.create' => ['Yeni Rezervasyon Oluşturma', false],
                    'reservations.edit' => ['Rezervasyon Düzenleme', false],
                    'reservations.confirm' => ['Rezervasyon Onaylama', false],
                    'reservations.cancel' => ['Rezervasyon İptal Etme', false],
                    'reservations.checkin' => ['Check-in Yapma', false],
                    'reservations.checkout' => ['Check-out Yapma', false],
                ],
            ],
            'calendar' => [
                'label' => 'Takvim',
                'permissions' => [
                    'calendar.view' => ['Sayfayı Görüntüleme', true],
                ],
            ],
            'guests' => [
                'label' => 'Misafirler',
                'permissions' => [
                    'guests.view' => ['Sayfayı Görüntüleme', true],
                    'guests.create' => ['Yeni Misafir Ekleme', false],
                    'guests.edit' => ['Misafir Düzenleme', false],
                ],
            ],
            'rooms' => [
                'label' => 'Odalar',
                'permissions' => [
                    'rooms.view' => ['Sayfayı Görüntüleme', true],
                    'rooms.create' => ['Yeni Oda Ekleme', false],
                    'rooms.edit' => ['Oda Düzenleme', false],
                    'rooms.deactivate' => ['Oda Pasife Alma', false],
                ],
            ],
            'housekeeping' => [
                'label' => 'Temizlik',
                'permissions' => [
                    'housekeeping.view' => ['Sayfayı Görüntüleme', true],
                    'housekeeping.update_status' => ['Temizlik Durumu Güncelleme', false],
                ],
            ],
            'room_service' => [
                'label' => 'Oda Servisi',
                'permissions' => [
                    'room_service.view' => ['Sayfayı Görüntüleme', true],
                    'room_service.create' => ['Sipariş Ekleme', false],
                    'room_service.delete' => ['Sipariş Silme', false],
                ],
            ],
            'payments' => [
                'label' => 'Ödemeler',
                'permissions' => [
                    'payments.view' => ['Sayfayı Görüntüleme', true],
                    'payments.create' => ['Ödeme Alma', false],
                ],
            ],
            'employees' => [
                'label' => 'Çalışanlar',
                'permissions' => [
                    'employees.view' => ['Sayfayı Görüntüleme', true],
                    'employees.create' => ['Yeni Çalışan Ekleme', false],
                    'employees.edit' => ['Çalışan Düzenleme', false],
                ],
            ],
            'roles' => [
                'label' => 'Roller',
                'permissions' => [
                    'roles.view' => ['Sayfayı Görüntüleme', true],
                    'roles.create' => ['Yeni Rol Ekleme', false],
                    'roles.edit' => ['Rol Düzenleme', false],
                ],
            ],
            'settings' => [
                'label' => 'Ayarlar',
                'permissions' => [
                    'settings.view' => ['Sayfayı Görüntüleme', true],
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
