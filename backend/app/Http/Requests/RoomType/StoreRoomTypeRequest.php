<?php

namespace App\Http\Requests\RoomType;

use App\Models\RoomType;
use Illuminate\Foundation\Http\FormRequest;

class StoreRoomTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', RoomType::class);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:80', 'unique:room_types,name'],
            'description' => ['nullable', 'string', 'max:1000'],
            'capacity' => ['required', 'integer', 'min:1', 'max:20'],
            'nightly_rate' => ['required', 'numeric', 'min:0'],
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
