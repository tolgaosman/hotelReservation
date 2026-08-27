<?php

namespace Tests\Feature;

use App\Enums\ReservationStatus;
use App\Enums\UserRole;
use App\Models\Guest;
use App\Models\Reservation;
use App\Models\Room;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReservationConflictTest extends TestCase
{
    use RefreshDatabase;

    private function actingAdmin(): User
    {
        $admin = User::factory()->admin()->create();
        $this->actingAs($admin, 'sanctum');

        return $admin;
    }

    public function test_overlapping_dates_on_same_room_are_rejected(): void
    {
        $this->actingAdmin();
        $room = Room::factory()->create(['capacity' => 2]);
        $guest = Guest::factory()->create();

        Reservation::factory()->create([
            'room_id' => $room->id,
            'guest_id' => $guest->id,
            'status' => ReservationStatus::Confirmed,
            'check_in' => '2026-09-10',
            'check_out' => '2026-09-15',
        ]);

        $response = $this->postJson('/api/reservations', [
            'guest_id' => $guest->id,
            'room_id' => $room->id,
            'check_in' => '2026-09-12',
            'check_out' => '2026-09-18',
            'guest_count' => 1,
        ]);

        $response->assertStatus(422);
        $response->assertJsonPath('success', false);
        $response->assertJsonValidationErrors('room_id');
    }

    public function test_same_day_turnover_is_allowed(): void
    {
        $this->actingAdmin();
        $room = Room::factory()->create(['capacity' => 2]);
        $guest = Guest::factory()->create();

        Reservation::factory()->create([
            'room_id' => $room->id,
            'guest_id' => $guest->id,
            'status' => ReservationStatus::Confirmed,
            'check_in' => '2026-09-10',
            'check_out' => '2026-09-15',
        ]);

        $response = $this->postJson('/api/reservations', [
            'guest_id' => $guest->id,
            'room_id' => $room->id,
            'check_in' => '2026-09-15',
            'check_out' => '2026-09-18',
            'guest_count' => 1,
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('success', true);
    }

    public function test_conflict_against_cancelled_reservation_is_allowed(): void
    {
        $this->actingAdmin();
        $room = Room::factory()->create(['capacity' => 2]);
        $guest = Guest::factory()->create();

        Reservation::factory()->create([
            'room_id' => $room->id,
            'guest_id' => $guest->id,
            'status' => ReservationStatus::Cancelled,
            'check_in' => '2026-09-10',
            'check_out' => '2026-09-15',
        ]);

        $response = $this->postJson('/api/reservations', [
            'guest_id' => $guest->id,
            'room_id' => $room->id,
            'check_in' => '2026-09-12',
            'check_out' => '2026-09-18',
            'guest_count' => 1,
        ]);

        $response->assertStatus(201);
    }

    public function test_update_excludes_itself_from_conflict_check(): void
    {
        $this->actingAdmin();
        $room = Room::factory()->create(['capacity' => 2]);
        $guest = Guest::factory()->create();

        $reservation = Reservation::factory()->create([
            'room_id' => $room->id,
            'guest_id' => $guest->id,
            'status' => ReservationStatus::Pending,
            'check_in' => '2026-09-10',
            'check_out' => '2026-09-15',
        ]);

        $response = $this->putJson("/api/reservations/{$reservation->id}", [
            'check_in' => '2026-09-11',
            'check_out' => '2026-09-16',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.check_out', '2026-09-16');
    }
}
