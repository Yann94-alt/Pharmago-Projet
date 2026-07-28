<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');
Schedule::command('pharmacies:scrape-garde')
    ->weeklyOn(6, '05:00');
// Exécute la commande le 1er de chaque mois à 05h00 du matin
Schedule::command('medicaments:import')->monthlyOn(1, '04:00');
