<?php

namespace App\Models;

use App\Events\NotificationCreated;
use Illuminate\Database\Eloquent\Model;

class notifications extends Model
{
    protected $fillable = [
        'user_id',
        'titre',
        'message',
        'type',
        'lu',
        'data',
    ];

    protected $casts = [
        'lu' => 'boolean',
        'data' => 'array',
    ];

    protected static function booted()
    {
        static::created(function ($notification) {
            event(new NotificationCreated($notification));
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
