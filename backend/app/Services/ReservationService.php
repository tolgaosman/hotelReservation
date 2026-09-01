<?php

namespace App\Services;

use App\Enums\ReservationStatus;
use App\Enums\RoomStatus;
use App\Exceptions\DomainActionException;
use App\Models\Reservation;
use App\Models\Room;
use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class ReservationService
{
    public function __construct(private readonly AuditLogService $auditLog)
    {
    }

    /**
     * Whether the room already has an overlapping active reservation for the
     * given date range. Same-day turnover (an existing checkout equal to the
     * new check-in) is allowed, hence the strict comparisons.
     */
    public function hasConflict(int $roomId, CarbonInterface $checkIn, CarbonInterface $checkOut, ?int $excludeReservationId = null): bool
    {
        return Reservation::query()
            ->where('room_id', $roomId)
            ->activeStatuses()
            ->when($excludeReservationId, fn ($q) => $q->whereKeyNot($excludeReservationId))
            ->where('check_in', '<', $checkOut)
            ->where('check_out', '>', $checkIn)
            ->exists();
    }

    public function calculateTotal(Room $room, CarbonInterface $checkIn, CarbonInterface $checkOut): float
    {
        $nights = $checkIn->diffInDays($checkOut);

        return round((float) $room->nightly_rate * $nights, 2);
    }

    public function create(array $data): Reservation
    {
        return DB::transaction(function () use ($data) {
            /** @var Room $room */
            $room = Room::query()->lockForUpdate()->findOrFail($data['room_id']);
            $checkIn = Carbon::parse($data['check_in']);
            $checkOut = Carbon::parse($data['check_out']);

            if (in_array($room->status, [RoomStatus::Passive, RoomStatus::Maintenance], true)) {
                throw new DomainActionException('Pasif veya bakımdaki bir oda için rezervasyon oluşturulamaz.');
            }

            if ($this->hasConflict($room->id, $checkIn, $checkOut)) {
                throw new DomainActionException('Bu oda seçilen tarihlerde başka bir aktif rezervasyona sahip.');
            }

            $reservation = Reservation::create([
                'guest_id' => $data['guest_id'],
                'room_id' => $room->id,
                'check_in' => $checkIn,
                'check_out' => $checkOut,
                'guest_count' => $data['guest_count'],
                'status' => ReservationStatus::Pending,
                'total_amount' => $this->calculateTotal($room, $checkIn, $checkOut),
                'created_by' => $data['created_by'] ?? null,
            ]);

            $reservation->companions()->sync($data['companions'] ?? []);

            $this->auditLog->record('reservation.create', $reservation);

            return $reservation;
        });
    }

    public function update(Reservation $reservation, array $data): Reservation
    {
        return DB::transaction(function () use ($reservation, $data) {
            if (! in_array($reservation->status, [ReservationStatus::Pending, ReservationStatus::Confirmed], true)) {
                throw new DomainActionException('Bu durumdaki bir rezervasyon güncellenemez.');
            }

            $room = $data['room_id'] ?? null
                ? Room::query()->lockForUpdate()->findOrFail($data['room_id'])
                : $reservation->room()->lockForUpdate()->first();

            // Only enforce this when the caller is actively (re)picking a room —
            // an existing reservation shouldn't be blocked from unrelated edits
            // just because its already-assigned room was later marked passive/maintenance.
            if (isset($data['room_id']) && in_array($room->status, [RoomStatus::Passive, RoomStatus::Maintenance], true)) {
                throw new DomainActionException('Pasif veya bakımdaki bir oda için rezervasyon oluşturulamaz.');
            }

            $checkIn = isset($data['check_in']) ? Carbon::parse($data['check_in']) : $reservation->check_in;
            $checkOut = isset($data['check_out']) ? Carbon::parse($data['check_out']) : $reservation->check_out;

            if ($this->hasConflict($room->id, $checkIn, $checkOut, $reservation->id)) {
                throw new DomainActionException('Bu oda seçilen tarihlerde başka bir aktif rezervasyona sahip.');
            }

            $roomServicesTotal = $reservation->roomServices()->sum('amount');
            $newTotal = $this->calculateTotal($room, $checkIn, $checkOut) + $roomServicesTotal;
            $paidAmount = (float) $reservation->payments()->sum('amount');

            if (bccomp((string) $newTotal, (string) $paidAmount, 2) < 0) {
                throw new DomainActionException('Bu değişiklik toplam tutarı, rezervasyon için ödenen tutarın altına düşürür.');
            }

            $reservation->fill([
                'guest_id' => $data['guest_id'] ?? $reservation->guest_id,
                'room_id' => $room->id,
                'check_in' => $checkIn,
                'check_out' => $checkOut,
                'guest_count' => $data['guest_count'] ?? $reservation->guest_count,
                'total_amount' => $newTotal,
            ]);
            $reservation->save();

            if (array_key_exists('companions', $data)) {
                $reservation->companions()->sync($data['companions']);
            }

            $this->auditLog->record('reservation.update', $reservation);

            return $reservation;
        });
    }

    public function confirm(Reservation $reservation): Reservation
    {
        $this->assertTransition($reservation, ReservationStatus::Pending, ReservationStatus::Confirmed);
        $reservation->update(['status' => ReservationStatus::Confirmed]);
        $this->auditLog->record('reservation.confirm', $reservation);

        return $reservation;
    }

    public function cancel(Reservation $reservation): Reservation
    {
        if (! in_array($reservation->status, [ReservationStatus::Pending, ReservationStatus::Confirmed], true)) {
            throw new DomainActionException('Bu durumdaki bir rezervasyon iptal edilemez.');
        }

        $reservation->update([
            'status' => ReservationStatus::Cancelled,
            'cancelled_at' => now(),
        ]);
        $this->auditLog->record('reservation.cancel', $reservation);

        return $reservation;
    }

    public function checkIn(Reservation $reservation): Reservation
    {
        $this->assertTransition($reservation, ReservationStatus::Confirmed, ReservationStatus::CheckedIn);

        return DB::transaction(function () use ($reservation) {
            $reservation->update([
                'status' => ReservationStatus::CheckedIn,
                'checked_in_at' => now(),
            ]);
            $reservation->room()->update(['status' => RoomStatus::Occupied]);
            $this->auditLog->record('reservation.check_in', $reservation);

            return $reservation;
        });
    }

    public function checkOut(Reservation $reservation): Reservation
    {
        $this->assertTransition($reservation, ReservationStatus::CheckedIn, ReservationStatus::Completed);

        return DB::transaction(function () use ($reservation) {
            $reservation->update([
                'status' => ReservationStatus::Completed,
                'checked_out_at' => now(),
            ]);
            $reservation->room()->update([
                'status' => RoomStatus::Available,
                'housekeeping_status' => \App\Enums\HousekeepingStatus::Dirty,
            ]);
            $this->auditLog->record('reservation.check_out', $reservation);

            return $reservation;
        });
    }

    private function assertTransition(Reservation $reservation, ReservationStatus $from, ReservationStatus $to): void
    {
        if ($reservation->status !== $from) {
            throw new DomainActionException("Rezervasyon '{$from->value}' durumunda değil, '{$to->value}' durumuna geçilemez.");
        }
    }
}
