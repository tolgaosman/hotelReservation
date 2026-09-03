<?php

namespace App\Policies;

use App\Models\User;

class ReservationPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin() || $user->hasPermission('reservations.view');
    }

    public function view(User $user): bool
    {
        return $user->isAdmin() || $user->hasPermission('reservations.view');
    }

    public function create(User $user): bool
    {
        return $user->isAdmin() || $user->hasPermission('reservations.create');
    }

    public function update(User $user): bool
    {
        return $user->isAdmin() || $user->hasPermission('reservations.edit');
    }

    public function confirm(User $user): bool
    {
        return $user->isAdmin() || $user->hasPermission('reservations.confirm');
    }

    public function cancel(User $user): bool
    {
        return $user->isAdmin() || $user->hasPermission('reservations.cancel');
    }

    public function checkIn(User $user): bool
    {
        return $user->isAdmin() || $user->hasPermission('reservations.checkin');
    }

    public function checkOut(User $user): bool
    {
        return $user->isAdmin() || $user->hasPermission('reservations.checkout');
    }

    public function delete(User $user): bool
    {
        return $user->isAdmin() || $user->hasPermission('reservations.delete');
    }
}
