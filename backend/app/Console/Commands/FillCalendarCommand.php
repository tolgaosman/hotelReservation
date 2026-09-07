<?php

namespace App\Console\Commands;

use App\Enums\PaymentMethod;
use App\Enums\ReservationStatus;
use App\Enums\RoomStatus;
use App\Models\Guest;
use App\Models\Payment;
use App\Models\Reservation;
use App\Models\Room;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Books each active room forward from wherever its existing reservations
 * currently end (or today, if that's later) out to a rolling horizon, so the
 * calendar always has a realistic forward book instead of the flat seed
 * dataset's frozen 2026-12/2027-01 cutoff. Safe to re-run â€” and worth
 * scheduling (see routes/console.php) â€” since each room's cursor is derived
 * from its own latest non-cancelled reservation, so a run never rewrites the
 * past or creates an overlap, it only ever extends the horizon further out.
 */
class FillCalendarCommand extends Command
{
    protected $signature = 'hotel:fill-calendar
        {--months=3 : How many months ahead of today to keep booked}
        {--occupancy=65 : Target percentage of nights that end up booked, per room}';

    protected $description = 'Generates non-overlapping future reservations so the calendar stays realistically full going forward';

    public function handle(): int
    {
        $horizon = Carbon::today()->addMonths((int) $this->option('months'));
        $occupancy = max(0, min(100, (int) $this->option('occupancy')));

        $rooms = Room::query()->whereNotIn('status', [RoomStatus::Passive->value, RoomStatus::Maintenance->value])->get();
        $guestIds = Guest::query()->pluck('id');

        if ($rooms->isEmpty() || $guestIds->isEmpty()) {
            $this->error('No active rooms or no guests to book â€” run the base seeders first.');

            return self::FAILURE;
        }

        $totalCreated = 0;

        foreach ($rooms as $room) {
            $totalCreated += $this->fillRoom($room, $guestIds, $horizon, $occupancy);
        }

        $this->info("Created {$totalCreated} reservation(s) across {$rooms->count()} room(s), booked through {$horizon->toDateString()}.");

        return self::SUCCESS;
    }

    private function fillRoom(Room $room, Collection $guestIds, Carbon $horizon, int $occupancy): int
    {
        return DB::transaction(function () use ($room, $guestIds, $horizon, $occupancy) {
            $latestCheckout = Reservation::query()
                ->where('room_id', $room->id)
                ->activeStatuses()
                ->max('check_out');

            $cursor = $latestCheckout ? Carbon::parse($latestCheckout)->max(Carbon::today()) : Carbon::today();
            $created = 0;

            while ($cursor->lt($horizon)) {
                // Leaves a vacancy gap between stays so the room isn't
                // booked wall-to-wall â€” the gap length is what actually
                // drives the target occupancy percentage down from 100%.
                if (random_int(1, 100) > $occupancy) {
                    $cursor = $cursor->copy()->addDays(random_int(1, 4));

                    continue;
                }

                $nights = random_int(1, 7);
                $checkIn = $cursor->copy();
                $checkOut = $checkIn->copy()->addDays($nights);

                if ($checkOut->gt($horizon)) {
                    break;
                }

                $totalAmount = round((float) $room->nightly_rate * $nights, 2);
                // Bookings this far out are never walk-ins, so only the two
                // pre-arrival statuses apply â€” mirrors the seeded dataset's
                // own confirmed/pending split for future stays.
                $status = random_int(1, 100) <= 65 ? ReservationStatus::Confirmed : ReservationStatus::Pending;

                $reservation = Reservation::create([
                    'guest_id' => $guestIds->random(),
                    'room_id' => $room->id,
                    'check_in' => $checkIn,
                    'check_out' => $checkOut,
                    'guest_count' => random_int(1, max(1, $room->capacity)),
                    'status' => $status,
                    'total_amount' => $totalAmount,
                ]);

                if ($status === ReservationStatus::Confirmed && random_int(1, 100) <= 40) {
                    Payment::create([
                        'reservation_id' => $reservation->id,
                        'amount' => round($totalAmount * (random_int(20, 60) / 100), 2),
                        'method' => collect(PaymentMethod::cases())->random(),
                        'note' => 'Ã–n Ã¶deme',
                    ]);
                }

                $created++;
                $cursor = $checkOut;
            }

            return $created;
        });
    }
}
