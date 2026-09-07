<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class DatasetSeeder extends Seeder
{
    public function run(): void
    {
        $jsonPath = database_path('seeders/dataset.json');
        if (! File::exists($jsonPath)) {
            $this->command->error('dataset.json not found! Please run the dump-dataset.ts script first.');

            return;
        }

        $json = File::get($jsonPath);
        $data = json_decode($json, true);

        // Maps for tracking frontend string IDs to backend integer IDs
        $roomMap = [];
        $guestMap = [];
        $reservationMap = [];

        $this->command->info('Inserting Rooms...');
        // Room types are seeded before this runs (RoomTypeSeeder, in
        // DatabaseSeeder) â€” resolve each room's type name to its id so the
        // dataset's rooms come in already linked, instead of relying on the
        // FK-backfill migration (which only runs once, on schema setup).
        $roomTypeIdsByName = DB::table('room_types')->pluck('id', 'name');

        foreach ($data['rooms'] as $room) {
            $id = DB::table('rooms')->insertGetId([
                'number' => $room['number'],
                'type' => $room['type'],
                'room_type_id' => $roomTypeIdsByName[$room['type']] ?? null,
                'capacity' => $room['capacity'],
                'nightly_rate' => $room['nightlyRate'],
                'amenities' => json_encode($room['amenities']),
                'status' => $room['status'],
                // dataset.json still carries the dataset dump's `active`
                // field, but the column itself was dropped in favor of
                // status=passive â€” every row here is active:true anyway, so
                // nothing is lost by not writing it.
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $roomMap[$room['id']] = $id;
        }

        $this->command->info('Inserting Guests...');
        foreach ($data['guests'] as $guest) {
            $id = DB::table('guests')->insertGetId([
                'full_name' => $guest['fullName'],
                'phone' => $guest['phone'],
                'email' => $guest['email'] ?? null,
                'identity_number' => $guest['identityNumber'],
                'country' => $guest['country'] ?? null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $guestMap[$guest['id']] = $id;
        }

        $this->command->info('Inserting Reservations...');
        foreach ($data['reservations'] as $res) {
            $id = DB::table('reservations')->insertGetId([
                'guest_id' => $guestMap[$res['guestId']],
                'room_id' => $roomMap[$res['roomId']],
                'check_in' => $res['checkIn'],
                'check_out' => $res['checkOut'],
                'guest_count' => $res['guestCount'],
                'status' => $res['status'],
                'total_amount' => $res['totalAmount'],
                'checked_in_at' => $res['checkedInAt'] ?? null,
                'checked_out_at' => $res['checkedOutAt'] ?? null,
                'cancelled_at' => $res['status'] === 'cancelled' ? now() : null,
                'created_at' => $res['createdAt'] ?? now(),
                'updated_at' => now(),
            ]);
            $reservationMap[$res['id']] = $id;
        }

        $this->command->info('Inserting Payments...');
        foreach ($data['payments'] as $pay) {
            DB::table('payments')->insert([
                'reservation_id' => $reservationMap[$pay['reservationId']],
                'amount' => $pay['amount'],
                'method' => $pay['method'],
                'note' => $pay['note'] ?? null,
                'created_at' => $pay['createdAt'] ?? now(),
                'updated_at' => now(),
            ]);
        }

        $this->command->info('Dataset successfully transferred!');
    }
}
