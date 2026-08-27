<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmployeeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'full_name' => $this->full_name,
            'profession' => $this->profession,
            'role_id' => $this->role_id,
            'role_name' => $this->whenLoaded('role', fn () => $this->role?->name),
            'email' => $this->email,
            'phone' => $this->phone,
            'hire_date' => $this->hire_date?->toDateString(),
            'status' => $this->status,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
        ];
    }
}
