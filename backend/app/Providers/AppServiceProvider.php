<?php

namespace App\Providers;

use App\Models\AuditLog;
use App\Models\Employee;
use App\Models\Guest;
use App\Models\Payment;
use App\Models\Reservation;
use App\Models\Role;
use App\Models\Room;
use App\Models\RoomService;
use App\Policies\AuditLogPolicy;
use App\Policies\EmployeePolicy;
use App\Policies\GuestPolicy;
use App\Policies\PaymentPolicy;
use App\Policies\ReservationPolicy;
use App\Policies\RolePolicy;
use App\Policies\RoomPolicy;
use App\Policies\RoomServicePolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Gate::policy(Room::class, RoomPolicy::class);
        Gate::policy(Guest::class, GuestPolicy::class);
        Gate::policy(Reservation::class, ReservationPolicy::class);
        Gate::policy(Payment::class, PaymentPolicy::class);
        // Employee/Role also resolve via Laravel's XPolicy naming convention,
        // but registering them explicitly here keeps every policy binding in
        // one discoverable place instead of split between two mechanisms.
        Gate::policy(Employee::class, EmployeePolicy::class);
        Gate::policy(Role::class, RolePolicy::class);
        Gate::policy(RoomService::class, RoomServicePolicy::class);
        Gate::policy(AuditLog::class, AuditLogPolicy::class);
    }
}
