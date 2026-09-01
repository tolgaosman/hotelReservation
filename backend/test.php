<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$request = Illuminate\Http\Request::create('/api/audit-logs', 'GET');
$request->headers->set('Accept', 'application/json');

// Get first user
$user = App\Models\User::first();
$request->setUserResolver(function() use ($user) { return $user; });

$response = $kernel->handle($request);
echo "STATUS: " . $response->getStatusCode() . "\n";
echo "BODY: " . substr($response->getContent(), 0, 1000) . "\n";
