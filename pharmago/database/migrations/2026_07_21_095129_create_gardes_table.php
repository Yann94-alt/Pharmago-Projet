<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gardes', function (Blueprint $table) {

            $table->id();

            // Relation avec la pharmacie
            $table->foreignId('pharmacie_id')
                ->constrained('pharmacies')
                ->cascadeOnDelete();

            // Période de garde
            $table->date('date_debut');
            $table->date('date_fin');

            // Optionnel : pour savoir d'où vient la donnée
            $table->string('source')->nullable();

            $table->timestamps();

        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gardes');
    }
};