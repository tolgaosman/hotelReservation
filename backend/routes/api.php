<?php

use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\GuestController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\ReservationController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\RoomController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\ExchangeRateController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:6,1');

Route::middleware(['auth:sanctum', 'throttle:120,1'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/exchange-rates', [ExchangeRateController::class, 'getRates']);

    Route::apiResource('rooms', RoomController::class)->except(['destroy']);
    Route::patch('rooms/{room}/deactivate', [RoomController::class, 'deactivate']);
    Route::patch('rooms/{room}/activate', [RoomController::class, 'activate']);
    Route::patch('rooms/{room}/housekeeping', [RoomController::class, 'updateHousekeeping']);
    Route::get('rooms/{room}/availability', [RoomController::class, 'availability']);

    Route::apiResource('guests', GuestController::class)->except(['destroy']);
    Route::get('guests/{guest}/reservations', [GuestController::class, 'reservations']);

    Route::apiResource('reservations', ReservationController::class)->except(['destroy']);
    Route::post('reservations/{reservation}/confirm', [ReservationController::class, 'confirm']);
    Route::post('reservations/{reservation}/cancel', [ReservationController::class, 'cancel']);
    Route::post('reservations/{reservation}/check-in', [ReservationController::class, 'checkIn']);
    Route::post('reservations/{reservation}/check-out', [ReservationController::class, 'checkOut']);
    Route::get('room-services', [\App\Http\Controllers\RoomServiceController::class, 'indexAll']);
    Route::get('reservations/{reservation}/room-services', [\App\Http\Controllers\RoomServiceController::class, 'index']);
    Route::post('reservations/{reservation}/room-services', [\App\Http\Controllers\RoomServiceController::class, 'store']);
    Route::delete('room-services/{roomService}', [\App\Http\Controllers\RoomServiceController::class, 'destroy']);
    Route::get('reservations/{reservation}/payments', [ReservationController::class, 'payments']);
    Route::get('reservations/{reservation}/invoice', [ReservationController::class, 'invoice']);

    Route::get('payments', [PaymentController::class, 'index']);
    Route::post('payments', [PaymentController::class, 'store']);

    Route::get('dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('dashboard/today', [DashboardController::class, 'today']);
    Route::get('dashboard/revenue', [DashboardController::class, 'revenue']);

    Route::get('permissions', [PermissionController::class, 'index']);
    Route::apiResource('roles', RoleController::class)->except(['show']);
    Route::apiResource('employees', EmployeeController::class)->except(['destroy']);

    Route::get('audit-logs', [AuditLogController::class, 'index']);

    Route::get('settings', [SettingController::class, 'show']);
    Route::put('settings', [SettingController::class, 'update']);
});
