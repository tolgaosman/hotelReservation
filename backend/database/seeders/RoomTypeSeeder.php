<?php

namespace Database\Seeders;

use App\Models\RoomType;
use Illuminate\Database\Seeder;

class RoomTypeSeeder extends Seeder
{
    /**
     * The 5 canonical types the dataset/rooms have always used — same
     * capacity/rate pairs as RoomFactory::ROOM_TYPES, now the single source
     * of truth instead of duplicated per-room. updateOrCreate keyed on name
     * so this composes cleanly with the FK-backfill migration's own inserts.
     */
    public static function definitions(): array
    {
        return [
            [
                'name' => 'Standart',
                'description' => 'Konforlu ve pratik konaklama arayan misafirler için temel ihtiyaçları karşılayan oda.',
                'capacity' => 2,
                'nightly_rate' => 1450,
                'amenities' => ['Klima', 'Wi-Fi', 'Kasa'],
                'bed_type' => 'Çift Kişilik',
                'size_m2' => 24,
                'view' => 'Şehir',
            ],
            [
                'name' => 'Deluxe',
                'description' => 'Geniş yaşam alanı ve üst düzey konfor sunan, daha fazla misafir ağırlayabilen oda.',
                'capacity' => 3,
                'nightly_rate' => 2200,
                'amenities' => ['Deniz Manzarası', 'Balkon', 'Klima', 'Mini Bar', 'Wi-Fi'],
                'bed_type' => 'Çift Kişilik',
                'size_m2' => 32,
                'view' => 'Deniz',
            ],
            [
                'name' => 'Aile Odası',
                'description' => 'Ailelerin bir arada, ferah bir alanda konaklaması için tasarlanmış geniş oda.',
                'capacity' => 4,
                'nightly_rate' => 2800,
                'amenities' => ['Balkon', 'Klima', 'Mini Bar', 'Wi-Fi', 'Kasa'],
                'bed_type' => 'İki Tek Yatak',
                'size_m2' => 40,
                'view' => 'Bahçe',
            ],
            [
                'name' => 'Suite',
                'description' => 'Ayrı oturma alanına sahip, üstün konfor sunan geniş süit oda.',
                'capacity' => 4,
                'nightly_rate' => 3600,
                'amenities' => ['Deniz Manzarası', 'Balkon', 'Klima', 'Mini Bar', 'Jakuzi', 'Wi-Fi', 'Oda Servisi'],
                'bed_type' => 'King',
                'size_m2' => 55,
                'view' => 'Deniz',
            ],
            [
                'name' => 'King Suite',
                'description' => 'Otelin en üst düzey konaklama seçeneği; geniş alan, tam donanım ve panoramik manzara.',
                'capacity' => 5,
                'nightly_rate' => 5500,
                'amenities' => ['Deniz Manzarası', 'Balkon', 'Klima', 'Mini Bar', 'Jakuzi', 'Wi-Fi', 'Kasa', 'Oda Servisi'],
                'bed_type' => 'King',
                'size_m2' => 75,
                'view' => 'Deniz',
            ],
        ];
    }

    public function run(): void
    {
        foreach (self::definitions() as $def) {
            RoomType::updateOrCreate(['name' => $def['name']], $def);
        }
    }
}

