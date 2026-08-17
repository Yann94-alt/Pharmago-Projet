<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Beneficiaire extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'nom',
        'prenom',
        'date_naissance',
    ];

    protected $casts = [
        'date_naissance' => 'date',
    ];

    /**
     * Le bénéficiaire appartient à un patient.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Les réservations faites pour ce bénéficiaire.
     */
    public function reservations()
    {
        return $this->hasMany(Reservation::class);
    }
}