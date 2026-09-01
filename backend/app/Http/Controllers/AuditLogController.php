<?php

namespace App\Http\Controllers;

use App\Http\Resources\AuditLogResource;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', AuditLog::class);

        $user = $request->user();
        $exempt = $user->isAdmin() || $user->hasPermission('audit_logs.view_all');
        $department = $exempt ? null : $user->permissionRole?->department;

        $query = AuditLog::query()
            ->when(! $exempt, fn ($q) => $department
                ? $q->whereHas('user.permissionRole', fn ($rq) => $rq->where('department', $department->value))
                : $q->where('user_id', $user->id))
            ->when($request->filled('auditable_type'), fn ($q) => $q->where('auditable_type', $request->input('auditable_type')))
            ->when($request->filled('auditable_id'), fn ($q) => $q->where('auditable_id', $request->input('auditable_id')))
            ->when($request->filled('user_id'), fn ($q) => $q->where('user_id', $request->input('user_id')))
            ->when($request->filled('action'), fn ($q) => $q->where('action', $request->input('action')))
            ->when($request->filled('from'), fn ($q) => $q->where('created_at', '>=', $request->input('from')))
            ->when($request->filled('to'), fn ($q) => $q->where('created_at', '<=', $request->input('to')));

        $statsQuery = clone $query;
        $stats = $statsQuery->select('auditable_type', \Illuminate\Support\Facades\DB::raw('count(*) as count'))->groupBy('auditable_type')->pluck('count', 'auditable_type');

        $logs = $query->with('user.permissionRole')
            ->orderByDesc('created_at')
            ->paginate($this->perPage($request));

        $response = $this->paginated($logs, AuditLogResource::class);
        $data = $response->getData(true);
        $data['data']['meta']['module_stats'] = $stats;
        
        return response()->json($data, $response->getStatusCode());
    }
}
