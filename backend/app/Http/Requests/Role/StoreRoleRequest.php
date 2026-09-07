<?php

namespace App\Http\Requests\Role;

use App\Enums\Department;
use App\Models\Role;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Role::class);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100', 'unique:roles,name'],
            'description' => ['nullable', 'string', 'max:2000'],
            'department' => ['nullable', Rule::enum(Department::class)],
            'permission_ids' => ['sometimes', 'array'],
            'permission_ids.*' => ['integer', 'exists:permissions,id'],
        ];
    }

    // The controller derives `slug` from `name` via Str::slug() and writes it
    // to a UNIQUE column; two distinct names can slug to the same value
    // ("Garson!" / "Garson"), which would otherwise surface as a raw 500
    // instead of a 422. Catch that collision here, ahead of the insert.
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if ($validator->errors()->has('name') || ! $this->filled('name')) {
                return;
            }

            $slug = Str::slug($this->input('name'));
            if (Role::query()->where('slug', $slug)->exists()) {
                $validator->errors()->add('name', 'Bu isim mevcut bir rolle aynÄ± kÄ±sa koda (slug) dÃ¶nÃ¼ÅŸÃ¼yor, farklÄ± bir isim seÃ§in.');
            }
        });
    }
}
