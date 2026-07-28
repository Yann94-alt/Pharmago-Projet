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
        Schema::create('bon_assurances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reservation_id')->constrained('reservations')
->onDelete('cascade');
            $table->foreignId('assurance_id')->nullable()->constrained('assurances')
->onDelete('set null');
            $table->string('nom_beneficiaire');
            $table->decimal('montant_pris_en_charge', 10, 2)->default(0);
            $table->decimal('montant_restant', 10, 2)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bon_assurances');
    }
};
