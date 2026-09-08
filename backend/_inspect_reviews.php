<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$reviews = App\Models\Review::with('room')->get(['id','room_id','guest_name','rating','is_approved']);
foreach ($reviews as $r) {
    echo $r->id . ' | room:' . ($r->room->number ?? '?') . ' | ' . $r->guest_name . ' | rating:' . $r->rating . ' | approved:' . ($r->is_approved ? 'Y' : 'N') . PHP_EOL;
}
echo "Total: " . $reviews->count() . PHP_EOL;
