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
        Schema::create('garde_pharmacies', function (Blueprint $table) {
            $table->id();

            $table->string('ville');
            $table->string('nom');
            $table->string('telephone')->nullable();
            $table->text('adresse')->nullable();

            $table->date('date_debut');
            $table->date('date_fin');

            $table->string('source')->default('UNPPCI');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('garde_pharmacies');
    }
};