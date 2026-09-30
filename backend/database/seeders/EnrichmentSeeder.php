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

        // 4. Yorumlar (Reviews)
        // Gerçek misafir adı ve oda numarasına bağlı kalması için, tamamlanmış
        // rezervasyonlardan (misafir + oda ilişkileri yüklenmiş) rastgele bir
        // örneklem alınır — tüm tamamlanmış rezervasyonlar için yorum
        // oluşturmak (binlerce satır olabilir) burada amaçlanmıyor.
        $completedReservations = Reservation::with(['guest', 'room'])
            ->where('status', ReservationStatus::Completed)
            ->inRandomOrder()
            ->limit(15)
            ->get()
            ->filter(fn ($res) => $res->guest && $res->room);
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
                    ['room_id' => $res->room_id, 'guest_name' => $res->guest->full_name],
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
