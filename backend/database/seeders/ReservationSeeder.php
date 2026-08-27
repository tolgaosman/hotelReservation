<?php

namespace Database\Seeders;

use App\Enums\PaymentMethod;
use App\Enums\ReservationStatus;
use App\Models\Guest;
use App\Models\Payment;
use App\Models\Reservation;
use App\Models\Room;
use App\Services\ReservationService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class ReservationSeeder extends Seeder
{
    public function run(): void
    {
        $service = app(ReservationService::class);
        $rooms = Room::all();
        $guestIds = Guest::pluck('id')->all();

        $plans = [
            // [status, daysFromTodayForCheckIn, nights]
            ...array_fill(0, 120, ['status' => ReservationStatus::Completed, 'offset' => fn () => rand(-180, -3)]),
            ...array_fill(0, 15, ['status' => ReservationStatus::Cancelled, 'offset' => fn () => rand(-60, 30)]),
            ...array_fill(0, 20, ['status' => ReservationStatus::CheckedIn, 'offset' => fn () => rand(-3, 0)]),
            ...array_fill(0, 30, ['status' => ReservationStatus::Confirmed, 'offset' => fn () => rand(1, 45)]),
            ...array_fill(0, 25, ['status' => ReservationStatus::Pending, 'offset' => fn () => rand(1, 60)]),
        ];

        foreach ($plans as $plan) {
            $room = $rooms->random();
            $nights = rand(1, 7);
            $checkIn = Carbon::today()->addDays(($plan['offset'])());
            $checkOut = (clone $checkIn)->addDays($nights);

            if ($plan['status'] !== ReservationStatus::Cancelled
                && $service->hasConflict($room->id, $checkIn, $checkOut)) {
                continue;
            }

            $reservation = Reservation::create([
                'guest_id' => $guestIds[array_rand($guestIds)],
                'room_id' => $room->id,
                'check_in' => $checkIn,
                'check_out' => $checkOut,
                'guest_count' => rand(1, $room->capacity),
                'status' => $plan['status'],
                'total_amount' => round((float) $room->nightly_rate * $nights, 2),
                'checked_in_at' => in_array($plan['status'], [ReservationStatus::CheckedIn, ReservationStatus::Completed], true) ? $checkIn->copy()->setTime(14, 0) : null,
                'checked_out_at' => $plan['status'] === ReservationStatus::Completed ? $checkOut->copy()->setTime(11, 0) : null,
                'cancelled_at' => $plan['status'] === ReservationStatus::Cancelled ? $checkIn->copy()->subDays(1) : null,
            ]);

            $this->attachPayments($reservation, $plan['status']);
        }
    }

    private function attachPayments(Reservation $reservation, ReservationStatus $status): void
    {
        if ($status === ReservationStatus::Cancelled || $status === ReservationStatus::Pending) {
            return;
        }

        $target = $status === ReservationStatus::Completed
            ? $reservation->total_amount
            : round($reservation->total_amount * (rand(30, 90) / 100), 2);

        $remaining = $target;
        $installments = rand(1, 2);

        for ($i = 0; $i < $installments && $remaining > 0; $i++) {
            $amount = $i === $installments - 1 ? $remaining : round($remaining / 2, 2);
            $remaining -= $amount;

            Payment::create([
                'reservation_id' => $reservation->id,
                'amount' => $amount,
                'method' => collect(PaymentMethod::cases())->random(),
            ]);
        }
    }
}
