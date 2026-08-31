<?php

namespace Tests\Unit;

use App\Models\Guest;
use App\Models\Reservation;
use App\Models\Room;
use App\Services\AuditLogService;
use App\Services\ReservationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class ReservationServiceTest extends TestCase
{
    use RefreshDatabase;

    private function service(): ReservationService
    {
        return new ReservationService(new AuditLogService());
    }

    public function test_calculate_total_multiplies_nightly_rate_by_nights(): void
    {
        $room = Room::factory()->make(['nightly_rate' => 1500]);

        $total = $this->service()->calculateTotal($room, Carbon::parse('2026-10-01'), Carbon::parse('2026-10-04'));

        $this->assertEquals(4500.0, $total);
    }

    public function test_has_conflict_detects_overlapping_active_reservation(): void
    {
        $room = Room::factory()->create();
        $guest = Guest::factory()->create();
        Reservation::factory()->create([
            'room_id' => $room->id,
            'guest_id' => $guest->id,
            'check_in' => '2026-10-05',
            'check_out' => '2026-10-10',
            'status' => \App\Enums\ReservationStatus::Confirmed,
        ]);

        $conflict = $this->service()->hasConflict($room->id, Carbon::parse('2026-10-08'), Carbon::parse('2026-10-12'));

        $this->assertTrue($conflict);
    }

    public function test_has_conflict_allows_same_day_turnover(): void
    {
        $room = Room::factory()->create();
        $guest = Guest::factory()->create();
        Reservation::factory()->create([
            'room_id' => $room->id,
            'guest_id' => $guest->id,
            'check_in' => '2026-10-05',
            'check_out' => '2026-10-10',
            'status' => \App\Enums\ReservationStatus::Confirmed,
        ]);

        $conflict = $this->service()->hasConflict($room->id, Carbon::parse('2026-10-10'), Carbon::parse('2026-10-14'));

        $this->assertFalse($conflict);
    }
}
