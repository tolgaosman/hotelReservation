<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmployeeControllerTest extends TestCase
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

    public function test_admin_can_list_employees(): void
    {
        $this->actingAdmin();
        Employee::factory()->count(2)->create();

        $this->getJson('/api/employees')->assertStatus(200);
    }

    public function test_admin_can_create_employee(): void
    {
        $this->actingAdmin();

        $response = $this->postJson('/api/employees', [
            'full_name' => 'Mehmet Demir',
            'profession' => 'Resepsiyonist',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('employees', ['full_name' => 'Mehmet Demir']);
    }

    public function test_creating_employee_without_required_fields_fails_validation(): void
    {
        $this->actingAdmin();

        $this->postJson('/api/employees', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['full_name', 'profession']);
    }

    public function test_admin_can_update_employee(): void
    {
        $this->actingAdmin();
        $employee = Employee::factory()->create();

        $this->putJson("/api/employees/{$employee->id}", [
            'full_name' => 'Yeni İsim',
            'profession' => $employee->profession,
        ])->assertStatus(200);
        $this->assertEquals('Yeni İsim', $employee->fresh()->full_name);
    }

    public function test_employees_cannot_be_deleted_via_api(): void
    {
        $this->actingAdmin();
        $employee = Employee::factory()->create();

        $this->deleteJson("/api/employees/{$employee->id}")->assertStatus(405);
    }

    public function test_personel_without_employees_view_cannot_list_employees(): void
    {
        $this->actingPersonel(['reservations.view']);

        $this->getJson('/api/employees')->assertStatus(403);
    }

    public function test_personel_with_employees_create_can_create_employee(): void
    {
        $this->actingPersonel(['employees.view', 'employees.create']);

        $this->postJson('/api/employees', [
            'full_name' => 'Test Çalışan',
            'profession' => 'Garson',
        ])->assertStatus(201);
    }

    public function test_supervisor_role_only_sees_its_scoped_professions(): void
    {
        $role = Role::factory()->create(['visible_professions' => ['Garson']]);
        $role->permissions()->sync([Permission::factory()->create(['key' => 'employees.view'])->id]);
        $supervisor = User::factory()->create(['role_id' => $role->id]);
        $this->actingAs($supervisor, 'sanctum');

        Employee::factory()->create(['full_name' => 'Görünür Garson', 'profession' => 'Garson']);
        Employee::factory()->create(['full_name' => 'Görünmez Muhasebeci', 'profession' => 'Muhasebeci']);

        $response = $this->getJson('/api/employees')->assertStatus(200);
        $names = collect($response->json('data.items'))->pluck('full_name');

        $this->assertTrue($names->contains('Görünür Garson'));
        $this->assertFalse($names->contains('Görünmez Muhasebeci'));
    }

    public function test_unscoped_personel_sees_every_profession(): void
    {
        $this->actingPersonel(['employees.view']);

        Employee::factory()->create(['profession' => 'Garson']);
        Employee::factory()->create(['profession' => 'Muhasebeci']);

        $response = $this->getJson('/api/employees')->assertStatus(200);
        $this->assertCount(2, $response->json('data.items'));
    }
}
