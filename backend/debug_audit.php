<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->bootstrap();

Illuminate\Support\Facades\Auth::loginUsingId(1);

$controller = new App\Http\Controllers\AuditLogController();
$request = Illuminate\Http\Request::create('/api/audit-logs', 'GET');
$request->setUserResolver(function () {
    return Illuminate\Support\Facades\Auth::user();
});

$response = $controller->index($request);
echo json_encode($response->getData(true));
