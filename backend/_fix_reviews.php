<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$reviews = App\Models\Review::orderBy('id')->get();

$reservations = App\Models\Reservation::with(['guest', 'room'])
    ->where('status', 'completed')
    ->orderByDesc('check_out')
    ->limit(200)
    ->get()
    ->filter(fn ($r) => $r->guest && $r->room)
    ->shuffle();

$used = [];
foreach ($reviews as $review) {
    $res = $reservations->first(fn ($r) => !in_array($r->id, $used));
    if (!$res) break;
    $used[] = $res->id;

    $review->update([
        'room_id' => $res->room_id,
        'guest_name' => $res->guest->full_name,
    ]);

    echo "Review {$review->id} -> {$res->guest->full_name} / room {$res->room->number} (reservation #{$res->id})" . PHP_EOL;
}
