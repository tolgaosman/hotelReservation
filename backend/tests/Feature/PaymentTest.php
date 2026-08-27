<?php

namespace Tests\Feature;

use App\Models\Guest;
use App\Models\Reservation;
use App\Models\Room;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PaymentTest extends TestCase
{
    use RefreshDatabase;

    private function actingAdmin(): User
    {
        $admin = User::factory()->admin()->create();
        $this->actingAs($admin, 'sanctum');

        return $admin;
    }

    private function makeReservation(float $total = 1000): Reservation
    {
        return Reservation::factory()->create([
            'room_id' => Room::factory()->create()->id,
            'guest_id' => Guest::factory()->create()->id,
            'total_amount' => $total,
        ]);
    }

    public function test_payment_exceeding_balance_is_rejected(): void
    {
        $this->actingAdmin();
        $reservation = $this->makeReservation(1000);

        $response = $this->postJson('/api/payments', [
            'reservation_id' => $reservation->id,
            'amount' => 1500,
            'method' => 'cash',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('amount');
    }

    public function test_payments_summing_exactly_to_total_are_allowed(): void
    {
        $this->actingAdmin();
        $reservation = $this->makeReservation(1000);

        $this->postJson('/api/payments', [
            'reservation_id' => $reservation->id,
            'amount' => 600,
            'method' => 'cash',
        ])->assertStatus(201);

        $this->postJson('/api/payments', [
            'reservation_id' => $reservation->id,
            'amount' => 400,
            'method' => 'card',
        ])->assertStatus(201);

        $this->assertEquals(1000.0, $reservation->fresh()->paid_amount);
        $this->assertEquals(0.0, $reservation->fresh()->balance);
    }
}
