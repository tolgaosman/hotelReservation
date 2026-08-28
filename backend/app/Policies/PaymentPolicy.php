<?php

namespace App\Policies;

use App\Models\User;

class PaymentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin() || $user->hasPermission('payments.view');
    }

    public function create(User $user): bool
    {
        return $user->isAdmin() || $user->hasPermission('payments.create');
    }
}
