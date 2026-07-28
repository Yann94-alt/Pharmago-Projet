<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class facture extends Model
{
    protected $fillable = [
        'reservation_id', 'pharmacie_id', 'bon_assurances_id',
        'montant_total', 'montant_assurance', 'montant_patient',
        'numero_facture', 'statut',
    ];
    public function reservation()
    {
        return $this->belongsTo(Reservation::class);
    }
    public function pharmacie()
    {
        return $this->belongsTo(Pharmacies::class);
    }
    public function bonAssurance()
    {
        return $this->belongsTo(bon_assurances::class);
    }
}
