<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RoomResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'number' => $this->number,
            'type' => $this->type,
            'capacity' => $this->capacity,
            'nightly_rate' => (float) $this->nightly_rate,
            'amenities' => $this->amenities ?? [],
            'status' => $this->status->value,
            'housekeeping_status' => $this->housekeeping_status->value,
            'active' => $this->active,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
