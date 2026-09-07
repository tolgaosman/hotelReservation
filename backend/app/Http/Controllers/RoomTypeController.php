<?php

namespace App\Http\Controllers;

use App\Http\Requests\RoomType\StoreRoomTypeRequest;
use App\Http\Requests\RoomType\UpdateRoomTypeRequest;
use App\Http\Resources\RoomTypeResource;
use App\Models\Room;
use App\Models\RoomType;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RoomTypeController extends Controller
{
    public function __construct(private readonly AuditLogService $auditLog) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', RoomType::class);

        $roomTypes = RoomType::query()
            ->withCount('rooms')
            ->when($request->string('search')->trim()->isNotEmpty(), function ($q) use ($request) {
                $q->where('name', 'like', '%'.$request->string('search').'%');
            })
            ->orderBy('name')
            ->paginate($this->perPage($request));

        return $this->paginated($roomTypes, RoomTypeResource::class);
    }

    public function store(StoreRoomTypeRequest $request): JsonResponse
    {
        $roomType = RoomType::create($request->validated())->refresh();
        $this->auditLog->record('room_type.create', $roomType);

        return $this->success(new RoomTypeResource($roomType), 'Oda tipi oluÅŸturuldu.', 201);
    }

    public function update(UpdateRoomTypeRequest $request, RoomType $roomType): JsonResponse
    {
        DB::transaction(function () use ($request, $roomType) {
            $roomType->update($request->validated());

            // Propagate the new snapshot to every room already on this type
            // â€” Builder::update() skips model casts, so amenities needs its
            // own json_encode. This only reprices *future* reservations:
            // total_amount on existing reservations was already frozen at
            // booking time and is never touched here.
            $attrs = $roomType->roomAttributes();
            $attrs['amenities'] = json_encode($attrs['amenities']);
            Room::where('room_type_id', $roomType->id)->update($attrs);
        });

        $this->auditLog->record('room_type.update', $roomType, $roomType->getChanges());

        return $this->success(new RoomTypeResource($roomType->fresh()), 'Oda tipi gÃ¼ncellendi.');
    }

    public function destroy(RoomType $roomType): JsonResponse
    {
        $this->authorize('delete', $roomType);

        if ($roomType->rooms()->exists()) {
            return $this->error('Bu oda tipine baÄŸlÄ± odalar var. Ã–nce odalarÄ± baÅŸka bir tipe taÅŸÄ±yÄ±n veya tipi pasife alÄ±n.', null, 422);
        }

        $name = $roomType->name;
        $roomType->delete();
        $this->auditLog->record('room_type.delete', null, ['name' => $name]);

        return $this->success(null, 'Oda tipi silindi.');
    }
}
