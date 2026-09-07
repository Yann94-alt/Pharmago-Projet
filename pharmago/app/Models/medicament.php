<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class medicament extends Model
{
     protected $fillable = [
        'nom', 'description', 'prix_marche', 'categorie', 'unite',
    ];
   public function pharmacies()
{
    return $this->belongsToMany(
        Pharmacies::class,
        'pharmacy_medicament',
        'medicament_id',
        'pharmacy_id'
    )
    ->withPivot('prix', 'stock')
    ->withTimestamps();
}  public function reservations()
    {
        return $this->belongsToMany(
            Reservation::class,
            'reservation_medicament',
            'medicament_id',
            'reservation_id'
        )
        ->withPivot([
            'quantite',
            'prix_unitaire',
        ])
        ->withTimestamps();
    }
}

 

    