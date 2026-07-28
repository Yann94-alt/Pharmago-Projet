<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class bon_assurances extends Model
{
     protected $table = 'bon_assurances';
    protected $fillable = [
        'reservation_id', 'assurance_id', 'nom_beneficiaire',
        'montant_pris_en_charge', 'montant_restant',
    ];
    public function reservation()
    {
        return $this->belongsTo(Reservation::class);
    }
    public function assurance()
    {
        return $this->belongsTo(Assurance::class);
    }
}

