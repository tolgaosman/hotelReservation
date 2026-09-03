<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RoomTypeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'capacity' => $this->capacity,
            'nightly_rate' => (float) $this->nightly_rate,
            'amenities' => $this->amenities ?? [],
            'bed_type' => $this->bed_type,
            'size_m2' => $this->size_m2,
            'view' => $this->view,
            'images' => $this->images,
            'active' => $this->active,
            'room_count' => $this->whenCounted('rooms'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
