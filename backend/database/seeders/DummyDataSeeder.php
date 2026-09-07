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
                'name' => 'HavaalanÄ± Transferi (VIP)',
                'description' => 'Mercedes Vito ile lÃ¼ks ve konforlu havalimanÄ± transferi.',
                'price' => 1500.00,
                'is_active' => true,
            ],
            [
                'name' => 'Odaya KahvaltÄ±',
                'description' => 'Her sabah odanÄ±za Ã¶zel 2 kiÅŸilik serpme kahvaltÄ± servisi.',
                'price' => 450.00,
                'is_active' => true,
            ],
            [
                'name' => 'Spa ve Masaj Paketi',
                'description' => 'KonaklamanÄ±z boyunca 1 saatlik Ã¼cretsiz kese, kÃ¶pÃ¼k ve Ä°sveÃ§ masajÄ±.',
                'price' => 1200.00,
                'is_active' => true,
            ],
            [
                'name' => 'GeÃ§ Ã‡Ä±kÄ±ÅŸ (Late Check-out)',
                'description' => 'Odadan ayrÄ±lÄ±ÅŸ saatinizi 16:00\'a kadar uzatÄ±n.',
                'price' => 800.00,
                'is_active' => true,
            ],
            [
                'name' => 'Romantik Oda SÃ¼slemesi',
                'description' => 'GÃ¼l yapraklarÄ±, meyve sepeti ve ÅŸampanya ile Ã¶zel balayÄ±/yÄ±ldÃ¶nÃ¼mÃ¼ sÃ¼slemesi.',
                'price' => 950.00,
                'is_active' => true,
            ],
        ];

        foreach ($addons as $addonData) {
            Addon::firstOrCreate(['name' => $addonData['name']], $addonData);
        }
        $this->command->info('Ekstra hizmetler (Addons) oluÅŸturuldu.');

        // 2. Yorumlar (Reviews)
        // YorumlarÄ± rastgele rezervasyonlara baÄŸlamamÄ±z gerekiyor (Ã¶rnek veriler varsa).
        $reservations = Reservation::where('status', 'completed')->get();

        if ($reservations->isEmpty()) {
            $this->command->warn('TamamlanmÄ±ÅŸ rezervasyon bulunamadÄ±. Yorumlar mevcut herhangi bir rezervasyona baÄŸlanacak.');
            $reservations = Reservation::all();
        }

        if ($reservations->isNotEmpty()) {
            $reviews = [
                [
                    'rating' => 5,
                    'comment' => 'MÃ¼kemmel bir deneyimdi. Ã–zellikle spa hizmetine bayÄ±ldÄ±m. Her ÅŸey harikaydÄ±, kesinlikle tekrar geleceÄŸiz!',
                    'is_approved' => true,
                ],
                [
                    'rating' => 4,
                    'comment' => 'Odalar Ã§ok temizdi ve Ã§alÄ±ÅŸanlar gÃ¼ler yÃ¼zlÃ¼ydÃ¼. Sadece kahvaltÄ± Ã§eÅŸitliliÄŸi biraz daha artÄ±rÄ±labilir.',
                    'is_approved' => true,
                ],
                [
                    'rating' => 5,
                    'comment' => 'EÅŸimin doÄŸum gÃ¼nÃ¼ iÃ§in sÃ¼rpriz bir tatil planlamÄ±ÅŸtÄ±m. Romantik oda sÃ¼slemesi ÅŸahaneydi. TÃ¼m ekibe teÅŸekkÃ¼rler.',
                    'is_approved' => true,
                ],
                [
                    'rating' => 3,
                    'comment' => 'Otel konumu gÃ¼zel ama gece yan odalardan ses geliyordu. YalÄ±tÄ±m daha iyi olabilirdi.',
                    'is_approved' => false, // OnaylanmamÄ±ÅŸ yorum Ã¶rneÄŸi (Admin panelde onaya dÃ¼ÅŸecek)
                ],
                [
                    'rating' => 5,
                    'comment' => 'VIP transfer hizmeti tam zamanÄ±ndaydÄ± ve Ã§ok konforluydu. Otel genel anlamda premium hissettiriyor. TeÅŸekkÃ¼rler.',
                    'is_approved' => true,
                ]
            ];

            foreach ($reviews as $index => $reviewData) {
                // Rastgele bir rezervasyon seÃ§, yoksa ilk sÄ±radakileri kullan
                $reservation = $reservations->random();
                
                // AynÄ± rezervasyona birden fazla yorum eklenmemesi iÃ§in kontrol
                Review::firstOrCreate(
                    ['reservation_id' => $reservation->id],
                    $reviewData
                );
            }
            $this->command->info('Yorumlar (Reviews) oluÅŸturuldu.');
        } else {
            $this->command->warn('VeritabanÄ±nda hiÃ§ rezervasyon bulunamadÄ±. Yorum oluÅŸturulamadÄ±.');
        }
    }
}
