<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// List endpoints filter/sort on these columns directly (not just via the
// existing reservations(room_id, status, check_in, check_out) composite,
// whose leading column is room_id) — EXPLAIN showed full table scans + filesort.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->index('status');
            $table->index('check_in');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->index('created_at');
        });

        Schema::table('room_services', function (Blueprint $table) {
            $table->index('created_at');
        });

        Schema::table('employees', function (Blueprint $table) {
            $table->index('status');
            $table->index('full_name');
        });
    }

    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['check_in']);
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex(['created_at']);
        });

        Schema::table('room_services', function (Blueprint $table) {
            $table->dropIndex(['created_at']);
        });

        Schema::table('employees', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['full_name']);
        });
    }
};
