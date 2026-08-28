<?php

namespace App\Policies;

use App\Models\RoomService;
use App\Models\User;

class RoomServicePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin() || $user->hasPermission('room_service.view');
    }

    public function view(User $user): bool
    {
        return $user->isAdmin() || $user->hasPermission('room_service.view');
    }

    public function create(User $user): bool
    {
        return $user->isAdmin() || $user->hasPermission('room_service.create');
    }

    public function delete(User $user, RoomService $roomService): bool
    {
        return $user->isAdmin() || $user->hasPermission('room_service.delete');
    }
}
