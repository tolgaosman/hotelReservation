<?php

namespace App\Http\Requests\Role;

use App\Enums\Department;
use App\Models\Role;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('role'));
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100', Rule::unique('roles', 'name')->ignore($this->route('role'))],
            'description' => ['nullable', 'string', 'max:2000'],
            'department' => ['nullable', Rule::enum(Department::class)],
            'permission_ids' => ['sometimes', 'array'],
            'permission_ids.*' => ['integer', 'exists:permissions,id'],
        ];
    }

    // See StoreRoleRequest::withValidator() — same derived-slug collision guard.
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if ($validator->errors()->has('name') || ! $this->filled('name')) {
                return;
            }

            $slug = Str::slug($this->input('name'));
            $role = $this->route('role');
            if (Role::query()->where('slug', $slug)->where('id', '!=', $role->id)->exists()) {
                $validator->errors()->add('name', 'Bu isim mevcut bir rolle aynı kısa koda (slug) dönüşüyor, farklı bir isim seçin.');
            }
        });
    }
}
