<?php

namespace App\Console\Commands;

use App\Models\Medicament;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Symfony\Component\DomCrawler\Crawler;

class ImportMedicaments extends Command
{
    /**
     * La signature et le nom de la commande Artisan.
     *
     * @var string
     */
    protected $signature = 'medicaments:import';

    /**
     * La description de la commande.
     *
     * @var string
     */
    protected $description = 'Importe la liste et le prix des médicaments depuis le site web';

    /**
     * Exécute la commande console.
     */
    public function handle()
    {
        $this->info("Récupération de la page web...");

        $url = "https://www.pharmacies-de-garde.ci/prix-des-medicaments-en-pharmacie-en-cote-divoire/";

        // Récupération de la page HTML
        $response = Http::withoutVerifying()->get($url);

        if ($response->failed()) {
            $this->error("Impossible d'accéder au site web.");
            return Command::FAILURE;
        }

        $crawler = new Crawler($response->body());
        $rows = $crawler->filter('#tablepress-1 tbody tr');

        $total = $rows->count();

        if ($total === 0) {
            $this->warn("Aucun médicament trouvé dans le tableau.");
            return Command::SUCCESS;
        }

        $this->info("{$total} lignes trouvées. Début du traitement...");
        $bar = $this->output->createProgressBar($total);
        $bar->start();

        $rows->each(function ($tr) use ($bar) {

            $td = $tr->filter('td');

            if ($td->count() >= 5) {

                $nom = trim($td->eq(2)->text());
                $categorie = trim($td->eq(3)->text());
                $prixRaw = trim($td->eq(4)->text());

                // Extraction stricte des chiffres uniquement
                $prixDigits = preg_replace('/[^0-9]/', '', $prixRaw);

                // Si un nombre valide est trouvé, on le stocke en float, sinon null
                $prixClean = (!empty($prixDigits) && (float) $prixDigits > 0) 
                    ? (float) $prixDigits 
                    : null;

                if (!empty($nom)) {
                    Medicament::updateOrCreate(
                        [
                            'nom' => $nom,
                        ],
                        [
                            'categorie' => $categorie,
                            'prix_marche' => $prixClean,
                        ]
                    );
                }
            }

            $bar->advance();
        });

        $bar->finish();
        $this->newLine();
        $this->info("Importation terminée avec succès !");

        return Command::SUCCESS;
    }
}
