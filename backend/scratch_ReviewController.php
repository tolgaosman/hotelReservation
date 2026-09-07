<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function index()
    {
        return Review::with('reservation.guest')
            ->where('is_approved', true)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'reservation_id' => 'required|exists:reservations,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string',
        ]);
        
        // MÃ¼ÅŸterinin kendi rezervasyonuna yorum yapabilmesi iÃ§in yetki kontrolÃ¼ yapÄ±labilir,
        // ÅŸimdilik basit tutuyoruz. (Guest user ID vs.)
        
        $review = Review::create($validated);
        return response()->json($review, 201);
    }
}
