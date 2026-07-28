<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Patient extends Model
{
    protected $fillable = ['user_id','prenom','telephone','num_assurance'];
    
    public function user()
{
    return $this->belongsTo(User::class);
}
}
