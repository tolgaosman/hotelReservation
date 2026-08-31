<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Guest;
use App\Models\Permission;
use App\Models\Reservation;
use App\Models\Role;
use App\Models\Room;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuditLogTest extends TestCase
{
    use RefreshDatabase;

    private function actingAdmin(): User
    {
        $admin = User::factory()->admin()->create();
        $this->actingAs($admin, 'sanctum');

        return $admin;
    }

    private function makeReservation(): Reservation
    {
        return Reservation::factory()->create([
            'room_id' => Room::factory()->create()->id,
            'guest_id' => Guest::factory()->create()->id,
            'status' => \App\Enums\ReservationStatus::Confirmed,
        ]);
    }

    public function test_cancelling_a_reservation_creates_an_audit_log_row(): void
    {
        $admin = $this->actingAdmin();
        $reservation = $this->makeReservation();

        $this->postJson("/api/reservations/{$reservation->id}/cancel")->assertStatus(200);

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'reservation.cancel',
            'user_id' => $admin->id,
            'auditable_type' => 'Reservation',
            'auditable_id' => $reservation->id,
        ]);
    }

    public function test_personel_without_audit_logs_view_cannot_list_logs(): void
    {
        $personel = User::factory()->create();
        $this->actingAs($personel, 'sanctum');

        $this->getJson('/api/audit-logs')->assertStatus(403);
    }

    public function test_admin_can_list_and_filter_audit_logs(): void
    {
        $admin = $this->actingAdmin();
        AuditLog::create(['user_id' => $admin->id, 'action' => 'reservation.create', 'auditable_type' => 'Reservation', 'auditable_id' => 1]);
        AuditLog::create(['user_id' => $admin->id, 'action' => 'room.create', 'auditable_type' => 'Room', 'auditable_id' => 1]);

        $response = $this->getJson('/api/audit-logs');
        $response->assertStatus(200);
        $this->assertCount(2, $response->json('data.items'));

        $filtered = $this->getJson('/api/audit-logs?action=room.create');
        $filtered->assertStatus(200);
        $this->assertCount(1, $filtered->json('data.items'));
    }

    public function test_personel_with_audit_logs_view_permission_can_list_logs(): void
    {
        $viewPermission = Permission::create(['key' => 'audit_logs.view', 'label' => 'Sayfayı Görüntüleme', 'group' => 'audit_logs', 'group_label' => 'Aktivite Kayıtları', 'is_page_permission' => true]);
        $role = Role::create(['name' => 'Test Denetçi', 'slug' => 'test-denetci']);
        $role->permissions()->sync([$viewPermission->id]);
        $personel = User::factory()->create(['role_id' => $role->id]);
        $this->actingAs($personel, 'sanctum');

        $this->getJson('/api/audit-logs')->assertStatus(200);
    }
}
