<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GardePharmacie extends Model
{
    protected $fillable = [
        'ville',
    'nom',
    'telephone',
    'adresse',
    'latitude',
    'longitude',
    'date_debut',
    'date_fin',
    'source',
    ];


    protected $casts = [
        'date_debut' => 'date',
        'date_fin' => 'date',
    ];
}