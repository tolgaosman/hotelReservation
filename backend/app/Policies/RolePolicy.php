<?php

namespace App\Policies;

use App\Models\User;

class RolePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin() || $user->hasPermission('roles.view');
    }

    public function view(User $user): bool
    {
        return $user->isAdmin() || $user->hasPermission('roles.view');
    }

    public function create(User $user): bool
    {
        return $user->isAdmin() || $user->hasPermission('roles.create');
    }

    public function update(User $user): bool
    {
        return $user->isAdmin() || $user->hasPermission('roles.edit');
    }

    // Deleting a role is destructive and touches every employee assigned to
    // it, so it stays admin-only regardless of the granular roles.* catalog
    // (there is no seeded roles.delete permission).
    public function delete(User $user): bool
    {
        return $user->isAdmin();
    }
}
