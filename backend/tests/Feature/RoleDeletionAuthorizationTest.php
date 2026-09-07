<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleDeletionAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_personel_without_roles_delete_cannot_delete_a_role(): void
    {
        $viewPermission = Permission::create(['key' => 'roles.view', 'label' => 'SayfayÄ± GÃ¶rÃ¼ntÃ¼leme', 'group' => 'roles', 'group_label' => 'Roller', 'is_page_permission' => true]);
        $role = Role::create(['name' => 'Test GÃ¶rÃ¼ntÃ¼leyici', 'slug' => 'test-goruntuleyici']);
        $role->permissions()->sync([$viewPermission->id]);
        $personel = User::factory()->create(['role_id' => $role->id]);
        $this->actingAs($personel, 'sanctum');

        $target = Role::create(['name' => 'Silinecek Rol', 'slug' => 'silinecek-rol']);

        $this->deleteJson("/api/roles/{$target->id}")->assertStatus(403);
    }

    public function test_personel_with_roles_delete_can_delete_a_non_system_role(): void
    {
        $viewPermission = Permission::create(['key' => 'roles.view', 'label' => 'SayfayÄ± GÃ¶rÃ¼ntÃ¼leme', 'group' => 'roles', 'group_label' => 'Roller', 'is_page_permission' => true]);
        $deletePermission = Permission::create(['key' => 'roles.delete', 'label' => 'Rol Silme', 'group' => 'roles', 'group_label' => 'Roller']);
        $role = Role::create(['name' => 'Test Silici', 'slug' => 'test-silici']);
        $role->permissions()->sync([$viewPermission->id, $deletePermission->id]);
        $personel = User::factory()->create(['role_id' => $role->id]);
        $this->actingAs($personel, 'sanctum');

        $target = Role::create(['name' => 'Silinecek Rol', 'slug' => 'silinecek-rol']);

        $this->deleteJson("/api/roles/{$target->id}")->assertStatus(200);
        $this->assertNull(Role::find($target->id));
    }
}
