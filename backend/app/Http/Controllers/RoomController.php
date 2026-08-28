<?php

namespace App\Http\Controllers;

use App\Http\Requests\Room\StoreRoomRequest;
use App\Http\Requests\Room\UpdateRoomRequest;
use App\Http\Resources\RoomResource;
use App\Models\Room;
use App\Services\ReservationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class RoomController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Room::class);

        $rooms = Room::query()
            ->when($request->string('search')->trim()->isNotEmpty(), function ($q) use ($request) {
                $search = '%'.$request->string('search').'%';
                $q->where(fn ($q2) => $q2->where('number', 'like', $search)->orWhere('type', 'like', $search));
            })
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->input('status')))
            ->when($request->has('active'), fn ($q) => $q->where('active', $request->boolean('active')))
            ->orderBy('number')
            ->paginate($this->perPage($request));

        return $this->paginated($rooms, RoomResource::class);
    }

    public function store(StoreRoomRequest $request): JsonResponse
    {
        $room = Room::create($request->validated())->refresh();

        return $this->success(new RoomResource($room), 'Oda oluşturuldu.', 201);
    }

    public function show(Room $room): JsonResponse
    {
        $this->authorize('view', $room);

        return $this->success(new RoomResource($room));
    }

    public function update(UpdateRoomRequest $request, Room $room): JsonResponse
    {
        $room->update($request->validated());

        return $this->success(new RoomResource($room), 'Oda güncellendi.');
    }

    public function deactivate(Room $room): JsonResponse
    {
        $this->authorize('deactivate', $room);

        if ($room->status === \App\Enums\RoomStatus::Occupied) {
            return $this->error('Dolu bir oda pasife alınamaz.', null, 422);
        }

        $room->update(['active' => false]);

        return $this->success(new RoomResource($room), 'Oda pasife alındı.');
    }

    public function activate(Room $room): JsonResponse
    {
        $this->authorize('deactivate', $room);

        $room->update(['active' => true]);

        return $this->success(new RoomResource($room), 'Oda aktifleştirildi.');
    }

    public function updateHousekeeping(Request $request, Room $room): JsonResponse
    {
        $this->authorize('updateHousekeeping', $room);

        $validated = $request->validate([
            'housekeeping_status' => ['nullable', \Illuminate\Validation\Rule::enum(\App\Enums\HousekeepingStatus::class)],
            'is_maintenance' => ['nullable', 'boolean'],
            'maintenance_note' => ['nullable', 'string', 'max:255'],
            'assigned_staff' => ['nullable', 'string', 'max:255'],
            'is_priority_cleaning' => ['nullable', 'boolean'],
        ]);

        $room->update(array_filter($validated, function ($val) { return $val !== null; }));
        
        // Handle explicit nulls if sent (like clearing note or staff)
        if ($request->has('maintenance_note') && $request->input('maintenance_note') === null) {
            $room->maintenance_note = null;
        }
        if ($request->has('assigned_staff') && $request->input('assigned_staff') === null) {
            $room->assigned_staff = null;
        }
        $room->save();

        return $this->success(new RoomResource($room), 'Temizlik durumu güncellendi.');
    }

    public function availability(Request $request, Room $room, ReservationService $service): JsonResponse
    {
        $request->validate([
            'check_in' => ['required', 'date'],
            'check_out' => ['required', 'date', 'after:check_in'],
        ]);

        $available = ! $service->hasConflict(
            $room->id,
            Carbon::parse($request->input('check_in')),
            Carbon::parse($request->input('check_out')),
        );

        return $this->success(['available' => $available]);
    }
}
