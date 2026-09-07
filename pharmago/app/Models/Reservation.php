<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reservation extends Model
{
    protected $fillable = [
        'user_id',
        'beneficiaire_id',
        'pharmacie_id',
        'ordonnance_id',
        'assurance_id',
        'carte_assurance',
        'bon',
        'statut',
        'carte_identite',
        'note',
        'date_souhaitee',
        'montant_total',
        'montant_assurance',
        'reste_patient',
    ];

    protected $casts = [
        'date_souhaitee' => 'datetime',
        'montant_total' => 'decimal:2',
        'montant_assurance' => 'decimal:2',
        'reste_patient' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function beneficiaire()
    {
        return $this->belongsTo(Beneficiaire::class);
    }

    public function pharmacie()
    {
        return $this->belongsTo(Pharmacies::class);
    }

    public function ordonnance()
    {
        return $this->belongsTo(Ordonnance::class);
    }

    public function assurance()
    {
        return $this->belongsTo(Assurance::class);
    }

    public function medicaments()
    {
        return $this->belongsToMany(
            Medicament::class,
            'reservation_medicament',
            'reservation_id',
            'medicament_id'
        )
        ->withPivot([
    'quantite',
    'prix_unitaire',
    'disponible',
    'sur_bon',
])
        
        ->withTimestamps();
    }

    public function facture()
    {
        return $this->hasOne(Facture::class);
    }

    public function qrCode()
    {
        return $this->hasOne(QrCode::class);
    }

    public function bonAssurance()
    {
        return $this->hasOne(bon_assurances::class);
    }
}