<?php

namespace App\Console\Commands;

use App\Enums\ReservationStatus;
use App\Models\Reservation;
use App\Services\ReservationService;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

/**
 * A pending/confirmed reservation whose check-out date has already passed
 * means the guest never checked in — the room was simply never claimed.
 * If it's also still short of its total (partial or fully unpaid), it's
 * dead stock: nothing left to collect and nothing to check in, so it's
 * auto-cancelled instead of lingering and skewing occupancy/revenue views.
 * checked_in/completed reservations are untouched — cancel() only allows
 * pending/confirmed -> cancelled anyway (see ReservationService::cancel()).
 */
class CancelUnpaidPastReservationsCommand extends Command
{
    protected $signature = 'hotel:cancel-unpaid-past-reservations';

    protected $description = 'Cancels pending/confirmed reservations whose check-out date has passed while still partially or fully unpaid';

    public function handle(ReservationService $reservationService): int
    {
        $candidates = Reservation::query()
            ->whereIn('status', [ReservationStatus::Pending->value, ReservationStatus::Confirmed->value])
            ->where('check_out', '<', Carbon::today())
            ->withSum('payments', 'amount')
            ->get()
            ->filter(fn (Reservation $r) => bccomp(
                (string) $r->total_amount,
                (string) ($r->payments_sum_amount ?? 0),
                2
            ) > 0);

        foreach ($candidates as $reservation) {
            $reservationService->cancel($reservation);
        }

        $this->info("Cancelled {$candidates->count()} unpaid/partially paid past reservation(s).");

        return self::SUCCESS;
    }
}
