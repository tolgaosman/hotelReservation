<?php

namespace Tests\Feature;

use App\Enums\ReservationStatus;
use App\Enums\RoomStatus;
use App\Models\Guest;
use App\Models\Reservation;
use App\Models\Room;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReservationLifecycleTest extends TestCase
{
    use RefreshDatabase;

    private function actingAdmin(): User
    {
        $admin = User::factory()->admin()->create();
        $this->actingAs($admin, 'sanctum');

        return $admin;
    }

    public function test_cannot_check_in_a_pending_reservation(): void
    {
        $this->actingAdmin();
        $reservation = Reservation::factory()->create(['status' => ReservationStatus::Pending]);

        $response = $this->postJson("/api/reservations/{$reservation->id}/check-in");

        $response->assertStatus(422);
        $response->assertJsonPath('success', false);
    }

    public function test_check_in_flips_room_to_occupied_and_check_out_flips_it_back(): void
    {
        $this->actingAdmin();
        $room = Room::factory()->create(['status' => RoomStatus::Available]);
        $guest = Guest::factory()->create();
        $reservation = Reservation::factory()->create([
            'room_id' => $room->id,
            'guest_id' => $guest->id,
            'status' => ReservationStatus::Confirmed,
        ]);

        $this->postJson("/api/reservations/{$reservation->id}/check-in")->assertStatus(200);

        $this->assertSame(RoomStatus::Occupied, $room->fresh()->status);
        $this->assertSame(ReservationStatus::CheckedIn, $reservation->fresh()->status);

        $this->postJson("/api/reservations/{$reservation->id}/check-out")->assertStatus(200);

        $this->assertSame(RoomStatus::Available, $room->fresh()->status);
        $this->assertSame(ReservationStatus::Completed, $reservation->fresh()->status);
        $this->assertNotNull($reservation->fresh()->checked_out_at);
    }

    public function test_cannot_cancel_a_completed_reservation(): void
    {
        $this->actingAdmin();
        $reservation = Reservation::factory()->create(['status' => ReservationStatus::Completed]);

        $response = $this->postJson("/api/reservations/{$reservation->id}/cancel");

        $response->assertStatus(422);
    }
}
