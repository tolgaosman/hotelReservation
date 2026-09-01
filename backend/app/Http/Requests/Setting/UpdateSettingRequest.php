<?php

namespace App\Http\Requests\Setting;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'tax_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'check_in_time' => ['required', 'date_format:H:i'],
            'check_out_time' => ['required', 'date_format:H:i'],
        ];
    }
}
