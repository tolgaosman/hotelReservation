<?php

namespace Tests\Feature;

use App\Models\Guest;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_request_is_rejected(): void
    {
        $response = $this->getJson('/api/rooms');

        $response->assertStatus(401);
        $response->assertJsonPath('success', false);
    }

    public function test_personel_cannot_create_rooms(): void
    {
        $personel = User::factory()->create();
        $this->actingAs($personel, 'sanctum');

        $response = $this->postJson('/api/rooms', [
            'number' => '999',
            'room_type_id' => RoomType::factory()->create()->id,
        ]);

        $response->assertStatus(403);
    }

    public function test_personel_cannot_deactivate_rooms(): void
    {
        $personel = User::factory()->create();
        $this->actingAs($personel, 'sanctum');
        $room = Room::factory()->create();

        $this->patchJson("/api/rooms/{$room->id}/deactivate")->assertStatus(403);
    }

    public function test_personel_cannot_list_payments(): void
    {
        $personel = User::factory()->create();
        $this->actingAs($personel, 'sanctum');

        $this->getJson('/api/payments')->assertStatus(403);
    }

    public function test_personel_can_create_reservations(): void
    {
        $viewPermission = Permission::create(['key' => 'reservations.view', 'label' => 'SayfayÄ± GÃ¶rÃ¼ntÃ¼leme', 'group' => 'reservations', 'group_label' => 'Rezervasyonlar', 'is_page_permission' => true]);
        $createPermission = Permission::create(['key' => 'reservations.create', 'label' => 'Yeni Rezervasyon OluÅŸturma', 'group' => 'reservations', 'group_label' => 'Rezervasyonlar']);
        $role = Role::create(['name' => 'Test Resepsiyonist', 'slug' => 'test-resepsiyonist-reservations']);
        $role->permissions()->sync([$viewPermission->id, $createPermission->id]);
        $personel = User::factory()->create(['role_id' => $role->id]);
        $this->actingAs($personel, 'sanctum');
        $room = Room::factory()->create(['capacity' => 2]);
        $guest = Guest::factory()->create();

        $response = $this->postJson('/api/reservations', [
            'guest_id' => $guest->id,
            'room_id' => $room->id,
            'check_in' => '2026-10-01',
            'check_out' => '2026-10-05',
            'guest_count' => 1,
        ]);

        $response->assertStatus(201);
    }

    public function test_admin_can_create_rooms(): void
    {
        $admin = User::factory()->admin()->create();
        $this->actingAs($admin, 'sanctum');

        $response = $this->postJson('/api/rooms', [
            'number' => '999',
            'room_type_id' => RoomType::factory()->create()->id,
        ]);

        $response->assertStatus(201);
    }
}
