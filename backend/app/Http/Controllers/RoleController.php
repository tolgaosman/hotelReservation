<?php

namespace App\Http\Controllers;

use App\Http\Requests\Role\StoreRoleRequest;
use App\Http\Requests\Role\UpdateRoleRequest;
use App\Http\Resources\RoleResource;
use App\Models\Role;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class RoleController extends Controller
{
    public function __construct(private readonly AuditLogService $auditLog)
    {
    }

    public function index(): JsonResponse
    {
        $this->authorize('viewAny', Role::class);

        $roles = Role::query()
            ->withCount('employees')
            ->with('permissions')
            ->orderBy('name')
            ->get();

        return $this->success(RoleResource::collection($roles));
    }

    public function store(StoreRoleRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $role = Role::create([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'description' => $validated['description'] ?? null,
            'department' => $validated['department'] ?? null,
        ]);

        $role->permissions()->sync($validated['permission_ids'] ?? []);
        $role->load('permissions')->loadCount('employees');
        $this->auditLog->record('role.create', $role);

        return $this->success(new RoleResource($role), 'Rol oluşturuldu.', 201);
    }

    // No show() — the roles route excludes it (the index already eager-loads
    // permissions/employee counts for every role, so a single-role fetch has
    // no caller on the frontend).

    public function update(UpdateRoleRequest $request, Role $role): JsonResponse
    {
        $validated = $request->validated();

        $role->update([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'description' => $validated['description'] ?? null,
            'department' => $validated['department'] ?? null,
        ]);

        $role->permissions()->sync($validated['permission_ids'] ?? []);
        $role->load('permissions')->loadCount('employees');
        $this->auditLog->record('role.update', $role);

        return $this->success(new RoleResource($role), 'Rol güncellendi.');
    }

    public function destroy(Role $role): JsonResponse
    {
        $this->authorize('delete', $role);

        if ($role->is_system) {
            return $this->error('Sistem rolleri silinemez.', null, 422);
        }

        if ($role->employees()->exists()) {
            return $this->error('Bu role atanmış çalışanlar var, önce onları başka bir role taşıyın.', null, 422);
        }

        $roleName = $role->name;
        $role->delete();
        $this->auditLog->record('role.delete', null, ['name' => $roleName]);

        return $this->success(null, 'Rol silindi.');
    }
}
