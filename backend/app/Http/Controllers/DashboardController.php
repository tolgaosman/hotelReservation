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

    public function stats(): JsonResponse
    {
        return $this->success($this->dashboard->stats());
    }

    public function today(): JsonResponse
    {
        $data = $this->dashboard->today();

        return $this->success([
            'check_ins' => ReservationResource::collection($data['check_ins']),
            'check_outs' => ReservationResource::collection($data['check_outs']),
        ]);
    }

    public function revenue(Request $request): JsonResponse
    {
        $request->validate([
            'from' => ['required', 'date'],
            'to' => ['required', 'date', 'after_or_equal:from'],
            'bucket' => ['sometimes', 'in:day,week,month'],
        ]);

        $series = $this->dashboard->revenue(
            Carbon::parse($request->input('from')),
            Carbon::parse($request->input('to')),
            $request->input('bucket', 'day'),
        );

        return $this->success($series);
    }
}
