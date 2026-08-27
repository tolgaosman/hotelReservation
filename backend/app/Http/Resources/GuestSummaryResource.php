<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Expects the underlying model to have been queried with
 * withCount('reservations') and withSum('reservations as total_spent', 'total_amount').
 */
class GuestSummaryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'full_name' => $this->full_name,
            'phone' => $this->phone,
            'email' => $this->email,
            'identity_number' => $this->identity_number,
            'country' => $this->country,
            'total_bookings' => (int) ($this->reservations_count ?? 0),
            'total_spent' => (float) ($this->total_spent ?? 0),
            'created_at' => $this->created_at,
        ];
    }
}
