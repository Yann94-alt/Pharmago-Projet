<?php

namespace App\Providers;
use App\Models\Pharmacie;
use App\Models\pharmacies;
use App\Policies\PharmaciePolicy;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Schema; // ← ajoute ça

class AppServiceProvider extends ServiceProvider
{
    public function register()
    {
        //
    }
    public function boot()
    {
        Schema::defaultStringLength(191); 
    }
}
