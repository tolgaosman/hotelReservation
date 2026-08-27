<?php

namespace App\Http\Requests\Reservation;

use App\Models\Room;
use App\Rules\RoomAvailableForDates;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateReservationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('reservation'));
    }

    public function rules(): array
    {
        return [
            'guest_id' => ['sometimes', 'integer', 'exists:guests,id'],
            'room_id' => ['sometimes', 'integer', 'exists:rooms,id'],
            'check_in' => ['sometimes', 'date'],
            'check_out' => ['sometimes', 'date', 'after:check_in'],
            'guest_count' => ['sometimes', 'integer', 'min:1'],
            'companions' => ['sometimes', 'array'],
            'companions.*' => ['integer', 'distinct', 'exists:guests,id'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $reservation = $this->route('reservation');
            $roomId = $this->input('room_id', $reservation->room_id);
            $room = Room::find($roomId);

            if (! $room) {
                return;
            }

            $guestCount = $this->input('guest_count', $reservation->guest_count);

            if ($guestCount > $room->capacity) {
                $validator->errors()->add('guest_count', 'Misafir sayısı odanın kapasitesini aşamaz.');
            }

            $guestId = $this->input('guest_id', $reservation->guest_id);
            $companions = $this->input('companions', []);
            if (in_array($guestId, $companions, false)) {
                $validator->errors()->add('companions', 'Ana misafir aynı zamanda diğer misafirler arasında olamaz.');
            } elseif (count($companions) + 1 > $guestCount) {
                $validator->errors()->add('companions', 'Misafir sayısı, ana misafir dahil belirtilen kişi sayısından az olamaz.');
            }

            $checkIn = $this->input('check_in', $reservation->check_in->toDateString());
            $checkOut = $this->input('check_out', $reservation->check_out->toDateString());

            (new RoomAvailableForDates(
                $room->id,
                $checkIn,
                $checkOut,
                $reservation->id,
            ))->validate('room_id', $room->id, fn (string $message) => $validator->errors()->add('room_id', $message));
        });
    }
}
