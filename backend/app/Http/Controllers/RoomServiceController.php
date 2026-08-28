<?php

namespace App\Http\Controllers;

use App\Exceptions\DomainActionException;
use App\Http\Resources\ReservationResource;
use App\Http\Resources\RoomServiceResource;
use App\Models\Reservation;
use App\Models\RoomService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RoomServiceController extends Controller
{
    /**
     * All room-service charges across every reservation, so the frontend can
     * break "Toplam Tutar" into room + room-service amounts anywhere a
     * reservation's total is shown, without an N+1 fetch per row.
     */
    public function indexAll(Request $request)
    {
        $this->authorize('viewAny', RoomService::class);

        $services = RoomService::query()
            ->orderByDesc('created_at')
            ->paginate($this->perPage($request));

        return $this->paginated($services, RoomServiceResource::class);
    }

    public function index(Reservation $reservation)
    {
        $this->authorize('viewAny', RoomService::class);

        return $this->success(
            RoomServiceResource::collection($reservation->roomServices()->orderBy('created_at', 'desc')->get())
        );
    }

    public function store(Request $request, Reservation $reservation)
    {
        $this->authorize('create', RoomService::class);

        $validated = $request->validate([
            'description' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0.01|max:1000000',
        ]);

        DB::transaction(function () use ($reservation, $validated) {
            /** @var Reservation $locked */
            $locked = Reservation::query()->lockForUpdate()->findOrFail($reservation->id);

            if ($locked->status === \App\Enums\ReservationStatus::Cancelled) {
                throw new DomainActionException('İptal edilmiş bir rezervasyona ek hizmet eklenemez.');
            }

            $locked->roomServices()->create($validated);
            $locked->total_amount += $validated['amount'];
            $locked->save();
        });

        $reservation->refresh()->load(['guest', 'room']);

        return $this->success(new ReservationResource($reservation), 'Ek hizmet eklendi.', 201);
    }

    public function destroy(RoomService $roomService)
    {
        $reservation = $roomService->reservation;
        $this->authorize('delete', $roomService);

        DB::transaction(function () use ($reservation, $roomService) {
            /** @var Reservation $locked */
            $locked = Reservation::query()->lockForUpdate()->findOrFail($reservation->id);

            $newTotal = $locked->total_amount - $roomService->amount;
            if (bccomp((string) $newTotal, (string) $locked->paid_amount, 2) < 0) {
                throw new DomainActionException('Bu ek hizmet silinemez: rezervasyon için ödenen tutarın altına düşürür.');
            }

            $locked->total_amount = $newTotal;
            $locked->save();

            $roomService->delete();
        });

        $reservation->refresh()->load(['guest', 'room']);

        return $this->success(new ReservationResource($reservation), 'Ek hizmet silindi.');
    }
}
