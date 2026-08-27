<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PermissionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'key' => $this->key,
            'label' => $this->label,
            'group' => $this->group,
            'group_label' => $this->group_label,
            'is_page_permission' => $this->is_page_permission,
            'sort_order' => $this->sort_order,
        ];
    }
}
