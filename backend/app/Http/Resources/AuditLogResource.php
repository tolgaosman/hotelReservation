<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuditLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'user_name' => $this->whenLoaded('user', fn () => $this->user?->name),
            'department' => $this->whenLoaded('user', fn () => $this->user?->permissionRole?->department?->value),
            'department_label' => $this->whenLoaded('user', fn () => $this->user?->permissionRole?->department?->label()),
            'action' => $this->action,
            'auditable_type' => $this->auditable_type,
            'auditable_id' => $this->auditable_id,
            'changes' => $this->changes,
            'ip_address' => $this->ip_address,
            'created_at' => $this->created_at,
        ];
    }
}
