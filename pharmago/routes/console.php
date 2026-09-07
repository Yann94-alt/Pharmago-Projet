<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

/*
|--------------------------------------------------------------------------
| Commande de test Laravel
|--------------------------------------------------------------------------
*/

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');


/*
|--------------------------------------------------------------------------
| PHARMACIES DE GARDE
|--------------------------------------------------------------------------
|
| Chaque samedi à 00h00 :
| 1. Récupération du nouveau planning
|
*/

Schedule::command('pharmacies:scrape-garde')
    ->weeklyOn(6, '00:00')
    ->withoutOverlapping();


/*
|--------------------------------------------------------------------------
| GEOCODAGE OPENSTREETMAP
|--------------------------------------------------------------------------
|
| Chaque samedi à 01h00 :
| géocodage des nouvelles pharmacies.
|
*/

Schedule::command('pharmacies:annuaire-geocode')
    ->weeklyOn(6, '01:00')
    ->withoutOverlapping();


/*
|--------------------------------------------------------------------------
| MEDICAMENTS
|--------------------------------------------------------------------------
|
| Le 1er de chaque mois à 04h00.
|
*/

Schedule::command('medicaments:import')
    ->monthlyOn(1, '04:00')
    ->withoutOverlapping();

Schedule::command('pharmacy-invitations:clean')
    ->everyTenMinutes();

