<?php

namespace App\Console\Commands;

use App\Models\GardePharmacie;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Throwable;

class GeocodePharmacies extends Command
{
    protected $signature = 'pharmacies:geocode
                            {--limit= : Nombre maximum de pharmacies à traiter}';

    protected $description = 'Ajoute les coordonnées GPS des pharmacies de garde';

    /*
    |--------------------------------------------------------------------------
    | Statistiques
    |--------------------------------------------------------------------------
    */

    private int $trouvees = 0;
    private int $introuvables = 0;
    private int $erreurs = 0;

    public function handle(): int
    {
        $this->info('🚀 Début du géocodage...');

        $limit = $this->option('limit');

        /*
        |--------------------------------------------------------------------------
        | On sélectionne uniquement les pharmacies incomplètes.
        |--------------------------------------------------------------------------
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

        /*
        |--------------------------------------------------------------------------
        | Rien à traiter
        |--------------------------------------------------------------------------
        */

        if ($pharmacies->isEmpty()) {

            $this->info(
                '✅ Toutes les pharmacies ont déjà des coordonnées.'
            );

            return Command::SUCCESS;
        }

        $this->info(
            "📍 Pharmacies à traiter : {$pharmacies->count()}"
        );

        /*
        |--------------------------------------------------------------------------
        | Traitement
        |--------------------------------------------------------------------------
        */

        foreach ($pharmacies as $pharmacie) {

            $this->newLine();

            $this->info(
                "🏥 {$pharmacie->nom} - {$pharmacie->ville}"
            );

            /*
            |--------------------------------------------------------------------------
            | Sécurité supplémentaire
            |--------------------------------------------------------------------------
            |
            | Si les coordonnées ont été ajoutées entre le moment où la
            | requête a été faite et maintenant, on ne touche plus à la ligne.
            |
            */

            if (
                !is_null($pharmacie->latitude)
                &&
                !is_null($pharmacie->longitude)
            ) {

                $this->line(
                    "⏭️ Déjà géocodée : {$pharmacie->latitude} / {$pharmacie->longitude}"
                );

                continue;
            }

            try {

                $gps = $this->trouverCoordonnees(
                    $pharmacie->nom,
                    $pharmacie->ville
                );

                /*
                |--------------------------------------------------------------------------
                | GPS trouvé
                |--------------------------------------------------------------------------
                */

                if ($gps) {

                    $pharmacie->latitude = $gps['latitude'];
                    $pharmacie->longitude = $gps['longitude'];

                    $pharmacie->save();

                    /*
                    | Recharge depuis la base pour confirmer.
                    */

                    $pharmacie->refresh();

                    if (
                        !is_null($pharmacie->latitude)
                        &&
                        !is_null($pharmacie->longitude)
                    ) {

                        $this->trouvees++;

                        $this->info(
                            "✅ GPS enregistré : "
                            . $pharmacie->latitude
                            . ' / '
                            . $pharmacie->longitude
                        );

                    } else {

                        $this->erreurs++;

                        $this->error(
                            '❌ Impossible de confirmer la sauvegarde.'
                        );
                    }

                } else {

                    $this->introuvables++;

                    $this->warn(
                        '❌ Pharmacie introuvable sur OpenStreetMap.'
                    );
                }

            } catch (Throwable $e) {

                $this->erreurs++;

                $this->error(
                    '❌ Erreur : ' . $e->getMessage()
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Pause pour respecter Nominatim
            |--------------------------------------------------------------------------
            */

            sleep(1);
        }

        /*
        |--------------------------------------------------------------------------
        | Résumé
        |--------------------------------------------------------------------------
        */

        $this->newLine();

        $this->info('🎉 Géocodage terminé.');

        $this->table(
            [
                'Résultat',
                'Nombre',
            ],
            [
                [
                    '✅ Coordonnées trouvées',
                    $this->trouvees,
                ],
                [
                    '❌ Introuvables',
                    $this->introuvables,
                ],
                [
                    '⚠️ Erreurs',
                    $this->erreurs,
                ],
            ]
        );

        return Command::SUCCESS;
    }

    /*
    |--------------------------------------------------------------------------
    | Recherche principale
    |--------------------------------------------------------------------------
    */

    private function trouverCoordonnees(
        ?string $nom,
        ?string $ville
    ): ?array {

        $nomOriginal = trim((string) $nom);
        $villeOriginale = trim((string) $ville);

        if ($nomOriginal === '') {
            return null;
        }

        /*
        |--------------------------------------------------------------------------
        | Nettoyage
        |--------------------------------------------------------------------------
        */

        $nomClean = $this->nettoyerNom($nomOriginal);
        $villeClean = $this->nettoyerVille($villeOriginale);

        /*
        |--------------------------------------------------------------------------
        | Si le nom devient vide, on abandonne.
        |--------------------------------------------------------------------------
        */

        if ($nomClean === '') {
            return null;
        }

        /*
        |--------------------------------------------------------------------------
        | Recherches.
        |--------------------------------------------------------------------------
        |
        | IMPORTANT :
        | On ne recherche jamais uniquement la ville.
        |
        */

        $recherches = [];

        if ($villeClean !== '') {

            $recherches[] =
                "Pharmacie {$nomClean}, {$villeClean}, Côte d'Ivoire";

            $recherches[] =
                "{$nomClean}, {$villeClean}, Côte d'Ivoire";

            $recherches[] =
                "Pharmacie {$nomClean} {$villeClean}";
        }

        /*
        | Recherche uniquement par nom en dernier recours.
        */

        $recherches[] =
            "Pharmacie {$nomClean}, Côte d'Ivoire";

        $recherches[] =
            "{$nomClean}, Côte d'Ivoire";

        /*
        |--------------------------------------------------------------------------
        | Suppression des doublons
        |--------------------------------------------------------------------------
        */

        $recherches = array_values(
            array_unique(
                array_filter($recherches)
            )
        );

        /*
        |--------------------------------------------------------------------------
        | Exécution
        |--------------------------------------------------------------------------
        */

        foreach ($recherches as $texte) {

            $this->line(
                "🔎 {$texte}"
            );

            $resultats = $this->chercherOSM($texte);

            if (empty($resultats)) {
                continue;
            }

            /*
            |--------------------------------------------------------------------------
            | Validation des résultats
            |--------------------------------------------------------------------------
            */

            foreach ($resultats as $resultat) {

                if (
                    $this->resultatCorrespond(
                        $resultat,
                        $nomClean,
                        $villeClean
                    )
                ) {

                    $this->line(
                        "🎯 Correspondance trouvée : "
                        . ($resultat['display_name'] ?? 'inconnue')
                    );

                    return [
                        'latitude' =>
                            (float) $resultat['lat'],

                        'longitude' =>
                            (float) $resultat['lon'],
                    ];
                }
            }
        }

        return null;
    }

    /*
    |--------------------------------------------------------------------------
    | Nettoyage du nom
    |--------------------------------------------------------------------------
    */

    private function nettoyerNom(string $nom): string
    {
        $nom = strtoupper($nom);

        /*
        |--------------------------------------------------------------------------
        | Suppression des responsables.
        |--------------------------------------------------------------------------
        |
        | Exemple :
        | PHARMACIE XYZ M. DUPONT
        |
        | devient :
        | PHARMACIE XYZ
        |
        */

        $nom = preg_replace(
            '/\b(M|MME|MR|MADAME|MONSIEUR)\b.*$/u',
            '',
            $nom
        );

        /*
        |--------------------------------------------------------------------------
        | Suppression des préfixes.
        |--------------------------------------------------------------------------
        */

        $nom = preg_replace(
            '/\b(PHARMACIE|PHCIE)\b/iu',
            '',
            $nom
        );

        /*
        |--------------------------------------------------------------------------
        | Abréviations.
        |--------------------------------------------------------------------------
        */

        $nom = str_ireplace(
            [
                'NLLE',
                'NVLLE',
                'GRDE',
                'GDE',
            ],
            [
                'NOUVELLE',
                'NOUVELLE',
                'GRANDE',
                'GRANDE',
            ],
            $nom
        );

        /*
        |--------------------------------------------------------------------------
        | Suppression du contenu entre parenthèses.
        |--------------------------------------------------------------------------
        */

        $nom = preg_replace(
            '/\(.*?\)/',
            '',
            $nom
        );

        /*
        |--------------------------------------------------------------------------
        | Nettoyage espaces.
        |--------------------------------------------------------------------------
        */

        $nom = preg_replace(
            '/\s+/',
            ' ',
            $nom
        );

        return trim($nom);
    }

    /*
    |--------------------------------------------------------------------------
    | Nettoyage de la ville
    |--------------------------------------------------------------------------
    */

    private function nettoyerVille(?string $ville): string
    {
        if (!$ville) {
            return '';
        }

        $ville = strtoupper(trim($ville));

        /*
        |--------------------------------------------------------------------------
        | Certaines données peuvent contenir :
        |
        | ABIDJAN+CENTRE
        | ABIDJAN+COCODY
        |
        |--------------------------------------------------------------------------
        */

        $ville = explode('+', $ville)[0];

        /*
        |--------------------------------------------------------------------------
        | Nettoyage.
        |--------------------------------------------------------------------------
        */

        $ville = str_replace(
            [
                'CENTRE',
                'COMMUNE',
            ],
            '',
            $ville
        );

        /*
        |--------------------------------------------------------------------------
        | Ne pas supprimer ABIDJAN.
        |--------------------------------------------------------------------------
        |
        | Ton ancien code supprimait ABIDJAN :
        |
        | str_replace(['CENTRE','COMMUNE','ABIDJAN'], '', $ville)
        |
        | C'est mauvais pour la recherche.
        |
        */

        $ville = preg_replace(
            '/\s+/',
            ' ',
            $ville
        );

        return trim($ville);
    }

    /*
    |--------------------------------------------------------------------------
    | Recherche Nominatim / OpenStreetMap
    |--------------------------------------------------------------------------
    */

    private function chercherOSM(string $query): array
    {
        try {

            $response = Http::timeout(15)
                ->retry(2, 1500)
                ->withHeaders([
                    'User-Agent' =>
                        'PharmaGoCI/1.0 (contact@pharmagoci.com)',

                    'Accept' =>
                        'application/json',
                ])
                ->get(
                    'https://nominatim.openstreetmap.org/search',
                    [
                        'q' => $query,

                        'format' => 'json',

                        'limit' => 5,

                        'countrycodes' => 'ci',

                        'addressdetails' => 1,

                        'dedupe' => 1,
                    ]
                );

            /*
            |--------------------------------------------------------------------------
            | HTTP 429
            |--------------------------------------------------------------------------
            */

            if ($response->status() === 429) {

                $this->warn(
                    '⚠️ Nominatim demande de ralentir.'
                );

                sleep(5);

                return [];
            }

            /*
            |--------------------------------------------------------------------------
            | Erreur HTTP
            |--------------------------------------------------------------------------
            */

            if (!$response->successful()) {

                $this->warn(
                    "⚠️ Nominatim HTTP {$response->status()}"
                );

                return [];
            }

            $data = $response->json();

            if (!is_array($data)) {
                return [];
            }

            $resultats = [];

            foreach ($data as $item) {

                /*
                |--------------------------------------------------------------------------
                | Coordonnées
                |--------------------------------------------------------------------------
                */

                if (
                    !isset($item['lat'])
                    ||
                    !isset($item['lon'])
                ) {
                    continue;
                }

                if (
                    !is_numeric($item['lat'])
                    ||
                    !is_numeric($item['lon'])
                ) {
                    continue;
                }

                /*
                |--------------------------------------------------------------------------
                | Vérification Côte d'Ivoire
                |--------------------------------------------------------------------------
                */

                $country =
                    strtolower(
                        $item['address']['country_code'] ?? ''
                    );

                if ($country !== 'ci') {
                    continue;
                }

                /*
                |--------------------------------------------------------------------------
                | Type / classe OSM
                |--------------------------------------------------------------------------
                */

                $type =
                    strtolower(
                        $item['type'] ?? ''
                    );

                $class =
                    strtolower(
                        $item['class'] ?? ''
                    );

                /*
                |--------------------------------------------------------------------------
                | Refuser villes / quartiers / frontières.
                |--------------------------------------------------------------------------
                */

                if (
                    $class === 'boundary'
                    ||
                    in_array(
                        $type,
                        [
                            'city',
                            'town',
                            'village',
                            'administrative',
                            'suburb',
                            'neighbourhood',
                            'quarter',
                        ],
                        true
                    )
                ) {
                    continue;
                }

                /*
                |--------------------------------------------------------------------------
                | Vérification que le résultat ressemble à une pharmacie.
                |--------------------------------------------------------------------------
                */

                $display = strtoupper(
                    $item['display_name'] ?? ''
                );

                $name = strtoupper(
                    $item['name'] ?? ''
                );

                $category =
                    strtoupper(
                        ($item['type'] ?? '')
                        . ' '
                        . ($item['category'] ?? '')
                    );

                $pharmacieTrouvee =
                    str_contains($display, 'PHARM')
                    ||
                    str_contains($name, 'PHARM')
                    ||
                    str_contains($category, 'PHARM')
                    ||
                    str_contains($display, 'DRUG');

                if (!$pharmacieTrouvee) {
                    continue;
                }

                $resultats[] = $item;
            }

            return $resultats;

        } catch (Throwable $e) {

            $this->warn(
                '⚠️ Erreur Nominatim : '
                . $e->getMessage()
            );

            return [];
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Vérification du résultat
    |--------------------------------------------------------------------------
    */

    private function resultatCorrespond(
        array $resultat,
        string $nomRecherche,
        string $villeRecherche
    ): bool {

        $display = strtoupper(
            $resultat['display_name'] ?? ''
        );

        $nomOSM = strtoupper(
            $resultat['name'] ?? ''
        );

        /*
        |--------------------------------------------------------------------------
        | Normalisation pour comparaison.
        |--------------------------------------------------------------------------
        */

        $nomRechercheNormalise =
            $this->normaliserComparaison(
                $nomRecherche
            );

        $displayNormalise =
            $this->normaliserComparaison(
                $display
            );

        $nomOSMNormalise =
            $this->normaliserComparaison(
                $nomOSM
            );

        /*
        |--------------------------------------------------------------------------
        | Nom complet trouvé dans le résultat.
        |--------------------------------------------------------------------------
        */

        if (
            $nomRechercheNormalise !== ''
            &&
            str_contains(
                $displayNormalise,
                $nomRechercheNormalise
            )
        ) {
            return true;
        }

        /*
        |--------------------------------------------------------------------------
        | Ou nom OSM suffisamment proche.
        |--------------------------------------------------------------------------
        */

        if (
            $nomOSMNormalise !== ''
            &&
            $this->similariteNom(
                $nomRechercheNormalise,
                $nomOSMNormalise
            ) >= 70
        ) {
            return true;
        }

        return false;
    }

    /*
    |--------------------------------------------------------------------------
    | Normalisation comparaison
    |--------------------------------------------------------------------------
    */

    private function normaliserComparaison(string $texte): string
    {
        $texte = iconv(
            'UTF-8',
            'ASCII//TRANSLIT//IGNORE',
            $texte
        );

        $texte = strtoupper($texte);

        $texte = preg_replace(
            '/[^A-Z0-9]+/',
            ' ',
            $texte
        );

        return trim(
            preg_replace('/\s+/', ' ', $texte)
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Similarité entre deux noms
    |--------------------------------------------------------------------------
    */

    private function similariteNom(
        string $a,
        string $b
    ): float {

        if ($a === '' || $b === '') {
            return 0;
        }

        similar_text(
            $a,
            $b,
            $percent
        );

        return (float) $percent;
    }
}