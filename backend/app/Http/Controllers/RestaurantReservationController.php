<?php

namespace App\Http\Controllers;

use App\Models\RestaurantReservation;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class RestaurantReservationController extends Controller
{
    public function index(): JsonResponse
    {
        $reservations = RestaurantReservation::with('reservation.guest')
            ->orderBy('date', 'desc')
            ->orderBy('time', 'desc')
            ->get();
            
        return response()->json($reservations);
    }

    public function destroy(RestaurantReservation $restaurantReservation): JsonResponse
    {
        $restaurantReservation->delete();
        
        return response()->json([
            'message' => 'Restoran rezervasyonu başarıyla silindi.'
        ]);
    }
}
