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
        $table->index(['pharmacie_id', 'created_at']);
        $table->index(['pharmacie_id', 'statut']);
        $table->index(['user_id', 'created_at']);
    });
}

public function down(): void
{
    Schema::table('reservations', function (Blueprint $table) {
        $table->dropIndex(['pharmacie_id', 'created_at']);
        $table->dropIndex(['pharmacie_id', 'statut']);
        $table->dropIndex(['user_id', 'created_at']);
    });
}
};
