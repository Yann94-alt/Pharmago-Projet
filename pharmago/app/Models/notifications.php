<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class notifications extends Model
{
      protected $fillable = [
        'user_id', 'titre', 'message', 'type', 'lu', 'data',
    ];
    protected $casts = [
        'lu' => 'boolean',
        'data' => 'array',
    ];
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
