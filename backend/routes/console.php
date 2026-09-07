<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Keeps the calendar's forward book from ever going stale again the way
// the frozen dataset.json seed did â€” each room's booking horizon is
// re-extended relative to *today* every night instead of being fixed at
// seed time. Requires the standard Laravel cron entry
// (`* * * * * php artisan schedule:run`) to actually fire in a real deployment.
Schedule::command('hotel:fill-calendar')->daily();

// Sweeps out pending/confirmed reservations whose stay has already passed
// without full payment â€” see the command for why cancel (not check-out)
// is the right transition for these.
Schedule::command('hotel:cancel-unpaid-past-reservations')->daily();
