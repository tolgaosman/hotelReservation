<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // SQLite doesn't fully support dropping foreign keys in a single alter,
        // but Laravel 11+ handles it better. We'll add the new columns first.
        Schema::table('reviews', function (Blueprint $table) {
            $table->dropForeign(['reservation_id']);
            $table->dropColumn('reservation_id');
            
            $table->foreignId('room_id')->after('id')->constrained('rooms')->cascadeOnDelete();
            $table->string('guest_name')->after('room_id');
        });
    }

    public function down(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->dropForeign(['room_id']);
            $table->dropColumn(['room_id', 'guest_name']);
            
            $table->foreignId('reservation_id')->constrained('reservations')->cascadeOnDelete();
        });
    }
};
