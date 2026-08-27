<?php

namespace App\Services;

use App\Exceptions\DomainActionException;
use App\Models\Payment;
use App\Models\Reservation;
use Illuminate\Support\Facades\DB;

class PaymentService
{
    public function wouldExceedBalance(Reservation $reservation, float $amount): bool
    {
        return bccomp((string) ($reservation->paid_amount + $amount), (string) $reservation->total_amount, 2) > 0;
    }

    public function create(array $data): Payment
    {
        return DB::transaction(function () use ($data) {
            /** @var Reservation $reservation */
            $reservation = Reservation::query()->lockForUpdate()->findOrFail($data['reservation_id']);

            if ($this->wouldExceedBalance($reservation, (float) $data['amount'])) {
                throw new DomainActionException('Ödeme tutarı, rezervasyonun kalan bakiyesini aşamaz.');
            }

            return Payment::create([
                'reservation_id' => $reservation->id,
                'amount' => $data['amount'],
                'method' => $data['method'],
                'note' => $data['note'] ?? null,
                'created_by' => $data['created_by'] ?? null,
                'created_at' => $data['created_at'] ?? now(),
            ]);
        });
    }
}
