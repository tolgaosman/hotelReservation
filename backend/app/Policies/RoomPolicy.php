<?php

namespace App\Policies;

use App\Models\User;

class RoomPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin() || $user->hasPermission('rooms.view');
    }

    public function view(User $user): bool
    {
        return $user->isAdmin() || $user->hasPermission('rooms.view');
    }

    public function create(User $user): bool
    {
        return $user->isAdmin() || $user->hasPermission('rooms.create');
    }

    public function update(User $user): bool
    {
        return $user->isAdmin() || $user->hasPermission('rooms.edit');
    }

    public function deactivate(User $user): bool
    {
        return $user->isAdmin() || $user->hasPermission('rooms.deactivate');
    }

    public function updateHousekeeping(User $user): bool
    {
        return $user->isAdmin() || $user->hasPermission('housekeeping.update_status');
    }

    public function assignHousekeepingStaff(User $user): bool
    {
        return $user->isAdmin() || $user->hasPermission('housekeeping.assign_staff');
    }

    public function manageMaintenance(User $user): bool
    {
        return $user->isAdmin() || $user->hasPermission('housekeeping.maintenance');
    }

    public function markPriorityCleaning(User $user): bool
    {
        return $user->isAdmin() || $user->hasPermission('housekeeping.mark_priority');
    }
}
