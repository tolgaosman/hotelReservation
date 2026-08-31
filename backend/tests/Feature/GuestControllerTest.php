<?php

namespace Tests\Feature;

use App\Models\Guest;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GuestControllerTest extends TestCase
{
    use RefreshDatabase;

    private function actingAdmin(): User
    {
        $admin = User::factory()->admin()->create();
        $this->actingAs($admin, 'sanctum');

        return $admin;
    }

    private function actingPersonel(array $permissionKeys): User
    {
        $role = Role::factory()->create();
        $role->permissions()->sync(
            collect($permissionKeys)->map(fn ($key) => Permission::factory()->create(['key' => $key])->id)
        );
        $personel = User::factory()->create(['role_id' => $role->id]);
        $this->actingAs($personel, 'sanctum');

        return $personel;
    }

    public function test_admin_can_list_guests(): void
    {
        $this->actingAdmin();
        Guest::factory()->count(3)->create();

        $response = $this->getJson('/api/guests');

        $response->assertStatus(200);
        $this->assertCount(3, $response->json('data.items'));
    }

    public function test_admin_can_create_guest(): void
    {
        $this->actingAdmin();

        $response = $this->postJson('/api/guests', [
            'full_name' => 'Ayşe Yılmaz',
            'phone' => '+90 555 111 22 33',
            'identity_number' => '12345678901',
            'country' => 'Türkiye',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('guests', ['identity_number' => '12345678901']);
    }

    public function test_creating_guest_without_required_fields_fails_validation(): void
    {
        $this->actingAdmin();

        $response = $this->postJson('/api/guests', []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['full_name', 'phone', 'identity_number']);
    }

    public function test_admin_can_update_guest(): void
    {
        $this->actingAdmin();
        $guest = Guest::factory()->create();

        $response = $this->putJson("/api/guests/{$guest->id}", [
            'full_name' => 'Güncellenmiş İsim',
        ]);

        $response->assertStatus(200);
        $this->assertEquals('Güncellenmiş İsim', $guest->fresh()->full_name);
    }

    public function test_personel_without_guests_view_cannot_list_guests(): void
    {
        $this->actingPersonel(['reservations.view']);

        $this->getJson('/api/guests')->assertStatus(403);
    }

    public function test_personel_without_guests_create_cannot_create_guest(): void
    {
        $this->actingPersonel(['guests.view']);

        $this->postJson('/api/guests', [
            'full_name' => 'Test Misafir',
            'phone' => '+90 555 000 00 00',
            'identity_number' => '99999999999',
        ])->assertStatus(403);
    }

    public function test_personel_with_guests_create_can_create_guest(): void
    {
        $this->actingPersonel(['guests.view', 'guests.create']);

        $this->postJson('/api/guests', [
            'full_name' => 'Test Misafir',
            'phone' => '+90 555 000 00 00',
            'identity_number' => '99999999998',
        ])->assertStatus(201);
    }
}
