<?php

namespace App\Console\Commands;

use App\Models\GardePharmacie;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class AnnuaireCiGeocodePharmacies extends Command
{
    protected $signature = 'pharmacies:annuaire-geocode
                            {--limit= : Nombre maximum de pharmacies à traiter}';

    protected $description = 'Récupère les coordonnées des pharmacies depuis AnnuaireCI';

    public function handle(): int
    {
        $limit = $this->option('limit');

        /*
        |--------------------------------------------------------------------------
        | Pharmacies à traiter
        |--------------------------------------------------------------------------
        |
        | On prend uniquement les pharmacies qui n'ont pas encore
        | leurs deux coordonnées.
        |
        */

        $query = GardePharmacie::query()
            ->where(function ($q) {
                $q->whereNull('latitude')
                  ->orWhereNull('longitude');
            })
            ->orderBy('id');

        if ($limit !== null) {
            $query->limit((int) $limit);
        }

        $pharmacies = $query->get();

        $this->info(
            "📍 Pharmacies à traiter : {$pharmacies->count()}"
        );

        if ($pharmacies->isEmpty()) {
            $this->info('✅ Toutes les pharmacies possèdent déjà leurs coordonnées.');
            return Command::SUCCESS;
        }

        $trouvees = 0;
        $nonTrouvees = 0;
        $erreurs = 0;

        foreach ($pharmacies as $pharmacie) {

            $this->newLine();

            $this->info(
                "🔎 Recherche : {$pharmacie->nom} - {$pharmacie->ville}"
            );

            try {

                $coordonnees = $this->chercherAnnuaire(
                    $pharmacie->nom,
                    $pharmacie->ville
                );

                /*
                |--------------------------------------------------------------------------
                | Coordonnées trouvées
                |--------------------------------------------------------------------------
                */

                if ($coordonnees) {

                    $pharmacie->latitude = $coordonnees['latitude'];
                    $pharmacie->longitude = $coordonnees['longitude'];

                    $pharmacie->save();

                    $trouvees++;

                    $this->info(
                        "✅ Coordonnées enregistrées : "
                        . $coordonnees['latitude']
                        . " / "
                        . $coordonnees['longitude']
                    );

                    /*
                    |--------------------------------------------------------------------------
                    | Vérification après sauvegarde
                    |--------------------------------------------------------------------------
                    */

                    $pharmacie->refresh();

                    if (
                        !is_null($pharmacie->latitude)
                        &&
                        !is_null($pharmacie->longitude)
                    ) {
                        $this->line(
                            "💾 Pharmacie {$pharmacie->id} correctement enregistrée."
                        );
                    }

                } else {

                    $nonTrouvees++;

                    $this->warn(
                        "❌ Pas trouvé : {$pharmacie->nom}"
                    );
                }

            } catch (\Throwable $e) {

                $erreurs++;

                $this->error(
                    "❌ Erreur pour {$pharmacie->nom} : "
                    . $e->getMessage()
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Petite pause entre les requêtes
            |--------------------------------------------------------------------------
            */

            sleep(1);
        }

        $this->newLine();

        $this->info('🎉 Traitement terminé.');

        $this->table(
            [
                'Statut',
                'Nombre'
            ],
            [
                [
                    'Coordonnées trouvées',
                    $trouvees
                ],
                [
                    'Non trouvées',
                    $nonTrouvees
                ],
                [
                    'Erreurs',
                    $erreurs
                ],
            ]
        );

        return Command::SUCCESS;
    }

    /**
     * Recherche les coordonnées d'une pharmacie sur AnnuaireCI.
     */
    private function chercherAnnuaire(
        ?string $nom,
        ?string $ville
    ): ?array {

        if (empty($nom)) {
            return null;
        }

        /*
        |--------------------------------------------------------------------------
        | Nettoyage du nom
        |--------------------------------------------------------------------------
        */

        $nomClean = $this->nettoyerNom($nom);

        $villeClean = trim(
            preg_replace('/\s+/', ' ', $ville ?? '')
        );

        /*
        |--------------------------------------------------------------------------
        | Plusieurs variantes de recherche
        |--------------------------------------------------------------------------
        |
        | On ne dépend plus d'un seul slug.
        |
        */

        $slugs = $this->genererSlugs(
            $nomClean,
            $villeClean
        );

        foreach ($slugs as $slug) {

            $url =
                'https://annuaireci.com/entreprises/'
                . $slug
                . '/';

            $this->line("🌐 {$url}");

            try {

                /*
                |--------------------------------------------------------------------------
                | Requête HTTP
                |--------------------------------------------------------------------------
                */

                $response = Http::timeout(15)
                    ->retry(2, 1000)
                    ->withHeaders([
                        'User-Agent' =>
                            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
                            . 'AppleWebKit/537.36 '
                            . '(KHTML, like Gecko) '
                            . 'Chrome/120 Safari/537.36',

                        'Accept' =>
                            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    ])
                    ->get($url);

                /*
                |--------------------------------------------------------------------------
                | Page inexistante
                |--------------------------------------------------------------------------
                */

                if ($response->status() === 404) {

                    $this->line(
                        "   ↪️ Page inexistante"
                    );

                    continue;
                }

                /*
                |--------------------------------------------------------------------------
                | Trop de requêtes
                |--------------------------------------------------------------------------
                */

                if ($response->status() === 429) {

                    $this->warn(
                        "⚠️ AnnuaireCI limite les requêtes."
                    );

                    sleep(5);

                    continue;
                }

                /*
                |--------------------------------------------------------------------------
                | Autre erreur HTTP
                |--------------------------------------------------------------------------
                */

                if (!$response->successful()) {

                    $this->warn(
                        "⚠️ HTTP {$response->status()}"
                    );

                    continue;
                }

                /*
                |--------------------------------------------------------------------------
                | Extraction des coordonnées
                |--------------------------------------------------------------------------
                */

                $coordonnees = $this->extraireCoordonneesJsonLd(
                    $response->body()
                );

                if ($coordonnees) {

                    return $coordonnees;
                }

            } catch (\Throwable $e) {

                $this->warn(
                    "⚠️ Erreur HTTP : {$e->getMessage()}"
                );

                continue;
            }
        }

        return null;
    }

    /**
     * Nettoie le nom de la pharmacie.
     */
    private function nettoyerNom(string $nom): string
    {
        /*
        Suppression des préfixes pharmacie.
        */

        $nom = preg_replace(
            '/\b(PHCIE|PHARMACIE)\b/iu',
            '',
            $nom
        );

        /*
        Conversion des abréviations.
        */

        $nom = str_ireplace(
            [
                'GRDE',
                'GDE',
                'NVLLE',
                'NLLE',
            ],
            [
                'GRANDE',
                'GRANDE',
                'NOUVELLE',
                'NOUVELLE',
            ],
            $nom
        );

        /*
        Nettoyage des espaces.
        */

        $nom = preg_replace(
            '/\s+/',
            ' ',
            $nom
        );

        return trim($nom);
    }

    /**
     * Génère plusieurs variantes de slug.
     */
    private function genererSlugs(
        string $nom,
        string $ville
    ): array {

        $slugs = [];

        /*
        Variante principale.
        */

        $slugs[] = $this->slugAnnuaire(
            "pharmacie {$nom} {$ville} cote divoire"
        );

        /*
        Sans "cote divoire".
        */

        $slugs[] = $this->slugAnnuaire(
            "pharmacie {$nom} {$ville}"
        );

        /*
        Sans la ville.
        */

        $slugs[] = $this->slugAnnuaire(
            "pharmacie {$nom} cote divoire"
        );

        /*
        Nom seul.
        */

        $slugs[] = $this->slugAnnuaire(
            "pharmacie {$nom}"
        );

        /*
        Suppression des doublons.
        */

        return array_values(
            array_unique(
                array_filter($slugs)
            )
        );
    }

    /**
     * Transforme un texte en slug compatible avec AnnuaireCI.
     */
    private function slugAnnuaire(string $texte): string
    {
        /*
        Suppression des accents.
        */

        $texte = iconv(
            'UTF-8',
            'ASCII//TRANSLIT//IGNORE',
            $texte
        );

        /*
        Tout en minuscule.
        */

        $texte = strtolower($texte);

        /*
        Remplacement des apostrophes.
        */

        $texte = str_replace(
            [
                "'",
                '’',
                '`',
            ],
            '-',
            $texte
        );

        /*
        Suppression des caractères spéciaux.
        */

        $texte = preg_replace(
            '/[^a-z0-9]+/',
            '-',
            $texte
        );

        /*
        Suppression des tirets multiples.
        */

        $texte = preg_replace(
            '/-+/',
            '-',
            $texte
        );

        return trim($texte, '-');
    }

    /**
     * Cherche les coordonnées dans les données JSON-LD.
     */
    private function extraireCoordonneesJsonLd(
        string $html
    ): ?array {

        /*
        Recherche des scripts JSON-LD.
        */

        preg_match_all(
            '/<script[^>]+type=["\']application\/ld\+json["\'][^>]*>(.*?)<\/script>/is',
            $html,
            $matches
        );

        if (empty($matches[1])) {
            return null;
        }

        foreach ($matches[1] as $json) {

            $json = html_entity_decode(
                $json,
                ENT_QUOTES | ENT_HTML5,
                'UTF-8'
            );

            $data = json_decode(
                trim($json),
                true
            );

            if (
                json_last_error() !== JSON_ERROR_NONE
            ) {
                continue;
            }

            /*
            Le JSON-LD peut être un objet ou un tableau.
            */

            $result = $this->chercherCoordonneesDansData(
                $data
            );

            if ($result) {
                return $result;
            }
        }

        return null;
    }

    /**
     * Recherche récursive des coordonnées.
     */
    private function chercherCoordonneesDansData(
        mixed $data
    ): ?array {

        if (!is_array($data)) {
            return null;
        }

        /*
        Vérification d'un objet Pharmacy.
        */

        $type = $data['@type'] ?? null;

        $isPharmacy = false;

        if ($type === 'Pharmacy') {
            $isPharmacy = true;
        }

        if (
            is_array($type)
            &&
            in_array('Pharmacy', $type, true)
        ) {
            $isPharmacy = true;
        }

        if ($isPharmacy) {

            $latitude =
                $data['geo']['latitude']
                ?? null;

            $longitude =
                $data['geo']['longitude']
                ?? null;

            if (
                is_numeric($latitude)
                &&
                is_numeric($longitude)
            ) {

                $latitude = (float) $latitude;
                $longitude = (float) $longitude;

                /*
                Vérification basique des coordonnées.
                */

                if (
                    $latitude >= -90
                    &&
                    $latitude <= 90
                    &&
                    $longitude >= -180
                    &&
                    $longitude <= 180
                ) {

                    return [
                        'latitude' => $latitude,
                        'longitude' => $longitude,
                    ];
                }
            }
        }

        /*
        Recherche récursive.
        */

        foreach ($data as $value) {

            if (!is_array($value)) {
                continue;
            }

            $result = $this->chercherCoordonneesDansData(
                $value
            );

            if ($result) {
                return $result;
            }
        }

        return null;
    }
}