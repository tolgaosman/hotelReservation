<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$reservations = App\Models\Reservation::with(['guest', 'room'])
    ->where('status', 'completed')
    ->get();

echo "Completed count: " . $reservations->count() . PHP_EOL;
foreach ($reservations->take(20) as $r) {
    echo $r->id . ' | ' . ($r->guest->fullName ?? $r->guest->full_name ?? '?') . ' | room ' . ($r->room->number ?? '?') . ' | checkout ' . $r->check_out . PHP_EOL;
}
