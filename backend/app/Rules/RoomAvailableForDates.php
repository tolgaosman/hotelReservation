<?php

namespace App\Rules;

use App\Services\ReservationService;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Carbon;

class RoomAvailableForDates implements ValidationRule
{
    public function __construct(
        private readonly int $roomId,
        private readonly string $checkIn,
        private readonly string $checkOut,
        private readonly ?int $excludeReservationId = null,
    ) {
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $service = app(ReservationService::class);

        if ($service->hasConflict($this->roomId, Carbon::parse($this->checkIn), Carbon::parse($this->checkOut), $this->excludeReservationId)) {
            $fail('Bu oda seçilen tarihlerde başka bir aktif rezervasyona sahip.');
        }
    }
}
