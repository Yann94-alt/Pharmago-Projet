<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QrCode extends Model
{
     protected $table = 'qr_codes';
    protected $fillable = [
        'reservation_id', 'code', 'image_path', 'utilise', 'expires_at',
    ];
    protected $casts = [
        'utilise' => 'boolean',
        'expires_at' => 'datetime',
    ];
    public function reservation()
    {
        return $this->belongsTo(Reservation::class);
    }
}
