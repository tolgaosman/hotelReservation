<?php

namespace App\Http\Requests\RoomType;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRoomTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('room_type'));
    }

    public function rules(): array
    {
        $roomTypeId = $this->route('room_type')->id;

        return [
            'name' => ['sometimes', 'string', 'max:80', Rule::unique('room_types', 'name')->ignore($roomTypeId)],
            'description' => ['nullable', 'string', 'max:1000'],
            'capacity' => ['sometimes', 'integer', 'min:1', 'max:20'],
            'nightly_rate' => ['sometimes', 'numeric', 'min:0'],
            'amenities' => ['sometimes', 'array', 'max:20'],
            'amenities.*' => ['string', 'max:50'],
            'bed_type' => ['nullable', 'string', 'max:50'],
            'size_m2' => ['nullable', 'integer', 'min:1', 'max:999'],
            'view' => ['nullable', 'string', 'max:50'],
            'images' => ['sometimes', 'nullable', 'array', 'max:5'],
            'images.*' => ['string', 'url', 'max:2048'],
            'active' => ['sometimes', 'boolean'],
        ];
    }
}
