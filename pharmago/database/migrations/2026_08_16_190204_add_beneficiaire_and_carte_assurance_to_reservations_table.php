<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reservations', function (Blueprint $table) {

            $table->foreignId('beneficiaire_id')
                ->nullable()
                ->after('user_id')
                ->constrained('beneficiaires')
                ->nullOnDelete();

            $table->string('carte_assurance')
                ->nullable()
                ->after('assurance_id');
        });
    }

    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->dropForeign(['beneficiaire_id']);
            $table->dropColumn([
                'beneficiaire_id',
                'carte_assurance'
            ]);
        });
    }
};