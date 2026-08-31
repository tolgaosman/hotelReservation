<?php

namespace App\Http\Controllers;

use App\Http\Requests\Guest\StoreGuestRequest;
use App\Http\Requests\Guest\UpdateGuestRequest;
use App\Http\Resources\GuestResource;
use App\Http\Resources\GuestSummaryResource;
use App\Http\Resources\ReservationResource;
use App\Models\Guest;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GuestController extends Controller
{
    public function __construct(private readonly AuditLogService $auditLog)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Guest::class);

        $guests = Guest::query()
            ->withCount('reservations')
            ->withSum('reservations as total_spent', 'total_amount')
            ->when($request->string('search')->trim()->isNotEmpty(), function ($q) use ($request) {
                $search = '%'.$request->string('search').'%';
                $q->where(fn ($q2) => $q2->where('full_name', 'like', $search)
                    ->orWhere('email', 'like', $search)
                    ->orWhere('identity_number', 'like', $search));
            })
            ->orderBy('full_name')
            ->paginate($this->perPage($request));

        return $this->paginated($guests, GuestSummaryResource::class);
    }

    public function store(StoreGuestRequest $request): JsonResponse
    {
        $guest = Guest::create($request->validated());
        $this->auditLog->record('guest.create', $guest);

        return $this->success(new GuestResource($guest), 'Misafir oluşturuldu.', 201);
    }

    public function show(Guest $guest): JsonResponse
    {
        $this->authorize('view', $guest);

        return $this->success(new GuestResource($guest));
    }

    public function update(UpdateGuestRequest $request, Guest $guest): JsonResponse
    {
        $guest->update($request->validated());
        $this->auditLog->record('guest.update', $guest);

        return $this->success(new GuestResource($guest), 'Misafir güncellendi.');
    }

    public function reservations(Guest $guest): JsonResponse
    {
        $this->authorize('view', $guest);

        $reservations = $guest->reservations()->with('room')->withSum('payments', 'amount')->orderByDesc('check_in')->get();

        return $this->success(ReservationResource::collection($reservations));
    }
}
