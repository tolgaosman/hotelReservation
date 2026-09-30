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

class RoomServiceTest extends TestCase
{
    use RefreshDatabase;

    private function actingPersonel(): User
    {
        $viewPermission = Permission::create(['key' => 'room_service.view', 'label' => 'Sayfayı Görüntüleme', 'group' => 'room_service', 'group_label' => 'Oda Servisi', 'is_page_permission' => true]);
        $createPermission = Permission::create(['key' => 'room_service.create', 'label' => 'Sipariş Ekleme', 'group' => 'room_service', 'group_label' => 'Oda Servisi']);
        $deletePermission = Permission::create(['key' => 'room_service.delete', 'label' => 'Sipariş Silme', 'group' => 'room_service', 'group_label' => 'Oda Servisi']);
        $role = Role::create(['name' => 'Test Garson', 'slug' => 'test-garson']);
        $role->permissions()->sync([$viewPermission->id, $createPermission->id, $deletePermission->id]);
        $personel = User::factory()->create(['role_id' => $role->id]);
        $this->actingAs($personel, 'sanctum');

        return $personel;
    }

    private function makeReservation(float $total = 1000): Reservation
    {
        return Reservation::factory()->create([
            'room_id' => Room::factory()->create()->id,
            'guest_id' => Guest::factory()->create()->id,
            'total_amount' => $total,
            // Pin a non-cancelled status — the factory's default is random
            // across all statuses, which would make this flaky now that
            // room-service charges against a cancelled reservation are rejected.
            'status' => \App\Enums\ReservationStatus::Confirmed,
        ]);
    }

    public function test_unauthenticated_request_cannot_add_room_service(): void
    {
        $reservation = $this->makeReservation();

        $this->postJson("/api/reservations/{$reservation->id}/room-services", [
            'description' => 'Minibar',
            'amount' => 50,
        ])->assertStatus(401);
    }

    public function test_adding_room_service_increases_reservation_total(): void
    {
        $this->actingPersonel();
        $reservation = $this->makeReservation(1000);

        $response = $this->postJson("/api/reservations/{$reservation->id}/room-services", [
            'description' => 'Minibar',
            'amount' => 50,
        ]);

        $response->assertStatus(201);
        $this->assertEquals(1050.0, (float) $reservation->fresh()->total_amount);
    }

    public function test_deleting_room_service_cannot_drop_total_below_paid_amount(): void
    {
        $this->actingPersonel();
        $reservation = $this->makeReservation(1000);
        $roomService = $reservation->roomServices()->create([
            'description' => 'Minibar',
            'amount' => 50,
        ]);
        $reservation->update(['total_amount' => 1050]);
        $reservation->payments()->create(['amount' => 1040, 'method' => 'cash']);

        $response = $this->deleteJson("/api/room-services/{$roomService->id}");

        $response->assertStatus(422);
        $this->assertEquals(1050.0, (float) $reservation->fresh()->total_amount);
    }
}
