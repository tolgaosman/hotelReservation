<?php

namespace Tests\Feature;

use App\Enums\RoomStatus;
use App\Models\Room;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoomDeactivationTest extends TestCase
{
    use RefreshDatabase;

    public function test_deactivating_an_occupied_room_is_rejected(): void
    {
        $admin = User::factory()->admin()->create();
        $this->actingAs($admin, 'sanctum');
        $room = Room::factory()->create(['status' => RoomStatus::Occupied]);

        $response = $this->patchJson("/api/rooms/{$room->id}/deactivate");

        $response->assertStatus(422);
        $this->assertEquals(RoomStatus::Occupied, $room->fresh()->status);
    }

    public function test_deactivating_an_available_room_succeeds(): void
    {
        $admin = User::factory()->admin()->create();
        $this->actingAs($admin, 'sanctum');
        $room = Room::factory()->create(['status' => RoomStatus::Available]);

        $response = $this->patchJson("/api/rooms/{$room->id}/deactivate");

        $response->assertStatus(200);
        $this->assertEquals(RoomStatus::Passive, $room->fresh()->status);
    }
}
