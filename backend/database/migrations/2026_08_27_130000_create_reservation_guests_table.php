<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Companions: other people staying in the room alongside the
        // reservation's primary guest. Informational only — the reservation
        // itself always belongs to exactly one guest/room.
        Schema::create('reservation_guests', function (Blueprint $table) {
            $table->foreignId('reservation_id')->constrained('reservations')->cascadeOnDelete();
            $table->foreignId('guest_id')->constrained('guests')->restrictOnDelete();
            $table->timestamps();

            $table->primary(['reservation_id', 'guest_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservation_guests');
    }
};
