<?php

namespace App\Services;

use App\Enums\ReservationStatus;
use App\Models\Payment;
use App\Models\Reservation;
use App\Models\Room;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    public function stats(): array
    {
        $roomCounts = Room::query()
            ->active()
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->mapWithKeys(fn ($total, $status) => [
                ($status instanceof \App\Enums\RoomStatus ? $status->value : $status) => $total,
            ]);

        $reservedRooms = Room::query()
            ->where('status', 'available')
            ->whereHas('reservations', function ($q) {
                $q->whereIn('status', ['pending', 'confirmed'])
                    ->where('check_in', '>=', Carbon::today());
            })
            ->count();

        return [
            'today_check_ins' => $this->todayCheckIns(),
            'today_check_outs' => $this->todayCheckOuts(),
            'rooms' => [
                'available' => (int) ($roomCounts['available'] ?? 0),
                'occupied' => (int) ($roomCounts['occupied'] ?? 0),
                'maintenance' => (int) ($roomCounts['maintenance'] ?? 0),
                'reserved' => $reservedRooms,
            ],
            'active_reservations' => Reservation::query()->activeStatuses()->count(),
            'total_collected' => (float) Payment::query()->sum('amount'),
        ];
    }

    public function todayCheckIns(): int
    {
        return Reservation::query()
            ->whereDate('check_in', Carbon::today())
            ->whereIn('status', ['pending', 'confirmed', 'checked_in'])
            ->count();
    }

    public function todayCheckOuts(): int
    {
        return Reservation::query()
            ->whereDate('check_out', Carbon::today())
            ->whereIn('status', ['confirmed', 'checked_in', 'completed'])
            ->count();
    }

    public function today(): array
    {
        $checkIns = Reservation::query()
            ->with(['guest', 'room'])
            ->whereDate('check_in', Carbon::today())
            ->whereIn('status', ['pending', 'confirmed', 'checked_in'])
            ->get();

        $checkOuts = Reservation::query()
            ->with(['guest', 'room'])
            ->whereDate('check_out', Carbon::today())
            ->whereIn('status', ['confirmed', 'checked_in', 'completed'])
            ->get();

        return [
            'check_ins' => $checkIns,
            'check_outs' => $checkOuts,
        ];
    }

    public function revenue(Carbon $from, Carbon $to, string $bucket = 'day'): array
    {
        $format = match ($bucket) {
            'week' => '%x-%v',
            'month' => '%Y-%m',
            default => '%Y-%m-%d',
        };

        return Payment::query()
            ->whereBetween('created_at', [$from->startOfDay(), $to->endOfDay()])
            ->selectRaw("DATE_FORMAT(created_at, ?) as bucket, SUM(amount) as total", [$format])
            ->groupBy('bucket')
            ->orderBy('bucket')
            ->get()
            ->map(fn ($row) => ['bucket' => $row->bucket, 'total' => (float) $row->total])
            ->all();
    }
}
