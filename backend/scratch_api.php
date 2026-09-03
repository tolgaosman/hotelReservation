<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\GoogleAuthController;
use App\Http\Controllers\Api\ReservationController;
use App\Http\Controllers\Api\RoomController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\AddonController;
use App\Http\Controllers\Api\ReviewController;
use Illuminate\Support\Facades\Route;

Route::middleware('throttle:60,1')->group(function () {
    Route::get('settings', [SettingController::class, 'show']);
    Route::get('rooms', [RoomController::class, 'index']);
    Route::get('rooms/{roomTypeContent:slug}', [RoomController::class, 'show']);
    Route::post('search', [SearchController::class, 'store']);
    
    // Yorumlar ana sayfada (veya her yerde) public olarak listelenebilir.
    Route::get('reviews', [ReviewController::class, 'index']);
    
    // Rezervasyon esnasında ekstra hizmetleri çekmek için
    Route::get('addons', [AddonController::class, 'index']);

    // Rezervasyon, hesabı guest kaydına bağlayabilmek için giriş yapmış bir
    // müşteri gerektirir — BookingFlow zaten girişi zorunlu tutuyor.
    Route::middleware(['throttle:10,1', 'auth.customer'])->group(function () {
        Route::post('reservations', [ReservationController::class, 'store']);
        Route::put('reservations/{reservation}', [ReservationController::class, 'update']);
        Route::post('reservations/{reservation}/cancel', [ReservationController::class, 'cancel']);
        
        // Sadece giriş yapmış müşteri yorum bırakabilir
        Route::post('reviews', [ReviewController::class, 'store']);
    });

    // Profil ekranındaki "Rezervasyonlarım" listesi.
    Route::get('reservations', [ReservationController::class, 'index'])
        ->middleware('auth.customer');

    // Müşteri kayıt/giriş — admin panelin employee auth'undan tamamen
    // ayrı (bkz. AuthController). Admin panel giriş bilgileri burada
    // geçerli değildir.
    Route::prefix('auth')->middleware('throttle:20,1')->group(function () {
        Route::post('register', [AuthController::class, 'register']);
        Route::post('login', [AuthController::class, 'login']);

        // "Google ile devam et" — tam sayfa yönlendirmesiyle çalışır (fetch
        // değil), bu yüzden auth.customer gerektirmez ve throttle:20,1'e tabidir.
        Route::get('google/redirect', [GoogleAuthController::class, 'redirect']);
        Route::get('google/callback', [GoogleAuthController::class, 'callback']);

        Route::middleware('auth.customer')->group(function () {
            Route::post('logout', [AuthController::class, 'logout']);
            Route::get('me', [AuthController::class, 'me']);
            Route::put('profile', [AuthController::class, 'updateProfile']);
        });
    });
});
