<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('rooms', 'room_type_id')) {
            Schema::table('rooms', function (Blueprint $table) {
                $table->foreignId('room_type_id')->nullable()->after('type')
                    ->constrained('room_types')->nullOnDelete();
            });
        }

        // Backfill a room_types row per distinct legacy `type` string found
        // in the data (not a hardcoded list, so an unexpected type isn't
        // silently dropped), then link every room to it. Keyed by name via
        // updateOrInsert/where so a re-run after a partial failure is safe —
        // MySQL DDL isn't transactional.
        $types = DB::table('rooms')->whereNotNull('type')->distinct()->pluck('type');

        foreach ($types as $type) {
            $rooms = DB::table('rooms')->where('type', $type)->get(['capacity', 'nightly_rate', 'amenities']);

            $amenities = $rooms
                ->flatMap(fn ($r) => json_decode($r->amenities ?? '[]', true) ?? [])
                ->unique()
                ->values()
                ->all();

            DB::table('room_types')->updateOrInsert(
                ['name' => $type],
                [
                    'capacity' => $rooms->max('capacity') ?? 1,
                    'nightly_rate' => $rooms->max('nightly_rate') ?? 0,
                    'amenities' => json_encode($amenities),
                    'active' => true,
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );

            $roomTypeId = DB::table('room_types')->where('name', $type)->value('id');

            DB::table('rooms')->where('type', $type)->update(['room_type_id' => $roomTypeId]);
        }
    }

    public function down(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->dropConstrainedForeignId('room_type_id');
        });
    }
};
