<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');



Schedule::command('pharmacies:scrape-garde')
    ->weeklyOn(6, '00:00');

Schedule::command('pharmacies:annuaire-geocode')
    ->weeklyOn(6, '01:00');



Schedule::command('medicaments:import')
    ->monthlyOn(1, '04:00');