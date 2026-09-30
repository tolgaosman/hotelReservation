<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

if (\App\Models\User::count() === 0) {
    echo "Database empty. Seeding mock dataset...\n";
    \Illuminate\Support\Facades\Artisan::call('db:seed', ['--force' => true]);
    echo "Seeding complete.\n";
} else {
    echo "Database not empty. Skipping seed.\n";
}
