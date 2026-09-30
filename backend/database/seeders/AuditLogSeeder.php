<?php

namespace Database\Seeders;

use App\Models\AuditLog;
use App\Models\Employee;
use App\Models\Guest;
use App\Models\Payment;
use App\Models\Reservation;
use App\Models\Role;
use App\Models\Room;
use App\Models\RoomService;
use App\Models\RoomType;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class AuditLogSeeder extends Seeder
{
    private const PER_SUBJECT = 12;

    public function run(): void
    {
        if (AuditLog::exists()) {
            return;
        }

        $userIds = User::pluck('id');
        if ($userIds->isEmpty()) {
            return;
        }

        $plan = [
            [Reservation::class, ['reservation.create', 'reservation.confirm', 'reservation.check_in', 'reservation.check_out', 'reservation.cancel']],
            [Payment::class, ['payment.create']],
            [RoomService::class, ['room_service.create']],
            [Guest::class, ['guest.create', 'guest.update']],
            [Room::class, ['room.update', 'room.housekeeping_update']],
            [RoomType::class, ['room_type.update']],
            [Employee::class, ['employee.create', 'employee.update']],
            [Role::class, ['role.update']],
        ];

        $rows = [];
        foreach ($plan as [$model, $actions]) {
            $model::query()->inRandomOrder()->limit(self::PER_SUBJECT)->get()->each(
                function (Model $subject) use (&$rows, $actions, $userIds) {
                    $rows[] = [
                        'user_id' => $userIds->random(),
                        'action' => $actions[array_rand($actions)],
                        'auditable_type' => class_basename($subject),
                        'auditable_id' => $subject->getKey(),
                        'changes' => null,
                        'ip_address' => '10.0.0.'.rand(2, 60),
                        'created_at' => Carbon::now()->subMinutes(rand(5, 60 * 24 * 14)),
                    ];
                }
            );
        }

        foreach (array_chunk($rows, 100) as $chunk) {
            AuditLog::insert($chunk);
        }
    }
}
