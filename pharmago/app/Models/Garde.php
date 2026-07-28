<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Garde extends Model
{
    protected $fillable = [
        'pharmacie_id',
        'date_debut',
        'date_fin',
        'source',
    ];


    public function pharmacie()
    {
        return $this->belongsTo(Pharmacies::class);
    }
}