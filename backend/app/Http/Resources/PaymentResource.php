<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reservation_id' => $this->reservation_id,
            'amount' => (float) $this->amount,
            'method' => $this->method->value,
            'note' => $this->note,
            'created_at' => $this->created_at,
        ];
    }
}
