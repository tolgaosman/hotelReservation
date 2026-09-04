<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Addon;
use App\Models\Review;
use App\Models\Reservation;

class DummyDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Ekstra Hizmetler (Addons)
        $addons = [
            [
                'name' => 'Havaalanı Transferi (VIP)',
                'description' => 'Mercedes Vito ile lüks ve konforlu havalimanı transferi.',
                'price' => 1500.00,
                'is_active' => true,
            ],
            [
                'name' => 'Odaya Kahvaltı',
                'description' => 'Her sabah odanıza özel 2 kişilik serpme kahvaltı servisi.',
                'price' => 450.00,
                'is_active' => true,
            ],
            [
                'name' => 'Spa ve Masaj Paketi',
                'description' => 'Konaklamanız boyunca 1 saatlik ücretsiz kese, köpük ve İsveç masajı.',
                'price' => 1200.00,
                'is_active' => true,
            ],
            [
                'name' => 'Geç Çıkış (Late Check-out)',
                'description' => 'Odadan ayrılış saatinizi 16:00\'a kadar uzatın.',
                'price' => 800.00,
                'is_active' => true,
            ],
            [
                'name' => 'Romantik Oda Süslemesi',
                'description' => 'Gül yaprakları, meyve sepeti ve şampanya ile özel balayı/yıldönümü süslemesi.',
                'price' => 950.00,
                'is_active' => true,
            ],
        ];

        foreach ($addons as $addonData) {
            Addon::firstOrCreate(['name' => $addonData['name']], $addonData);
        }
        $this->command->info('Ekstra hizmetler (Addons) oluşturuldu.');

        // 2. Yorumlar (Reviews)
        // Yorumları rastgele rezervasyonlara bağlamamız gerekiyor (örnek veriler varsa).
        $reservations = Reservation::where('status', 'completed')->get();

        if ($reservations->isEmpty()) {
            $this->command->warn('Tamamlanmış rezervasyon bulunamadı. Yorumlar mevcut herhangi bir rezervasyona bağlanacak.');
            $reservations = Reservation::all();
        }

        if ($reservations->isNotEmpty()) {
            $reviews = [
                [
                    'rating' => 5,
                    'comment' => 'Mükemmel bir deneyimdi. Özellikle spa hizmetine bayıldım. Her şey harikaydı, kesinlikle tekrar geleceğiz!',
                    'is_approved' => true,
                ],
                [
                    'rating' => 4,
                    'comment' => 'Odalar çok temizdi ve çalışanlar güler yüzlüydü. Sadece kahvaltı çeşitliliği biraz daha artırılabilir.',
                    'is_approved' => true,
                ],
                [
                    'rating' => 5,
                    'comment' => 'Eşimin doğum günü için sürpriz bir tatil planlamıştım. Romantik oda süslemesi şahaneydi. Tüm ekibe teşekkürler.',
                    'is_approved' => true,
                ],
                [
                    'rating' => 3,
                    'comment' => 'Otel konumu güzel ama gece yan odalardan ses geliyordu. Yalıtım daha iyi olabilirdi.',
                    'is_approved' => false, // Onaylanmamış yorum örneği (Admin panelde onaya düşecek)
                ],
                [
                    'rating' => 5,
                    'comment' => 'VIP transfer hizmeti tam zamanındaydı ve çok konforluydu. Otel genel anlamda premium hissettiriyor. Teşekkürler.',
                    'is_approved' => true,
                ]
            ];

            foreach ($reviews as $index => $reviewData) {
                // Rastgele bir rezervasyon seç, yoksa ilk sıradakileri kullan
                $reservation = $reservations->random();
                
                // Aynı rezervasyona birden fazla yorum eklenmemesi için kontrol
                Review::firstOrCreate(
                    ['reservation_id' => $reservation->id],
                    $reviewData
                );
            }
            $this->command->info('Yorumlar (Reviews) oluşturuldu.');
        } else {
            $this->command->warn('Veritabanında hiç rezervasyon bulunamadı. Yorum oluşturulamadı.');
        }
    }
}
