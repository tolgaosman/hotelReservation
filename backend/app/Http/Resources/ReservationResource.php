<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReservationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'guest_id' => $this->guest_id,
            'room_id' => $this->room_id,
            'guest' => new GuestResource($this->whenLoaded('guest')),
            'room' => new RoomResource($this->whenLoaded('room')),
            'companions' => GuestResource::collection($this->whenLoaded('companions')),
            'check_in' => $this->check_in->toDateString(),
            'check_out' => $this->check_out->toDateString(),
            'guest_count' => $this->guest_count,
            'status' => $this->status->value,
            'total_amount' => (float) $this->total_amount,
            'paid_amount' => $this->paid_amount,
            'balance' => $this->balance,
            'checked_in_at' => $this->checked_in_at,
            'checked_out_at' => $this->checked_out_at,
            'cancelled_at' => $this->cancelled_at,
            'created_at' => $this->created_at,
        ];
    }
}
