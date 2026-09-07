<?php

namespace App\Http\Requests\Room;

use App\Enums\RoomStatus;
use App\Models\Room;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRoomRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Room::class);
    }

    public function rules(): array
    {
        return [
            'number' => ['required', 'string', 'max:20', 'unique:rooms,number'],
            // Capacity/nightly_rate/amenities are no longer accepted here â€”
            // they're a server-written snapshot of the selected room type
            // (RoomType::roomAttributes(), applied in RoomController::store)
            // so a room can never drift from its type's current definition.
            'room_type_id' => ['required', Rule::exists('room_types', 'id')->where('active', true)],
            'status' => ['sometimes', Rule::enum(RoomStatus::class)],
        ];
    }
}
