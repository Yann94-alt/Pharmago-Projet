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
        Schema::create('pharmacies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('nom');
            $table->string('adresse');
            $table->string('telephone');
             $table->string('description')->nullable(); 
             $table->string('email')->unique(); 
             $table->decimal('latitude', 10, 7)->nullable();
             $table->decimal('longitude', 10, 7)->nullable();
             $table->boolean('est_de_garde')->default(false);
             $table->boolean('is_active')->default(true);  
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pharmacies');
    }
};
