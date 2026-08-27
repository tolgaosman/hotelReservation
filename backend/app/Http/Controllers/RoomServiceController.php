<?php

namespace App\Http\Controllers;

use App\Models\Reservation;
use App\Models\RoomService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Resources\ReservationResource;
use App\Http\Resources\RoomServiceResource;

class RoomServiceController extends Controller
{
    /**
     * All room-service charges across every reservation, so the frontend can
     * break "Toplam Tutar" into room + room-service amounts anywhere a
     * reservation's total is shown, without an N+1 fetch per row.
     */
    public function indexAll(Request $request)
    {
        $services = RoomService::query()
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 15));

        return $this->paginated($services, RoomServiceResource::class);
    }

    public function index(Reservation $reservation)
    {
        return response()->json([
            'data' => $reservation->roomServices()->orderBy('created_at', 'desc')->get()
        ]);
    }

    public function store(Request $request, Reservation $reservation)
    {
        $validated = $request->validate([
            'description' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($reservation, $validated) {
            $reservation->roomServices()->create($validated);
            
            $reservation->total_amount += $validated['amount'];
            $reservation->save();
        });

        // Return the updated reservation using the resource to match existing API formats
        $reservation->load(['guest', 'room']);
        return new ReservationResource($reservation);
    }

    public function destroy(RoomService $roomService)
    {
        $reservation = $roomService->reservation;

        DB::transaction(function () use ($reservation, $roomService) {
            $reservation->total_amount -= $roomService->amount;
            $reservation->save();
            
            $roomService->delete();
        });

        $reservation->load(['guest', 'room']);
        return new ReservationResource($reservation);
    }
}
