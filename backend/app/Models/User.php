<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens; // <--- Add this import

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable; // <--- Add HasApiTokens here

    protected $fillable = [
        'name',
        'email',
        'password',
        'role', // Make sure role is here too
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
        ];
    }
}