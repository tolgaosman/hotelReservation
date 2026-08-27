<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GuestController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ReservationController;
use App\Http\Controllers\RoomController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::apiResource('rooms', RoomController::class)->except(['destroy']);
    Route::patch('rooms/{room}/deactivate', [RoomController::class, 'deactivate']);
    Route::patch('rooms/{room}/activate', [RoomController::class, 'activate']);
    Route::get('rooms/{room}/availability', [RoomController::class, 'availability']);

    Route::apiResource('guests', GuestController::class)->except(['destroy']);
    Route::get('guests/{guest}/reservations', [GuestController::class, 'reservations']);

    Route::apiResource('reservations', ReservationController::class)->except(['destroy']);
    Route::post('reservations/{reservation}/confirm', [ReservationController::class, 'confirm']);
    Route::post('reservations/{reservation}/cancel', [ReservationController::class, 'cancel']);
    Route::post('reservations/{reservation}/check-in', [ReservationController::class, 'checkIn']);
    Route::post('reservations/{reservation}/check-out', [ReservationController::class, 'checkOut']);
    Route::get('reservations/{reservation}/payments', [ReservationController::class, 'payments']);

    Route::get('payments', [PaymentController::class, 'index']);
    Route::post('payments', [PaymentController::class, 'store']);

    Route::get('dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('dashboard/today', [DashboardController::class, 'today']);
    Route::get('dashboard/revenue', [DashboardController::class, 'revenue']);
});
