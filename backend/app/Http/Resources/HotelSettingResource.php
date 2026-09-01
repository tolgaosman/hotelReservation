<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HotelSettingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'tax_rate' => (float) $this->tax_rate,
            // Stored as a full TIME column (HH:MM:SS); the frontend's <input
            // type="time"> only accepts HH:MM.
            'check_in_time' => substr($this->check_in_time, 0, 5),
            'check_out_time' => substr($this->check_out_time, 0, 5),
        ];
    }
}
