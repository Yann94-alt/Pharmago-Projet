<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ordonnance extends Model
{
     protected $fillable = [
        'user_id', 'fichier','date_prescription', 'statut',
    ];
    protected $casts = [
        'date_prescription' => 'date',
    ];
    public function user()
    {
        return $this->belongsTo(User::class);
    }
    public function reservations()
    {
        return $this->hasMany(Reservation::class);
    }
}
