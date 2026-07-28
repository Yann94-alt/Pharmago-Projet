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
        Schema::create('reservations', function (Blueprint $table) {
             $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('pharmacie_id')->constrained('pharmacies')->onDelete('cascade');
            $table->foreignId('ordonnance_id')->nullable()->constrained('ordonnances')
->onDelete('set null');
            $table->foreignId('assurance_id')->nullable()->constrained('assurances')
->onDelete('set null');
            $table->enum('statut', ['en_attente', 'acceptee', 'prete', 'remise', 'annulee'])
->default('en_attente');
            $table->string('carte_identite')->nullable(); // copie pour cette réservation
            $table->text('note')->nullable();
            $table->dateTime('date_souhaitee')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};
