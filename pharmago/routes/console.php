<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');


/*
|--------------------------------------------------------------------------
| Pharmacies de garde
|--------------------------------------------------------------------------
|
| Tous les samedis à 00h00 :
| récupération du nouveau planning.
|
*/

Schedule::command('pharmacies:scrape-garde')
    ->weeklyOn(6, '00:00');


/*
|--------------------------------------------------------------------------
| Géocodage
|--------------------------------------------------------------------------
|
| Tous les samedis à 01h00 :
| récupération des coordonnées GPS
| des nouvelles pharmacies.
|
*/

Schedule::command('pharmacies:annuaire-geocode')
    ->weeklyOn(6, '01:00');


/*
|--------------------------------------------------------------------------
| Médicaments
|--------------------------------------------------------------------------
|
| Le premier jour de chaque mois à 04h00.
|
*/

Schedule::command('medicaments:import')
    ->monthlyOn(1, '04:00');