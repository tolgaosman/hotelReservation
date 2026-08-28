<?php

namespace App\Policies;

use App\Models\User;

class EmployeePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin() || $user->hasPermission('employees.view');
    }

    public function view(User $user): bool
    {
        return $user->isAdmin() || $user->hasPermission('employees.view');
    }

    public function create(User $user): bool
    {
        return $user->isAdmin() || $user->hasPermission('employees.create');
    }

    public function update(User $user): bool
    {
        return $user->isAdmin() || $user->hasPermission('employees.edit');
    }
}
