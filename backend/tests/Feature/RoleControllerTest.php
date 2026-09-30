<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleControllerTest extends TestCase
{
    use RefreshDatabase;

    private function actingAdmin(): User
    {
        $admin = User::factory()->admin()->create();
        $this->actingAs($admin, 'sanctum');

        return $admin;
    }

    public function test_admin_can_create_role_with_permissions(): void
    {
        $this->actingAdmin();
        $permission = Permission::factory()->create();

        $response = $this->postJson('/api/roles', [
            'name' => 'Yeni Rol',
            'permission_ids' => [$permission->id],
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('roles', ['name' => 'Yeni Rol', 'slug' => 'yeni-rol']);
        $this->assertDatabaseHas('permission_role', ['permission_id' => $permission->id]);
    }

    public function test_creating_role_without_name_fails_validation(): void
    {
        $this->actingAdmin();

        $this->postJson('/api/roles', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    public function test_creating_role_with_slug_colliding_name_fails_validation(): void
    {
        $this->actingAdmin();
        Role::factory()->create(['name' => 'Garson', 'slug' => 'garson']);

        $this->postJson('/api/roles', ['name' => 'Garson!'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    public function test_admin_can_update_role_permissions(): void
    {
        $this->actingAdmin();
        $role = Role::factory()->create();
        $permission = Permission::factory()->create();

        $response = $this->putJson("/api/roles/{$role->id}", [
            'name' => $role->name,
            'permission_ids' => [$permission->id],
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('permission_role', ['role_id' => $role->id, 'permission_id' => $permission->id]);
    }

    public function test_admin_can_create_role_with_department(): void
    {
        $this->actingAdmin();

        $response = $this->postJson('/api/roles', [
            'name' => 'Yeni Departmanlı Rol',
            'department' => 'muhasebe',
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('data.department', 'muhasebe');
        $this->assertDatabaseHas('roles', ['name' => 'Yeni Departmanlı Rol', 'department' => 'muhasebe']);
    }

    public function test_admin_can_update_role_department(): void
    {
        $this->actingAdmin();
        $role = Role::factory()->create(['department' => 'servis']);

        $response = $this->putJson("/api/roles/{$role->id}", [
            'name' => $role->name,
            'department' => 'resepsiyon',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.department', 'resepsiyon');
        $this->assertDatabaseHas('roles', ['id' => $role->id, 'department' => 'resepsiyon']);
    }

    public function test_creating_role_with_invalid_department_fails_validation(): void
    {
        $this->actingAdmin();

        $this->postJson('/api/roles', ['name' => 'Geçersiz Departman', 'department' => 'not-a-real-department'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['department']);
    }

    public function test_personel_without_roles_create_cannot_create_role(): void
    {
        $viewPermission = Permission::create(['key' => 'roles.view', 'label' => 'Sayfayı Görüntüleme', 'group' => 'roles', 'group_label' => 'Roller', 'is_page_permission' => true]);
        $role = Role::create(['name' => 'Test Görüntüleyici Roller', 'slug' => 'test-goruntuleyici-roller']);
        $role->permissions()->sync([$viewPermission->id]);
        $personel = User::factory()->create(['role_id' => $role->id]);
        $this->actingAs($personel, 'sanctum');

        $this->postJson('/api/roles', ['name' => 'Yasak Rol'])->assertStatus(403);
    }
}
