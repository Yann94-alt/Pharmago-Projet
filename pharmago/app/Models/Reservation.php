<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reservation extends Model
{
     protected $fillable = [
        'user_id', 'pharmacie_id', 'ordonnance_id', 'assurance_id',
        'statut', 'carte_identite', 'note', 'date_souhaitee',
    ];
    protected $casts = [
        'date_souhaitee' => 'datetime',
    ];
    public function user()
    {
        return $this->belongsTo(User::class);
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
            'reservation_medicament'
        )->withPivot('quantite', 'prix_unitaire')
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

