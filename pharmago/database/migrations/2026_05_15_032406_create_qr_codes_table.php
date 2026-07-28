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
        Schema::create('qr_codes', function (Blueprint $table) {

            $table->id();

            $table->foreignId('reservation_id')
                ->constrained('reservations')
                ->onDelete('cascade');

            // token unique
            $table->string('code')->unique();

            // image QR générée
            $table->string('image_path')->nullable();

            $table->boolean('utilise')->default(false);

            $table->dateTime('expires_at')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('qr_codes');
    }
};