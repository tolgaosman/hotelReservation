<?php

namespace App\Http\Controllers;

use App\Http\Requests\Employee\StoreEmployeeRequest;
use App\Http\Requests\Employee\UpdateEmployeeRequest;
use App\Http\Resources\EmployeeResource;
use App\Models\Employee;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmployeeController extends Controller
{
    public function __construct(private readonly AuditLogService $auditLog)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Employee::class);

        $visibleProfessions = $request->user()->isAdmin() ? null : $request->user()->permissionRole?->visible_professions;

        $employees = Employee::query()
            ->with('role')
            ->when($visibleProfessions, fn ($q) => $q->whereIn('profession', $visibleProfessions))
            ->when($request->string('search')->trim()->isNotEmpty(), function ($q) use ($request) {
                $search = '%'.$request->string('search').'%';
                $q->where(fn ($q2) => $q2->where('full_name', 'like', $search)->orWhere('profession', 'like', $search));
            })
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->input('status')))
            ->orderBy('full_name')
            ->paginate($this->perPage($request));

        return $this->paginated($employees, EmployeeResource::class);
    }

    public function store(StoreEmployeeRequest $request): JsonResponse
    {
        $employee = Employee::create($request->validated())->load('role');
        $this->auditLog->record('employee.create', $employee);

        return $this->success(new EmployeeResource($employee), 'Çalışan eklendi.', 201);
    }

    public function show(Employee $employee): JsonResponse
    {
        $this->authorize('view', $employee);

        return $this->success(new EmployeeResource($employee->load('role')));
    }

    public function update(UpdateEmployeeRequest $request, Employee $employee): JsonResponse
    {
        $employee->update($request->validated());
        $this->auditLog->record('employee.update', $employee);

        return $this->success(new EmployeeResource($employee->load('role')), 'Çalışan güncellendi.');
    }
}
