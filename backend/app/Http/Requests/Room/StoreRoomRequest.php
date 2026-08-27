<?php

namespace App\Http\Requests\Room;

use App\Enums\RoomStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRoomRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', \App\Models\Room::class);
    }

    public function rules(): array
    {
        return [
            'number' => ['required', 'string', 'max:20', 'unique:rooms,number'],
            'type' => ['required', 'string', 'max:50'],
            'capacity' => ['required', 'integer', 'min:1'],
            'nightly_rate' => ['required', 'numeric', 'min:0'],
            'amenities' => ['sometimes', 'array'],
            'amenities.*' => ['string'],
            'status' => ['sometimes', Rule::enum(RoomStatus::class)],
        ];
    }
}
