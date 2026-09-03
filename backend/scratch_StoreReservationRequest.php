<?php

namespace App\Http\Requests;

use App\Enums\RoomStatus;
use App\Models\Room;
use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Foundation\Http\FormRequest;

class StoreReservationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'roomId' => ['required', 'integer', 'exists:rooms,id'],
            'checkIn' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'checkOut' => ['required', 'date_format:Y-m-d', 'after:checkIn'],
            'guestCount' => ['required', 'integer', 'min:1', 'max:10'],
            'note' => ['nullable', 'string', 'max:1000'],

            'guest' => ['required', 'array'],
            'guest.fullName' => ['required', 'string', 'max:255'],
            'guest.phone' => ['required', 'string', 'max:30'],
            'guest.email' => ['nullable', 'email', 'max:255'],
            'guest.identityNumber' => ['required', 'string', 'max:50'],
            'guest.country' => ['nullable', 'string', 'max:100'],
            
            'addonIds' => ['nullable', 'array'],
            'addonIds.*' => ['integer', 'exists:addons,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'roomId.required' => 'Oda seçimi zorunludur.',
            'roomId.exists' => 'Seçilen oda bulunamadı.',
            'checkIn.required' => 'Giriş tarihi zorunludur.',
            'checkIn.after_or_equal' => 'Giriş tarihi bugünden önce olamaz.',
            'checkOut.required' => 'Çıkış tarihi zorunludur.',
            'checkOut.after' => 'Çıkış tarihi, giriş tarihinden sonra olmalıdır.',
            'guestCount.required' => 'Misafir sayısı zorunludur.',
            'guestCount.min' => 'En az 1 misafir olmalıdır.',
            'guest.fullName.required' => 'Ad soyad zorunludur.',
            'guest.phone.required' => 'Telefon numarası zorunludur.',
            'guest.email.email' => 'Geçerli bir e-posta adresi giriniz.',
            'guest.identityNumber.required' => 'TC Kimlik / Pasaport No zorunludur.',
        ];
    }

    public function withValidator(ValidatorContract $validator): void
    {
        $validator->after(function (ValidatorContract $validator) {
            $roomId = $this->input('roomId');
            if (! $roomId) {
                return;
            }

            $room = Room::find($roomId);
            if (! $room) {
                return;
            }

            if (! in_array($room->status, [RoomStatus::Available, RoomStatus::Occupied], true)) {
                $validator->errors()->add('roomId', 'Bu oda tipi şu anda rezervasyona kapalı.');
            }

            $guestCount = (int) $this->input('guestCount');
            if ($guestCount > 0 && $guestCount > $room->capacity) {
                $validator->errors()->add('guestCount', 'Misafir sayısı bu oda tipinin kapasitesini aşıyor.');
            }
        });
    }
}
