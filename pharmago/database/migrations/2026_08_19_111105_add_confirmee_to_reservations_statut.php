<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("
            ALTER TABLE reservations
            MODIFY statut ENUM(
                'en_attente',
                'acceptee',
                'confirmee',
                'prete',
                'remise',
                'annulee'
            )
            NOT NULL DEFAULT 'en_attente'
        ");
    }

    public function down(): void
    {
        DB::statement("
            ALTER TABLE reservations
            MODIFY statut ENUM(
                'en_attente',
                'acceptee',
                'prete',
                'remise',
                'annulee'
            )
            NOT NULL DEFAULT 'en_attente'
        ");
    }
};