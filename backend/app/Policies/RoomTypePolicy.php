<?php

namespace App\Policies;

use App\Models\User;

class RoomTypePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin() || $user->hasPermission('room_types.view');
    }

    public function view(User $user): bool
    {
        return $user->isAdmin() || $user->hasPermission('room_types.view');
    }

    public function create(User $user): bool
    {
        return $user->isAdmin() || $user->hasPermission('room_types.create');
    }

    public function update(User $user): bool
    {
        return $user->isAdmin() || $user->hasPermission('room_types.edit');
    }

    public function delete(User $user): bool
    {
        return $user->isAdmin() || $user->hasPermission('room_types.delete');
    }
}
