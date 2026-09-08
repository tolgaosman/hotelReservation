<?php

namespace Database\Seeders;

use App\Enums\ReservationStatus;
use App\Models\Guest;
use App\Models\Reservation;
use App\Models\RestaurantReservation;
use App\Models\Review;
use App\Models\Room;
use App\Enums\RestaurantPaymentStatus;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class EnrichmentSeeder extends Seeder
{
    public function run(): void
    {
        $today = Carbon::today();

        // 1. Bugüne giriş, çıkış ve konaklayan (checked_in) rezervasyonlar ayarlayalım.
        // Veritabanındaki rastgele birkaç rezervasyonu bugüne kaydırıyoruz.
        $reservations = Reservation::inRandomOrder()->limit(15)->get();
        $guests = Guest::inRandomOrder()->limit(10)->get();
        $rooms = Room::where('status', 'available')->inRandomOrder()->limit(5)->get();

        if ($reservations->count() >= 3) {
            // Bugün Giriş (Check-in)
            $res1 = $reservations[0];
            $res1->update([
                'check_in' => $today->format('Y-m-d'),
                'check_out' => $today->copy()->addDays(3)->format('Y-m-d'),
                'status' => ReservationStatus::Confirmed,
            ]);

            // Bugün Çıkış (Check-out)
            $res2 = $reservations[1];
            $res2->update([
                'check_in' => $today->copy()->subDays(2)->format('Y-m-d'),
                'check_out' => $today->format('Y-m-d'),
                'status' => ReservationStatus::CheckedIn,
            ]);

            // Bugün Konaklayan (In-house)
            $res3 = $reservations[2];
            $res3->update([
                'check_in' => $today->copy()->subDays(1)->format('Y-m-d'),
                'check_out' => $today->copy()->addDays(2)->format('Y-m-d'),
                'status' => ReservationStatus::CheckedIn,
            ]);
        }

        // 2. Takvimi daha zengin göstermek için geleceğe ve geçmişe ekstra rezervasyonlar
        $statuses = [ReservationStatus::Confirmed, ReservationStatus::CheckedIn, ReservationStatus::Completed, ReservationStatus::Cancelled];
        
        for ($i = 0; $i < 20; $i++) {
            if ($guests->isEmpty() || $rooms->isEmpty()) break;
            
            $offset = rand(-10, 30);
            $duration = rand(1, 5);
            $checkIn = $today->copy()->addDays($offset);
            $checkOut = $checkIn->copy()->addDays($duration);
            
            $status = ReservationStatus::Confirmed;
            if ($offset < 0 && $checkOut > $today) $status = ReservationStatus::CheckedIn;
            if ($checkOut < $today) $status = ReservationStatus::Completed;
            if (rand(0, 10) > 8) $status = ReservationStatus::Cancelled;

            Reservation::create([
                'guest_id' => $guests->random()->id,
                'room_id' => $rooms->random()->id,
                'check_in' => $checkIn->format('Y-m-d'),
                'check_out' => $checkOut->format('Y-m-d'),
                'guest_count' => rand(1, 4),
                'status' => $status,
                'total_amount' => rand(1500, 15000),
            ]);
        }

        // 3. Restoran Rezervasyonları
        $restNames = ['Ali Yılmaz', 'Ayşe Demir', 'Fatma Kaya', 'Mehmet Çelik', 'Caner Can'];
        for ($i = 0; $i < 15; $i++) {
            $isGuest = rand(0, 1) == 1;
            $resId = null;
            
            if ($isGuest && $reservations->isNotEmpty()) {
                $resId = $reservations->random()->id;
            }

            RestaurantReservation::create([
                'full_name' => $restNames[array_rand($restNames)] . ' ' . rand(1, 100),
                'phone' => '05' . rand(300000000, 599999999),
                'email' => 'test' . rand(1, 999) . '@example.com',
                'party_size' => rand(2, 6),
                'date' => $today->copy()->addDays(rand(-2, 5))->format('Y-m-d'),
                'time' => rand(18, 22) . ':00',
                'note' => rand(0, 1) ? 'Deniz kenarı masa tercihi' : null,
                'is_hotel_guest' => $isGuest,
                'reservation_id' => $resId,
                'payment_status' => $isGuest ? RestaurantPaymentStatus::Waived : RestaurantPaymentStatus::PayAtHotel,
                'amount' => $isGuest ? 0 : rand(500, 3000),
                'card_holder_name' => null,
                'card_last_four' => null,
            ]);
        }

        // 4. Yorumlar (Reviews)
        $completedReservations = Reservation::where('status', ReservationStatus::Completed)->get();
        $comments = [
            'Oda çok temizdi, personel çok ilgiliydi.',
            'Kahvaltı efsaneydi, kesinlikle tavsiye ederim.',
            'Deniz manzaralı odalar muazzam.',
            'Biraz pahalı ama değdi.',
            'Ailece çok eğlendik, teşekkürler.'
        ];

        foreach ($completedReservations as $res) {
            if (rand(0, 10) > 4) {
                Review::firstOrCreate(
                    ['reservation_id' => $res->id],
                    [
                        'rating' => rand(4, 5),
                        'comment' => $comments[array_rand($comments)],
                        'is_approved' => rand(0, 1) == 1,
                    ]
                );
            }
        }

        $this->command->info('Dataset zenginleştirildi: Bugünün giriş/çıkışları, yeni rezervasyonlar, restoran rezervasyonları ve yorumlar eklendi.');
    }
}
