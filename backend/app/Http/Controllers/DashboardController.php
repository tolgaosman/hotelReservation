<?php

namespace App\Http\Controllers;

use App\Http\Resources\ReservationResource;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class DashboardController extends Controller
{
    public function __construct(private readonly DashboardService $dashboard)
    {
    }

    public function stats(Request $request): JsonResponse
    {
        $this->authorizeDashboard($request);

        return $this->success($this->dashboard->stats());
    }

    public function today(Request $request): JsonResponse
    {
        $this->authorizeDashboard($request);

        $data = $this->dashboard->today();

        return $this->success([
            'check_ins' => ReservationResource::collection($data['check_ins']),
            'check_outs' => ReservationResource::collection($data['check_outs']),
        ]);
    }

    public function revenue(Request $request): JsonResponse
    {
        $this->authorizeDashboard($request, 'dashboard.widget_revenue');

        $request->validate([
            'from' => ['required', 'date', 'after_or_equal:'.now()->subYears(5)->toDateString()],
            'to' => ['required', 'date', 'after_or_equal:from', 'before_or_equal:'.now()->addDay()->toDateString()],
            'bucket' => ['sometimes', 'in:day,week,month'],
        ]);

        $series = $this->dashboard->revenue(
            Carbon::parse($request->input('from')),
            Carbon::parse($request->input('to')),
            $request->input('bucket', 'day'),
        );

        return $this->success($series);
    }

    // Dashboard has no Eloquent model to hang a policy off, so the gate is a
    // plain permission check here rather than $this->authorize().
    private function authorizeDashboard(Request $request, ?string $extra = null): void
    {
        $user = $request->user();
        abort_unless($user->isAdmin() || $user->hasPermission('dashboard.view'), 403);

        if ($extra !== null) {
            abort_unless($user->isAdmin() || $user->hasPermission($extra), 403);
        }
    }
}
