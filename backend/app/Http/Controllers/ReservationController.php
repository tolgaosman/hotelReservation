<?php

namespace App\Http\Controllers;

use App\Http\Requests\Reservation\StoreReservationRequest;
use App\Http\Requests\Reservation\UpdateReservationRequest;
use App\Http\Resources\PaymentResource;
use App\Http\Resources\ReservationResource;
use App\Models\Reservation;
use App\Services\ReservationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReservationController extends Controller
{
    public function __construct(private readonly ReservationService $reservations)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Reservation::class);

        $reservations = Reservation::query()
            ->with(['guest', 'room'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->input('status')))
            ->when($request->filled('guest_id'), fn ($q) => $q->where('guest_id', $request->input('guest_id')))
            ->when($request->filled('room_id'), fn ($q) => $q->where('room_id', $request->input('room_id')))
            ->orderByDesc('check_in')
            ->paginate($request->integer('per_page', 15));

        return $this->paginated($reservations, ReservationResource::class);
    }

    public function store(StoreReservationRequest $request): JsonResponse
    {
        $reservation = $this->reservations->create([
            ...$request->validated(),
            'created_by' => $request->user()->id,
        ]);

        return $this->success(new ReservationResource($reservation->load(['guest', 'room'])), 'Rezervasyon oluşturuldu.', 201);
    }

    public function show(Reservation $reservation): JsonResponse
    {
        $this->authorize('view', $reservation);

        return $this->success(new ReservationResource($reservation->load(['guest', 'room'])));
    }

    public function update(UpdateReservationRequest $request, Reservation $reservation): JsonResponse
    {
        $reservation = $this->reservations->update($reservation, $request->validated());

        return $this->success(new ReservationResource($reservation->load(['guest', 'room'])), 'Rezervasyon güncellendi.');
    }

    public function confirm(Reservation $reservation): JsonResponse
    {
        $this->authorize('transition', $reservation);
        $reservation = $this->reservations->confirm($reservation);

        return $this->success(new ReservationResource($reservation->load(['guest', 'room'])), 'Rezervasyon onaylandı.');
    }

    public function cancel(Reservation $reservation): JsonResponse
    {
        $this->authorize('transition', $reservation);
        $reservation = $this->reservations->cancel($reservation);

        return $this->success(new ReservationResource($reservation->load(['guest', 'room'])), 'Rezervasyon iptal edildi.');
    }

    public function checkIn(Reservation $reservation): JsonResponse
    {
        $this->authorize('transition', $reservation);
        $reservation = $this->reservations->checkIn($reservation);

        return $this->success(new ReservationResource($reservation->load(['guest', 'room'])), 'Check-in tamamlandı.');
    }

    public function checkOut(Reservation $reservation): JsonResponse
    {
        $this->authorize('transition', $reservation);
        $reservation = $this->reservations->checkOut($reservation);

        return $this->success(new ReservationResource($reservation->load(['guest', 'room'])), 'Check-out tamamlandı.');
    }

    public function payments(Reservation $reservation): JsonResponse
    {
        $this->authorize('view', $reservation);

        return $this->success(PaymentResource::collection($reservation->payments()->orderByDesc('created_at')->get()));
    }
}
