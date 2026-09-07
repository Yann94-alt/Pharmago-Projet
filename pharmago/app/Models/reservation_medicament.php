<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class reservation_medicament extends Model
{
    protected $table = 'reservation_medicament';

    protected $fillable = [
        'reservation_id',
        'medicament_id',
        'quantite',
        'prix_unitaire',
        'disponible',
        'sur_bon',
    ];

    protected $casts = [
        'quantite' => 'integer',
        'prix_unitaire' => 'decimal:2',
        'disponible' => 'boolean',
        'sur_bon' => 'boolean',
    ];

    public function reservation()
    {
        return $this->belongsTo(
            Reservation::class,
            'reservation_id'
        );
    }

    public function medicament()
    {
        return $this->belongsTo(
            Medicament::class,
            'medicament_id'
        );
    }
}