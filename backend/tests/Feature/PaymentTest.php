<?php

namespace Tests\Feature;

use App\Models\Guest;
use App\Models\Permission;
use App\Models\Reservation;
use App\Models\Role;
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
            // The factory's default status is random across all
            // ReservationStatus cases (including Cancelled), which made this
            // helper flaky once payments against a cancelled reservation
            // were rejected â€” pin a payable status explicitly.
            'status' => \App\Enums\ReservationStatus::Confirmed,
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

    public function test_backdated_payment_created_at_is_applied(): void
    {
        $this->actingAdmin();
        $reservation = $this->makeReservation(1000);

        $response = $this->postJson('/api/payments', [
            'reservation_id' => $reservation->id,
            'amount' => 500,
            'method' => 'cash',
            'created_at' => '2026-01-15',
        ]);

        $response->assertStatus(201);
        $this->assertEquals('2026-01-15', $reservation->payments()->first()->created_at->toDateString());
    }

    public function test_personel_with_payments_permission_can_view_and_create_payments(): void
    {
        $viewPermission = Permission::create(['key' => 'payments.view', 'label' => 'SayfayÄ± GÃ¶rÃ¼ntÃ¼leme', 'group' => 'payments', 'group_label' => 'Ã–demeler', 'is_page_permission' => true]);
        $createPermission = Permission::create(['key' => 'payments.create', 'label' => 'Ã–deme Alma', 'group' => 'payments', 'group_label' => 'Ã–demeler']);
        $role = Role::create(['name' => 'Test Resepsiyonist', 'slug' => 'test-resepsiyonist']);
        $role->permissions()->sync([$viewPermission->id, $createPermission->id]);
        $personel = User::factory()->create(['role_id' => $role->id]);
        $this->actingAs($personel, 'sanctum');
        $reservation = $this->makeReservation(1000);

        $this->getJson('/api/payments')->assertStatus(200);
        $this->postJson('/api/payments', [
            'reservation_id' => $reservation->id,
            'amount' => 100,
            'method' => 'cash',
        ])->assertStatus(201);
    }
}
