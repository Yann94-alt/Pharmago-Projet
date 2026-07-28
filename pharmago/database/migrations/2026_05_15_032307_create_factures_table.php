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
        Schema::create('factures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reservation_id')->constrained('reservations')
->onDelete('cascade');
            $table->foreignId('pharmacie_id')->constrained('pharmacies')->onDelete('cascade');
            $table->foreignId('bon_assurance_id')->nullable()->constrained('bon_assurance')
->onDelete('set null');
            $table->decimal('montant_total', 10, 2);
            $table->decimal('montant_assurance', 10, 2)->default(0);
            $table->decimal('montant_patient', 10, 2);
            $table->string('numero_facture')->unique();
            $table->enum('statut', ['generee', 'envoyee', 'payee'])->default('generee');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('factures');
    }
};
