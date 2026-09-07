<?php

namespace Tests\Feature;

use App\Models\Guest;
use App\Models\Payment;
use App\Models\Permission;
use App\Models\Reservation;
use App\Models\Role;
use App\Models\Room;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class DashboardControllerTest extends TestCase
{
    use RefreshDatabase;

    private function actingAdmin(): User
    {
        $admin = User::factory()->admin()->create();
        $this->actingAs($admin, 'sanctum');

        return $admin;
    }

    public function test_unauthenticated_request_cannot_view_stats(): void
    {
        $this->getJson('/api/dashboard/stats')->assertStatus(401);
    }

    public function test_personel_without_dashboard_view_cannot_view_stats(): void
    {
        $personel = User::factory()->create();
        $this->actingAs($personel, 'sanctum');

        $this->getJson('/api/dashboard/stats')->assertStatus(403);
    }

    public function test_admin_sees_correct_today_checkin_count(): void
    {
        $this->actingAdmin();
        $room = Room::factory()->create();
        $guest = Guest::factory()->create();

        Reservation::factory()->create([
            'room_id' => $room->id,
            'guest_id' => $guest->id,
            'check_in' => Carbon::today()->toDateString(),
            'check_out' => Carbon::tomorrow()->addDay()->toDateString(),
            'status' => \App\Enums\ReservationStatus::Confirmed,
        ]);

        $response = $this->getJson('/api/dashboard/stats');

        $response->assertStatus(200);
        $this->assertSame(1, $response->json('data.today_check_ins'));
    }

    public function test_admin_sees_total_collected_matching_payments(): void
    {
        $this->actingAdmin();
        $reservation = Reservation::factory()->create([
            'room_id' => Room::factory()->create()->id,
            'guest_id' => Guest::factory()->create()->id,
            'total_amount' => 1000,
            'status' => \App\Enums\ReservationStatus::Confirmed,
        ]);
        Payment::factory()->create(['reservation_id' => $reservation->id, 'amount' => 400]);

        $response = $this->getJson('/api/dashboard/stats');

        $response->assertStatus(200);
        $this->assertEquals(400.0, $response->json('data.total_collected'));
    }

    public function test_today_endpoint_returns_checkins_and_checkouts(): void
    {
        $this->actingAdmin();

        $response = $this->getJson('/api/dashboard/today');

        $response->assertStatus(200);
        $response->assertJsonStructure(['data' => ['check_ins', 'check_outs']]);
    }

    public function test_revenue_requires_dashboard_widget_revenue_permission(): void
    {
        $viewPermission = Permission::create(['key' => 'dashboard.view', 'label' => 'DashboardÄ± GÃ¶rÃ¼ntÃ¼leme', 'group' => 'dashboard', 'group_label' => 'Dashboard', 'is_page_permission' => true]);
        $role = Role::create(['name' => 'Test GÃ¶rÃ¼ntÃ¼leyici', 'slug' => 'test-dashboard-goruntuleyici']);
        $role->permissions()->sync([$viewPermission->id]);
        $personel = User::factory()->create(['role_id' => $role->id]);
        $this->actingAs($personel, 'sanctum');

        $this->getJson('/api/dashboard/revenue?from=2026-01-01&to=2026-01-31')->assertStatus(403);
    }
}
