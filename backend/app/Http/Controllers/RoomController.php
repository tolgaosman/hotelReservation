<?php

namespace App\Http\Controllers;

use App\Enums\HousekeepingStatus;
use App\Enums\RoomStatus;
use App\Http\Requests\Room\StoreRoomRequest;
use App\Http\Requests\Room\UpdateRoomRequest;
use App\Http\Resources\RoomResource;
use App\Models\Room;
use App\Models\RoomType;
use App\Services\AuditLogService;
use App\Services\ReservationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

class RoomController extends Controller
{
    public function __construct(private readonly AuditLogService $auditLog) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Room::class);

        $rooms = Room::query()
            ->when($request->string('search')->trim()->isNotEmpty(), function ($q) use ($request) {
                $search = '%'.$request->string('search').'%';
                $q->where(fn ($q2) => $q2->where('number', 'like', $search)->orWhere('type', 'like', $search));
            })
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->input('status')))
            ->when($request->filled('room_type_id'), fn ($q) => $q->where('room_type_id', $request->integer('room_type_id')))
            ->orderBy('number')
            ->paginate($this->perPage($request));

        return $this->paginated($rooms, RoomResource::class);
    }

    public function store(StoreRoomRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data += RoomType::findOrFail($data['room_type_id'])->roomAttributes();

        $room = Room::create($data)->refresh();
        $this->auditLog->record('room.create', $room);

        return $this->success(new RoomResource($room), 'Oda oluÅŸturuldu.', 201);
    }

    public function show(Room $room): JsonResponse
    {
        $this->authorize('view', $room);

        return $this->success(new RoomResource($room));
    }

    public function update(UpdateRoomRequest $request, Room $room): JsonResponse
    {
        $data = $request->validated();
        if (isset($data['room_type_id'])) {
            $data += RoomType::findOrFail($data['room_type_id'])->roomAttributes();
        }

        $room->update($data);
        $this->auditLog->record('room.update', $room);

        return $this->success(new RoomResource($room), 'Oda gÃ¼ncellendi.');
    }

    public function deactivate(Room $room): JsonResponse
    {
        $this->authorize('deactivate', $room);

        if ($room->status === RoomStatus::Occupied) {
            return $this->error('Dolu bir oda pasife alÄ±namaz.', null, 422);
        }

        $room->update(['status' => RoomStatus::Passive]);
        $this->auditLog->record('room.deactivate', $room);

        return $this->success(new RoomResource($room), 'Oda pasife alÄ±ndÄ±.');
    }

    public function activate(Room $room): JsonResponse
    {
        $this->authorize('deactivate', $room);

        $room->update(['status' => RoomStatus::Available]);
        $this->auditLog->record('room.activate', $room);

        return $this->success(new RoomResource($room), 'Oda aktifleÅŸtirildi.');
    }

    public function updateHousekeeping(Request $request, Room $room): JsonResponse
    {
        $validated = $request->validate([
            'housekeeping_status' => ['nullable', Rule::enum(HousekeepingStatus::class)],
            'is_maintenance' => ['nullable', 'boolean'],
            'maintenance_note' => ['nullable', 'string', 'max:255'],
            'assigned_staff' => ['nullable', 'string', 'max:255'],
            'is_priority_cleaning' => ['nullable', 'boolean'],
        ]);

        // Split per field group so a role granted only one of these (e.g. a
        // cleaner who can flag maintenance but not reassign staff) isn't
        // blocked by a single all-or-nothing ability check.
        if ($request->has('assigned_staff')) {
            $this->authorize('assignHousekeepingStaff', $room);
        }
        if ($request->hasAny(['is_maintenance', 'maintenance_note'])) {
            $this->authorize('manageMaintenance', $room);
        }
        if ($request->has('housekeeping_status')) {
            $this->authorize('updateHousekeeping', $room);
        }
        if ($request->has('is_priority_cleaning')) {
            $this->authorize('markPriorityCleaning', $room);
        }

        if (isset($validated['housekeeping_status']) && $validated['housekeeping_status'] === HousekeepingStatus::Clean->value) {
            $validated['is_priority_cleaning'] = false;
        }

        $room->update(array_filter($validated, function ($val) {
            return $val !== null;
        }));

        // Handle explicit nulls if sent (like clearing note or staff)
        if ($request->has('maintenance_note') && $request->input('maintenance_note') === null) {
            $room->maintenance_note = null;
        }
        if ($request->has('assigned_staff') && $request->input('assigned_staff') === null) {
            $room->assigned_staff = null;
        }
        $room->save();
        $this->auditLog->record('room.housekeeping_update', $room, $validated);

        return $this->success(new RoomResource($room), 'Temizlik durumu gÃ¼ncellendi.');
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
