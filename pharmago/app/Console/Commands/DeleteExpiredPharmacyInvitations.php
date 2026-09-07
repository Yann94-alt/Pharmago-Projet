<?php

namespace App\Console\Commands;

use App\Models\PharmacyInvitation;
use Illuminate\Console\Command;

class DeleteExpiredPharmacyInvitations extends Command
{
    protected $signature = 'pharmacy-invitations:clean';

    protected $description = 'Supprime les invitations pharmacie expirées';

    public function handle()
    {
        $deleted = PharmacyInvitation::whereNotNull('expires_at')
            ->where('expires_at', '<', now())
            ->delete();

        $this->info("{$deleted} invitation(s) expirée(s) supprimée(s).");

        return Command::SUCCESS;
    }
}
