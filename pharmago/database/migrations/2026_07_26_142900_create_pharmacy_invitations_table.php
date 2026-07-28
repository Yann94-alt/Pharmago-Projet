<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pharmacy_invitations', function (Blueprint $table) {

            $table->id();

            // Email de la pharmacie invitée
            $table->string('email');

            // Token unique du lien
            $table->string('token')->unique();

            // Type d'invitation
            $table->string('role')->default('pharmacie');

            // Date d'expiration du lien
            $table->timestamp('expires_at')->nullable();

            // Si utilisé, on garde la date
            $table->timestamp('used_at')->nullable();

            // Admin qui a créé l'invitation
            $table->foreignId('created_by')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->timestamps();

        });
    }


    public function down(): void
    {
        Schema::dropIfExists('pharmacy_invitations');
    }
};