<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\Room;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HousekeepingAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    private function personelWith(array $keys): User
    {
        $permissions = collect($keys)->map(fn ($key) => Permission::create([
            'key' => $key,
            'label' => $key,
            'group' => 'housekeeping',
            'group_label' => 'Temizlik',
        ]));
        $role = Role::create(['name' => 'Test '.uniqid(), 'slug' => 'test-'.uniqid()]);
        $role->permissions()->sync($permissions->pluck('id'));

        return User::factory()->create(['role_id' => $role->id]);
    }

    public function test_status_only_role_cannot_reassign_staff(): void
    {
        $personel = $this->personelWith(['housekeeping.update_status']);
        $this->actingAs($personel, 'sanctum');
        $room = Room::factory()->create();

        $this->patchJson("/api/rooms/{$room->id}/housekeeping", ['assigned_staff' => 'Ayşe'])
            ->assertStatus(403);
    }

    public function test_status_only_role_can_update_status(): void
    {
        $personel = $this->personelWith(['housekeeping.update_status']);
        $this->actingAs($personel, 'sanctum');
        $room = Room::factory()->create();

        $this->patchJson("/api/rooms/{$room->id}/housekeeping", ['housekeeping_status' => 'dirty'])
            ->assertStatus(200);
    }

    public function test_assign_staff_role_can_reassign_staff_but_not_status(): void
    {
        $personel = $this->personelWith(['housekeeping.assign_staff']);
        $this->actingAs($personel, 'sanctum');
        $room = Room::factory()->create();

        $this->patchJson("/api/rooms/{$room->id}/housekeeping", ['assigned_staff' => 'Ayşe'])
            ->assertStatus(200);

        $this->patchJson("/api/rooms/{$room->id}/housekeeping", ['housekeeping_status' => 'dirty'])
            ->assertStatus(403);
    }

    public function test_maintenance_role_can_flag_maintenance_but_not_status(): void
    {
        $personel = $this->personelWith(['housekeeping.maintenance']);
        $this->actingAs($personel, 'sanctum');
        $room = Room::factory()->create();

        $this->patchJson("/api/rooms/{$room->id}/housekeeping", ['is_maintenance' => true, 'maintenance_note' => 'Klima arızalı'])
            ->assertStatus(200);

        $this->patchJson("/api/rooms/{$room->id}/housekeeping", ['housekeeping_status' => 'dirty'])
            ->assertStatus(403);
    }

    public function test_status_only_role_cannot_mark_priority(): void
    {
        $personel = $this->personelWith(['housekeeping.update_status']);
        $this->actingAs($personel, 'sanctum');
        $room = Room::factory()->create();

        $this->patchJson("/api/rooms/{$room->id}/housekeeping", ['is_priority_cleaning' => true])
            ->assertStatus(403);
    }

    public function test_mark_priority_role_can_mark_priority_but_not_status(): void
    {
        $personel = $this->personelWith(['housekeeping.mark_priority']);
        $this->actingAs($personel, 'sanctum');
        $room = Room::factory()->create();

        $this->patchJson("/api/rooms/{$room->id}/housekeeping", ['is_priority_cleaning' => true])
            ->assertStatus(200);

        $this->patchJson("/api/rooms/{$room->id}/housekeeping", ['housekeeping_status' => 'dirty'])
            ->assertStatus(403);
    }
}
