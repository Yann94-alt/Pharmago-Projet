<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->enum('statut', [
                'en_attente',
                'acceptee',
                'confirmee',
                'prete',
                'remise',
                'annulee',
            ])->default('en_attente')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->enum('statut', [
                'en_attente',
                'acceptee',
                'prete',
                'remise',
                'annulee',
            ])->default('en_attente')->change();
        });
    }
};