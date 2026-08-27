<?php

namespace App\Http\Requests\Guest;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateGuestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('guest'));
    }

    public function rules(): array
    {
        $guestId = $this->route('guest')->id;

        return [
            'full_name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['sometimes', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'identity_number' => ['sometimes', 'string', 'max:50', Rule::unique('guests', 'identity_number')->ignore($guestId)],
            'country' => ['nullable', 'string', 'max:100'],
        ];
    }
}
