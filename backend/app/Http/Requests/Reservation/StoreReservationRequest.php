<?php

namespace App\Http\Requests\Reservation;

use App\Enums\RoomStatus;
use App\Models\Reservation;
use App\Models\Room;
use App\Rules\RoomAvailableForDates;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreReservationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Reservation::class);
    }

    public function rules(): array
    {
        return [
            'guest_id' => ['required', 'integer', 'exists:guests,id'],
            'room_id' => ['required', 'integer', 'exists:rooms,id'],
            'check_in' => ['required', 'date', 'after_or_equal:today'],
            'check_out' => ['required', 'date', 'after:check_in'],
            'guest_count' => ['required', 'integer', 'min:1'],
            'companions' => ['sometimes', 'array'],
            'companions.*' => ['integer', 'distinct', 'exists:guests,id', 'different:guest_id'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $room = Room::find($this->input('room_id'));

            if (! $room) {
                return;
            }

            // `active` was replaced by status=passive when the room status
            // enum gained a Passive case (see
            // 2026_09_01_090301_modify_rooms_status_add_passive) â€” the
            // column no longer exists, so this must check status instead.
            if ($room->status === RoomStatus::Passive || $room->status === RoomStatus::Maintenance) {
                $validator->errors()->add('room_id', 'Bu oda pasif veya bakÄ±mda, rezervasyon oluÅŸturulamaz.');

                return;
            }

            if ($this->input('guest_count') > $room->capacity) {
                $validator->errors()->add('guest_count', 'Misafir sayÄ±sÄ± odanÄ±n kapasitesini aÅŸamaz.');
            }

            $companionCount = count($this->input('companions', []));
            if ($companionCount + 1 > $this->input('guest_count')) {
                $validator->errors()->add('companions', 'Misafir sayÄ±sÄ±, ana misafir dahil belirtilen kiÅŸi sayÄ±sÄ±ndan az olamaz.');
            }

            (new RoomAvailableForDates(
                $room->id,
                $this->input('check_in'),
                $this->input('check_out'),
            ))->validate('room_id', $room->id, fn (string $message) => $validator->errors()->add('room_id', $message));
        });
    }
}
