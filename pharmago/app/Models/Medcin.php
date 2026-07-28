<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Medcin extends Model
{
    protected $fillable = ['user_id','specialite','num_odre'];

    public function user(){
      return $this->belongsTo(User::class);
    }
}
