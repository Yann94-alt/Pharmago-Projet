<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->decimal('montant_total', 12, 2)
                ->default(0)
                ->after('statut');

            $table->decimal('montant_assurance', 12, 2)
                ->default(0)
                ->after('montant_total');

            $table->decimal('reste_patient', 12, 2)
                ->default(0)
                ->after('montant_assurance');
        });
    }

    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->dropColumn([
                'montant_total',
                'montant_assurance',
                'reste_patient',
            ]);
        });
    }
};