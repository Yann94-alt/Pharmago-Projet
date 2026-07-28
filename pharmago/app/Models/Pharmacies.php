<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Models\Reservation;
use App\Models\Medicament;
use App\Models\Facture;

class Pharmacies extends Model
{
    protected $fillable = [
        'user_id',
        'nom',
        'adresse',
        'telephone',
        'email',
        'latitude',
        'longitude',
        'est_de_garde',
        'description',
        'is_active',
         'ville',
    ];

    protected $casts = [
        'est_de_garde' => 'boolean',
        'is_active'   => 'boolean',
        'latitude'    => 'float',
        'longitude'   => 'float',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
    public function gardes()
{
    return $this->hasMany(Garde::class, 'pharmacie_id');
}

    public function reservations()
    {
        return $this->hasMany(Reservation::class);
    }

    public function medicaments()
    {
        return $this->belongsToMany(
            Medicament::class,
            'pharmacy_medicament', // ⚠️ vérifier nom exact table
            'pharmacy_id',
            'medicament_id'
        )
        ->withPivot('prix', 'stock')
        ->withTimestamps();
    }

    public function factures()
    {
        return $this->hasMany(Facture::class);
    }
}