<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $response = Illuminate\Support\Facades\Http::timeout(10)->withoutVerifying()->get('https://www.mb.gov.ct.tr/kur/gunluk.xml');
    echo "Success: " . ($response->successful() ? 'Yes' : 'No') . "\n";
    echo "Status: " . $response->status() . "\n";
    $xml = simplexml_load_string($response->body());
    if ($xml === false) {
        echo "Failed to parse XML\n";
    } else {
        echo "Parsed successfully\n";
    }
} catch (Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
}
