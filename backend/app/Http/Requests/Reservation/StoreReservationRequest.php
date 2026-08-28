<?php

namespace App\Http\Requests\Reservation;

use App\Models\Room;
use App\Rules\RoomAvailableForDates;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreReservationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', \App\Models\Reservation::class);
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

            if (! $room->active || $room->status === \App\Enums\RoomStatus::Maintenance) {
                $validator->errors()->add('room_id', 'Bu oda pasif veya bakımda, rezervasyon oluşturulamaz.');

                return;
            }

            if ($this->input('guest_count') > $room->capacity) {
                $validator->errors()->add('guest_count', 'Misafir sayısı odanın kapasitesini aşamaz.');
            }

            $companionCount = count($this->input('companions', []));
            if ($companionCount + 1 > $this->input('guest_count')) {
                $validator->errors()->add('companions', 'Misafir sayısı, ana misafir dahil belirtilen kişi sayısından az olamaz.');
            }

            (new RoomAvailableForDates(
                $room->id,
                $this->input('check_in'),
                $this->input('check_out'),
            ))->validate('room_id', $room->id, fn (string $message) => $validator->errors()->add('room_id', $message));
        });
    }
}
