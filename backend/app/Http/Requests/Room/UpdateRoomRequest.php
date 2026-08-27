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
            'type' => ['sometimes', 'string', 'max:50'],
            'capacity' => ['sometimes', 'integer', 'min:1'],
            'nightly_rate' => ['sometimes', 'numeric', 'min:0'],
            'amenities' => ['sometimes', 'array'],
            'amenities.*' => ['string'],
            'status' => ['sometimes', Rule::enum(RoomStatus::class)],
        ];
    }
}
