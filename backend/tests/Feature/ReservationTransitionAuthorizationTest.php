<?php

namespace Tests\Feature;

use App\Enums\ReservationStatus;
use App\Models\Guest;
use App\Models\Permission;
use App\Models\Reservation;
use App\Models\Role;
use App\Models\Room;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Before this, ReservationPolicy::transition() (confirm/cancel/check-in/
 * check-out) returned true unconditionally for any authenticated personel â€”
 * these lock down each action to its own granular permission.
 */
class ReservationTransitionAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    private function makeReservation(ReservationStatus $status): Reservation
    {
        return Reservation::factory()->create([
            'room_id' => Room::factory()->create()->id,
            'guest_id' => Guest::factory()->create()->id,
            'status' => $status,
        ]);
    }

    private function personelWithPermissions(array $keys): User
    {
        $role = Role::create(['name' => 'Test Role '.uniqid(), 'slug' => 'test-role-'.uniqid()]);
        $ids = [];
        foreach ($keys as $key) {
            $ids[] = Permission::create(['key' => $key, 'label' => $key, 'group' => explode('.', $key)[0], 'group_label' => $key])->id;
        }
        $role->permissions()->sync($ids);

        return User::factory()->create(['role_id' => $role->id]);
    }

    public function test_personel_without_confirm_permission_cannot_confirm(): void
    {
        $user = $this->personelWithPermissions(['reservations.view']);
        $this->actingAs($user, 'sanctum');
        $reservation = $this->makeReservation(ReservationStatus::Pending);

        $this->postJson("/api/reservations/{$reservation->id}/confirm")->assertStatus(403);
    }

    public function test_personel_with_confirm_permission_can_confirm(): void
    {
        $user = $this->personelWithPermissions(['reservations.view', 'reservations.confirm']);
        $this->actingAs($user, 'sanctum');
        $reservation = $this->makeReservation(ReservationStatus::Pending);

        $this->postJson("/api/reservations/{$reservation->id}/confirm")->assertStatus(200);
    }

    public function test_personel_without_checkin_permission_cannot_check_in(): void
    {
        $user = $this->personelWithPermissions(['reservations.view']);
        $this->actingAs($user, 'sanctum');
        $reservation = $this->makeReservation(ReservationStatus::Confirmed);

        $this->postJson("/api/reservations/{$reservation->id}/check-in")->assertStatus(403);
    }

    public function test_personel_without_guests_permission_cannot_create_guest(): void
    {
        $user = $this->personelWithPermissions(['guests.view']);
        $this->actingAs($user, 'sanctum');

        $this->postJson('/api/guests', [
            'full_name' => 'Test Guest',
            'phone' => '5551234567',
            'identity_number' => 'ID-'.uniqid(),
        ])->assertStatus(403);
    }

    public function test_personel_without_housekeeping_permission_cannot_update_housekeeping(): void
    {
        $user = $this->personelWithPermissions(['housekeeping.view']);
        $this->actingAs($user, 'sanctum');
        $room = Room::factory()->create();

        $this->patchJson("/api/rooms/{$room->id}/housekeeping", ['housekeeping_status' => 'dirty'])
            ->assertStatus(403);
    }

    public function test_personel_with_housekeeping_permission_can_update_housekeeping(): void
    {
        $user = $this->personelWithPermissions(['housekeeping.view', 'housekeeping.update_status']);
        $this->actingAs($user, 'sanctum');
        $room = Room::factory()->create();

        $this->patchJson("/api/rooms/{$room->id}/housekeeping", ['housekeeping_status' => 'dirty'])
            ->assertStatus(200);
    }

    public function test_personel_without_dashboard_permission_cannot_view_stats(): void
    {
        $user = $this->personelWithPermissions(['reservations.view']);
        $this->actingAs($user, 'sanctum');

        $this->getJson('/api/dashboard/stats')->assertStatus(403);
    }
}
