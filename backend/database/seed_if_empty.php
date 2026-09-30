<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

if (\App\Models\User::count() === 0) {
    echo "Database empty. Seeding mock dataset...\n";
    try {
        \Illuminate\Support\Facades\Artisan::call('db:seed', ['--force' => true]);
        $output = \Illuminate\Support\Facades\Artisan::output();
        file_put_contents(__DIR__.'/../storage/logs/seeder_output.log', $output);
        echo "Seeding complete.\n";
    } catch (\Throwable $e) {
        $error = (string)$e;
        echo "Seeding failed! Error: $error\n";
        file_put_contents(__DIR__.'/../storage/logs/seeder_error.log', $error);
    }
} else {
    echo "Database not empty. Skipping seed.\n";
}
