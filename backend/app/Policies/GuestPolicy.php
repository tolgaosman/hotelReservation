<?php

namespace App\Policies;

use App\Models\User;

class GuestPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin() || $user->hasPermission('guests.view');
    }

    public function view(User $user): bool
    {
        return $user->isAdmin() || $user->hasPermission('guests.view');
    }

    public function create(User $user): bool
    {
        return $user->isAdmin() || $user->hasPermission('guests.create');
    }

    public function update(User $user): bool
    {
        return $user->isAdmin() || $user->hasPermission('guests.edit');
    }
}
