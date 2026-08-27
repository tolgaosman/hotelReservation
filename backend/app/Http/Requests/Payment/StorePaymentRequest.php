<?php

namespace App\Http\Requests\Payment;

use App\Enums\PaymentMethod;
use App\Models\Reservation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StorePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', \App\Models\Payment::class);
    }

    public function rules(): array
    {
        return [
            'reservation_id' => ['required', 'integer', 'exists:reservations,id'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'method' => ['required', Rule::enum(PaymentMethod::class)],
            'note' => ['nullable', 'string'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if ($validator->errors()->has('reservation_id') || $validator->errors()->has('amount')) {
                return;
            }

            $reservation = Reservation::find($this->input('reservation_id'));

            if (! $reservation) {
                return;
            }

            $service = app(\App\Services\PaymentService::class);

            if ($service->wouldExceedBalance($reservation, (float) $this->input('amount'))) {
                $validator->errors()->add('amount', 'Ödeme tutarı, rezervasyonun kalan bakiyesini aşamaz.');
            }
        });
    }
}
