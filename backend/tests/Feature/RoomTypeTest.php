<?php

namespace Tests\Feature;

use App\Models\Reservation;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoomTypeTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_a_room_type(): void
    {
        $admin = User::factory()->admin()->create();
        $this->actingAs($admin, 'sanctum');

        $response = $this->postJson('/api/room-types', [
            'name' => 'Panorama Suite',
            'capacity' => 4,
            'nightly_rate' => 4200,
            'amenities' => ['Deniz ManzarasÄ±', 'Jakuzi'],
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('room_types', ['name' => 'Panorama Suite']);
    }

    public function test_personel_without_permission_cannot_create_a_room_type(): void
    {
        $personel = User::factory()->create();
        $this->actingAs($personel, 'sanctum');

        $response = $this->postJson('/api/room-types', [
            'name' => 'Panorama Suite',
            'capacity' => 4,
            'nightly_rate' => 4200,
        ]);

        $response->assertStatus(403);
    }

    public function test_duplicate_room_type_name_is_rejected(): void
    {
        $admin = User::factory()->admin()->create();
        $this->actingAs($admin, 'sanctum');
        RoomType::factory()->create(['name' => 'Deluxe']);

        $response = $this->postJson('/api/room-types', [
            'name' => 'Deluxe',
            'capacity' => 3,
            'nightly_rate' => 2200,
        ]);

        $response->assertStatus(422);
    }

    public function test_updating_a_room_type_propagates_to_its_rooms(): void
    {
        $admin = User::factory()->admin()->create();
        $this->actingAs($admin, 'sanctum');
        $type = RoomType::factory()->create(['nightly_rate' => 2200, 'capacity' => 3]);
        $room = Room::factory()->forType($type)->create();

        $response = $this->putJson("/api/room-types/{$type->id}", [
            'nightly_rate' => 2500,
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('rooms', [
            'id' => $room->id,
            'nightly_rate' => 2500,
        ]);
    }

    public function test_existing_reservation_total_is_unaffected_by_a_later_rate_change(): void
    {
        $admin = User::factory()->admin()->create();
        $this->actingAs($admin, 'sanctum');
        $type = RoomType::factory()->create(['nightly_rate' => 2200]);
        $room = Room::factory()->forType($type)->create();
        $reservation = Reservation::factory()->create([
            'room_id' => $room->id,
            'total_amount' => 2200 * 3,
        ]);

        $this->putJson("/api/room-types/{$type->id}", ['nightly_rate' => 5000])->assertStatus(200);

        $this->assertEquals(2200 * 3, $reservation->fresh()->total_amount);
    }

    public function test_deleting_a_room_type_with_rooms_is_rejected(): void
    {
        $admin = User::factory()->admin()->create();
        $this->actingAs($admin, 'sanctum');
        $type = RoomType::factory()->create();
        Room::factory()->forType($type)->create();

        $response = $this->deleteJson("/api/room-types/{$type->id}");

        $response->assertStatus(422);
        $this->assertDatabaseHas('room_types', ['id' => $type->id]);
    }

    public function test_deleting_an_unattached_room_type_succeeds(): void
    {
        $admin = User::factory()->admin()->create();
        $this->actingAs($admin, 'sanctum');
        $type = RoomType::factory()->create();

        $response = $this->deleteJson("/api/room-types/{$type->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('room_types', ['id' => $type->id]);
    }

    public function test_creating_a_room_with_an_inactive_type_is_rejected(): void
    {
        $admin = User::factory()->admin()->create();
        $this->actingAs($admin, 'sanctum');
        $type = RoomType::factory()->create(['active' => false]);

        $response = $this->postJson('/api/rooms', [
            'number' => '501',
            'room_type_id' => $type->id,
        ]);

        $response->assertStatus(422);
    }
}
