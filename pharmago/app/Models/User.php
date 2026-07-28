<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use  HasFactory, Notifiable;

    /*
    |--------------------------------------------------------------------------
    | Champs remplissables
    |--------------------------------------------------------------------------
    */
    protected $fillable = [
        'nom',
        'prenom',
        'email',
        'password',
        'telephone',
        'role',
        'date_naissance',
        'lieu_naissance',
        'photo',
        'carte_identite',
        'numero_assurance',
    ];

    /*
    |--------------------------------------------------------------------------
    | Champs cachés
    |--------------------------------------------------------------------------
    */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /*
    |--------------------------------------------------------------------------
    | Casts
    |--------------------------------------------------------------------------
    */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    /*
    |--------------------------------------------------------------------------
    | JWT
    |--------------------------------------------------------------------------
    */

    // Identifiant JWT
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    // Claims personnalisés JWT
    public function getJWTCustomClaims()
    {
        return [];
    }

    /*
    |--------------------------------------------------------------------------
    | Relations
    |--------------------------------------------------------------------------
    */

    // Patient
   

    // Pharmacie
    public function pharmacie()
    {
        return $this->hasOne(Pharmacies::class,'user_id');
    }

    // Médecin
    

    // Réservations
    public function reservations()
    {
        return $this->hasMany(Reservation::class);
    }

    // Ordonnances
    public function ordonnances()
    {
        return $this->hasMany(Ordonnance::class);
    }

    // Assurances
    public function assurances()
    {
        return $this->hasMany(Assurance::class);
    }

    // Notifications
    public function notifications()
    {
        return $this->hasMany(notifications::class);
    }
    
}