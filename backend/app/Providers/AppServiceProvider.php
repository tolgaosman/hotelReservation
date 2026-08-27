<?php

namespace App\Providers;

use App\Models\Guest;
use App\Models\Payment;
use App\Models\Reservation;
use App\Models\Room;
use App\Policies\GuestPolicy;
use App\Policies\PaymentPolicy;
use App\Policies\ReservationPolicy;
use App\Policies\RoomPolicy;
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
    }
}
