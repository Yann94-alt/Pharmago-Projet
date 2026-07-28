<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PharmacyInvitation extends Model
{
    use HasFactory;


    protected $table = 'pharmacy_invitations';


    protected $fillable = [
        'email',
        'token',
        'role',
        'expires_at',
        'used_at',
        'created_by',
    ];


    protected $casts = [
        'expires_at' => 'datetime',
        'used_at'    => 'datetime',
    ];


    /**
     * Admin qui a créé l'invitation
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }


    /**
     * Vérifie si le lien est encore valide
     */
    public function isValid()
    {
        return !$this->used_at 
            && (!$this->expires_at || $this->expires_at->isFuture());
    }
}