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
            ->with(['guest', 'room', 'companions'])
            ->withSum('payments', 'amount')
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->input('status')))
            ->when($request->filled('guest_id'), fn ($q) => $q->where('guest_id', $request->input('guest_id')))
            ->when($request->filled('room_id'), fn ($q) => $q->where('room_id', $request->input('room_id')))
            ->orderByDesc('check_in')
            ->paginate($this->perPage($request));

        return $this->paginated($reservations, ReservationResource::class);
    }

    public function store(StoreReservationRequest $request): JsonResponse
    {
        $reservation = $this->reservations->create([
            ...$request->validated(),
            'created_by' => $request->user()->id,
        ]);

        return $this->success(new ReservationResource($reservation->load(['guest', 'room', 'companions'])), 'Rezervasyon oluşturuldu.', 201);
    }

    public function show(Reservation $reservation): JsonResponse
    {
        $this->authorize('view', $reservation);

        return $this->success(new ReservationResource($reservation->load(['guest', 'room', 'companions'])));
    }

    public function update(UpdateReservationRequest $request, Reservation $reservation): JsonResponse
    {
        // Authorization already enforced by UpdateReservationRequest::authorize().
        $reservation = $this->reservations->update($reservation, $request->validated());

        return $this->success(new ReservationResource($reservation->load(['guest', 'room', 'companions'])), 'Rezervasyon güncellendi.');
    }

    public function confirm(Reservation $reservation): JsonResponse
    {
        $this->authorize('confirm', $reservation);
        $reservation = $this->reservations->confirm($reservation);

        return $this->success(new ReservationResource($reservation->load(['guest', 'room', 'companions'])), 'Rezervasyon onaylandı.');
    }

    public function cancel(Reservation $reservation): JsonResponse
    {
        $this->authorize('cancel', $reservation);
        $reservation = $this->reservations->cancel($reservation);

        return $this->success(new ReservationResource($reservation->load(['guest', 'room', 'companions'])), 'Rezervasyon iptal edildi.');
    }

    public function checkIn(Reservation $reservation): JsonResponse
    {
        $this->authorize('checkIn', $reservation);
        $reservation = $this->reservations->checkIn($reservation);

        return $this->success(new ReservationResource($reservation->load(['guest', 'room', 'companions'])), 'Check-in tamamlandı.');
    }

    public function checkOut(Reservation $reservation): JsonResponse
    {
        $this->authorize('checkOut', $reservation);
        $reservation = $this->reservations->checkOut($reservation);

        return $this->success(new ReservationResource($reservation->load(['guest', 'room', 'companions'])), 'Check-out tamamlandı.');
    }

    public function payments(Reservation $reservation): JsonResponse
    {
        $this->authorize('view', $reservation);

        return $this->success(PaymentResource::collection($reservation->payments()->orderByDesc('created_at')->get()));
    }

    public function invoice(Reservation $reservation)
    {
        $this->authorize('view', $reservation);

        $reservation->load(['guest', 'room', 'payments']);

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('invoice', compact('reservation'));

        // For API, we can return the raw PDF content with appropriate headers
        // But since it's an API, usually frontend downloads it. Let's just return the download response.
        return $pdf->download('fatura-'.$reservation->id.'.pdf');
    }

    public function destroy(Reservation $reservation): JsonResponse
    {
        $this->authorize('delete', $reservation);
        
        $this->reservations->delete($reservation);

        return response()->json(null, 204);
    }
}
