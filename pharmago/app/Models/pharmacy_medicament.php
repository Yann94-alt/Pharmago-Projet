<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class PharmacyMedicament extends Pivot
{
    protected $table = 'pharmacy_medicament';

    protected $fillable = [
        'pharmacy_id',
        'medicament_id',
        'prix',
        'stock',
    ];
}