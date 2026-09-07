<?php

namespace App\Models;

use App\Enums\UserRole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'role_id',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
        ];
    }

    public function isAdmin(): bool
    {
        return $this->role === UserRole::Admin;
    }

    // Named distinctly from the `role` enum attribute/column above â€” Eloquent
    // would otherwise never reach this relation via property access since the
    // real "role" column takes precedence over a same-named relation method.
    public function permissionRole(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    /** Admins bypass the granular permission catalog entirely. */
    public function hasPermission(string $key): bool
    {
        if ($this->isAdmin()) {
            return true;
        }

        return $this->permissionRole?->permissions()->where('key', $key)->exists() ?? false;
    }

    /** All permission keys granted to this user, for embedding in /me responses. */
    public function permissionKeys(): array
    {
        if ($this->isAdmin()) {
            return Permission::query()->pluck('key')->all();
        }

        return $this->permissionRole?->permissions()->pluck('key')->all() ?? [];
    }
}
