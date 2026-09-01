<?php

namespace App\Models;

use App\Enums\Department;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'is_system',
        'visible_professions',
        'department',
    ];

    protected $casts = [
        'is_system' => 'boolean',
        'visible_professions' => 'array',
        'department' => Department::class,
    ];

    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class);
    }

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
