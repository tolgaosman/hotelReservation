<?php

namespace App\Http\Requests\Room;

use App\Enums\RoomStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRoomRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('room'));
    }

    public function rules(): array
    {
        $roomId = $this->route('room')->id;

        return [
            'number' => ['sometimes', 'string', 'max:20', Rule::unique('rooms', 'number')->ignore($roomId)],
            // No `active` filter here (unlike StoreRoomRequest) â€” a room
            // already assigned to a type that was later deactivated must
            // stay editable (e.g. to change its number or status).
            'room_type_id' => ['sometimes', 'exists:room_types,id'],
            'status' => ['sometimes', Rule::enum(RoomStatus::class)],
        ];
    }
}
