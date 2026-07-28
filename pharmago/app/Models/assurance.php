<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class assurance extends Model
{
     protected $fillable = [
        'user_id', 'compagnie', 'numero_police', 'fichier',
        'date_expiration', 'is_active',
    ];
    protected $casts = [
        'date_expiration' => 'date',
        'is_active' => 'boolean',
    ];
    public function user()
    {
        return $this->belongsTo(User::class); 
    }
    public function reservations()
    {
        return $this->hasMany(reservations::class);
    }
    public function bonsAssurance()
    {
        return $this->hasMany(bon_assurance::class);
    }
}
