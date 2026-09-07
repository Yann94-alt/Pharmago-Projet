<?php

namespace App\Console\Commands;

use App\Models\GardePharmacie;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Throwable;

class ScrapePharmaciesGarde extends Command
{
    protected $signature = 'pharmacies:scrape-garde';

    protected $description = 'Récupère et remplace le planning des pharmacies de garde';

    public function handle(): int
    {
        $this->info('🚀 Vérification du planning pharmacies...');
        $this->newLine();

        /*
        |--------------------------------------------------------------------------
        | Pages à scraper
        |--------------------------------------------------------------------------
        */

        $pages = [

            [
                'nom' => 'Abidjan',
                'url' => 'https://www.pharmacies-de-garde.ci/liste-des-pharmacies-de-garde-a-abidjan-votre-permanence/',
            ],

            [
                'nom' => 'Intérieur',
                'url' => 'https://www.pharmacies-de-garde.ci/liste-des-pharmacies-de-garde-a-linterieur-votre-permanence/',
            ],

        ];

        /*
        |--------------------------------------------------------------------------
        | Nouveau planning temporaire
        |--------------------------------------------------------------------------
        |
        | On ne touche pas à la base tant que toutes les pages
        | n'ont pas été correctement récupérées.
        |
        */

        $nouveauPlanning = [];

        try {

            foreach ($pages as $page) {

                $this->newLine();

                $this->info(
                    "📄 Lecture {$page['nom']} : {$page['url']}"
                );

                $pageData = $this->lirePage(
                    $page['url']
                );

                if (
                    empty($pageData['html'])
                    ||
                    empty($pageData['texte'])
                ) {

                    throw new \Exception(
                        "La page {$page['nom']} est vide."
                    );
                }

                $html = $pageData['html'];

                $texte = $pageData['texte'];

                /*
                |--------------------------------------------------------------------------
                | Vérification 404
                |--------------------------------------------------------------------------
                */

                $texteUpper = mb_strtoupper(
                    $texte,
                    'UTF-8'
                );

                if (
                    str_contains(
                        $texteUpper,
                        '404 OUPS'
                    )
                    ||
                    str_contains(
                        $texteUpper,
                        'PAGE NOT FOUND'
                    )
                ) {

                    throw new \Exception(
                        "La page {$page['nom']} semble être une page 404."
                    );
                }

                /*
                |--------------------------------------------------------------------------
                | Extraction des dates
                |--------------------------------------------------------------------------
                */

                $dates = $this->extraireDates(
                    $html
                );

                $this->info(
                    "📅 Période : "
                    . $dates['date_debut']
                    . " → "
                    . $dates['date_fin']
                );

                /*
                |--------------------------------------------------------------------------
                | Extraction pharmacies
                |--------------------------------------------------------------------------
                */

                $gardes = $this->extraireGardes(
                    $html
                );

                if (empty($gardes)) {

                    throw new \Exception(
                        "Aucune pharmacie trouvée sur {$page['nom']}."
                    );
                }

                $this->info(
                    '🏥 '
                    . count($gardes)
                    . " pharmacies trouvées pour {$page['nom']}"
                );

                /*
                |--------------------------------------------------------------------------
                | Ajouter au planning temporaire
                |--------------------------------------------------------------------------
                */

                foreach ($gardes as $garde) {

                    $nouveauPlanning[] = [

                        'ville' =>
                            $garde['ville'],

                        'nom' =>
                            $garde['nom'],

                        'telephone' =>
                            $garde['telephone'],

                        'adresse' =>
                            $garde['adresse'],

                        'date_debut' =>
                            $dates['date_debut'],

                        'date_fin' =>
                            $dates['date_fin'],

                        'source' =>
                            'Pharmacies-de-garde.ci',

                        'latitude' =>
                            null,

                        'longitude' =>
                            null,

                        'created_at' =>
                            now(),

                        'updated_at' =>
                            now(),
                    ];
                }
            }

        } catch (Throwable $e) {

            /*
            |--------------------------------------------------------------------------
            | ERREUR
            |--------------------------------------------------------------------------
            |
            | La base n'a encore pas été modifiée.
            |
            */

            $this->newLine();

            $this->error(
                '❌ Impossible de récupérer le nouveau planning.'
            );

            $this->error(
                $e->getMessage()
            );

            $this->warn(
                '⚠️ Ancien planning conservé dans la base.'
            );

            return Command::FAILURE;
        }

        /*
        |--------------------------------------------------------------------------
        | Vérification finale
        |--------------------------------------------------------------------------
        */

        if (empty($nouveauPlanning)) {

            $this->error(
                '❌ Aucun planning récupéré.'
            );

            $this->warn(
                '⚠️ Ancien planning conservé.'
            );

            return Command::FAILURE;
        }

        /*
        |--------------------------------------------------------------------------
        | Suppression des doublons
        |--------------------------------------------------------------------------
        */

        $nouveauPlanning = collect(
            $nouveauPlanning
        )
        ->unique(function ($item) {

            return mb_strtoupper(
                trim($item['ville'])
                . '|'
                . trim($item['nom']),
                'UTF-8'
            );

        })
        ->values()
        ->toArray();

        $this->newLine();

        $this->info(
            '🏥 Total après suppression des doublons : '
            . count($nouveauPlanning)
        );

        /*
        |--------------------------------------------------------------------------
        | REMPLACEMENT DE LA BASE
        |--------------------------------------------------------------------------
        */

        try {

            DB::transaction(function () use (
                $nouveauPlanning
            ) {

                /*
                |--------------------------------------------------------------------------
                | Supprimer uniquement notre source
                |--------------------------------------------------------------------------
                */

                GardePharmacie::where(
                    'source',
                    'Pharmacies-de-garde.ci'
                )->delete();

                /*
                |--------------------------------------------------------------------------
                | Insérer nouveau planning
                |--------------------------------------------------------------------------
                */

                GardePharmacie::insert(
                    $nouveauPlanning
                );
            });

        } catch (Throwable $e) {

            $this->error(
                '❌ Erreur lors de l\'enregistrement du planning.'
            );

            $this->error(
                $e->getMessage()
            );

            $this->warn(
                '⚠️ L\'ancien planning a été conservé.'
            );

            return Command::FAILURE;
        }

        /*
        |--------------------------------------------------------------------------
        | SUCCÈS
        |--------------------------------------------------------------------------
        */

        $this->newLine();

        $this->info(
            '✅ Ancien planning remplacé.'
        );

        $this->info(
            '✅ Nouveau planning enregistré.'
        );

        $this->info(
            '🏥 '
            . count($nouveauPlanning)
            . ' pharmacies enregistrées.'
        );

        $this->newLine();

        $this->info(
            '🎉 Planning mis à jour avec succès !'
        );

        return Command::SUCCESS;
    }

    /*
    |--------------------------------------------------------------------------
    | LECTURE DE LA PAGE
    |--------------------------------------------------------------------------
    */

    private function lirePage(string $url): array
{
    $this->info("🌐 Récupération de la page : " . $url);

    $ch = curl_init();

    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,

        CURLOPT_HTTPHEADER => [
            'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language: fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
            'Cache-Control: no-cache',
            'Pragma: no-cache',
            'Upgrade-Insecure-Requests: 1',
        ],

        CURLOPT_USERAGENT =>
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
            . 'AppleWebKit/537.36 (KHTML, like Gecko) '
            . 'Chrome/139.0.0.0 Safari/537.36',

        CURLOPT_ENCODING => '',

        CURLOPT_CONNECTTIMEOUT => 20,
        CURLOPT_TIMEOUT => 60,

        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false,

        CURLOPT_COOKIEFILE => '',
        CURLOPT_COOKIEJAR => '',

        CURLOPT_REFERER => 'https://www.pharmacies-de-garde.ci/',
    ]);

    $html = curl_exec($ch);

    if ($html === false) {
        $erreur = curl_error($ch);
        curl_close($ch);

        throw new \Exception(
            'Erreur cURL : ' . $erreur
        );
    }

    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $finalUrl = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);

    curl_close($ch);

    $this->info("📡 HTTP : " . $httpCode);
    $this->info("🔗 URL finale : " . $finalUrl);

    if ($httpCode >= 400) {
        throw new \Exception(
            'Le site a retourné HTTP ' . $httpCode
        );
    }

    if (empty($html)) {
        throw new \Exception(
            'HTML vide.'
        );
    }

    $this->info(
        '📄 HTML récupéré : '
        . strlen($html)
        . ' caractères'
    );

    /*
    |--------------------------------------------------------------------------
    | DOM
    |--------------------------------------------------------------------------
    */

    $dom = new \DOMDocument();

    libxml_use_internal_errors(true);

    $dom->loadHTML(
        '<?xml encoding="UTF-8">' . $html
    );

    libxml_clear_errors();

    $xpath = new \DOMXPath($dom);

    /*
    |--------------------------------------------------------------------------
    | Supprimer scripts / styles
    |--------------------------------------------------------------------------
    */

    $elements = $xpath->query(
        '//script|//style|//noscript'
    );

    foreach ($elements as $element) {
        if ($element->parentNode) {
            $element->parentNode->removeChild($element);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Body
    |--------------------------------------------------------------------------
    */

    $body = $xpath->query('//body');

    if ($body->length === 0) {
        throw new \Exception(
            'Impossible de trouver le body.'
        );
    }

    $texte = $body
        ->item(0)
        ->textContent;

    /*
    |--------------------------------------------------------------------------
    | Nettoyage texte
    |--------------------------------------------------------------------------
    */

    $texte = html_entity_decode(
        $texte,
        ENT_QUOTES | ENT_HTML5,
        'UTF-8'
    );

    $texte = preg_replace(
        '/\s+/u',
        ' ',
        $texte
    );

    $texte = trim($texte);

    /*
    |--------------------------------------------------------------------------
    | Debug
    |--------------------------------------------------------------------------
    */

    file_put_contents(
        storage_path('app/debug-pharmacies.txt'),
        $texte
    );

    $this->info(
        '📄 Texte extrait : '
        . strlen($texte)
        . ' caractères'
    );

    return [
        'html' => $html,
        'texte' => $texte,
    ];
}

    private function extraireGardes(
        string $html
    ): array {

        $dom = new \DOMDocument();

        libxml_use_internal_errors(true);

        $dom->loadHTML(
            '<?xml encoding="UTF-8">' . $html
        );

        libxml_clear_errors();

        $xpath = new \DOMXPath(
            $dom
        );

        $gardes = [];

        /*
        |--------------------------------------------------------------------------
        | Toutes les lignes de tableaux
        |--------------------------------------------------------------------------
        */

        $rows = $xpath->query(
            '//table//tr'
        );

        foreach ($rows as $row) {

            $cells = $xpath->query(
                './th|./td',
                $row
            );

            /*
            | Minimum 3 colonnes
            */

            if ($cells->length < 3) {
                continue;
            }

            /*
            |--------------------------------------------------------------------------
            | Commune
            |--------------------------------------------------------------------------
            */

            $ville = $this->nettoyerTexte(
                $cells->item(0)->textContent
            );

            /*
            |--------------------------------------------------------------------------
            | Pharmacie
            |--------------------------------------------------------------------------
            */

            $nom = $this->nettoyerTexte(
                $cells->item(1)->textContent
            );

            $contact = $this->nettoyerTexte(
                $cells->item(2)->textContent
            );

            if (
                empty($ville)
                ||
                empty($nom)
            ) {
                continue;
            }

            /*
            |--------------------------------------------------------------------------
            | Majuscules pour vérification
            |--------------------------------------------------------------------------
            */

            $villeUpper = mb_strtoupper(
                $ville,
                'UTF-8'
            );

            $nomUpper = mb_strtoupper(
                $nom,
                'UTF-8'
            );

            /*
            |--------------------------------------------------------------------------
            | Ignorer les en-têtes
            |--------------------------------------------------------------------------
            */

            if (
                str_contains(
                    $villeUpper,
                    'COMMUNE'
                )
                ||
                str_contains(
                    $villeUpper,
                    'VILLE DE COTE D'
                )
                ||
                str_contains(
                    $nomUpper,
                    'PHARMACIE DE GARDE'
                )
            ) {

                continue;
            }

            /*
            |--------------------------------------------------------------------------
            | Vérifier pharmacie
            |--------------------------------------------------------------------------
            */

            if (
                !str_contains(
                    $nomUpper,
                    'PHARMACIE'
                )
                &&
                !str_contains(
                    $nomUpper,
                    'PHCIE'
                )
            ) {

                continue;
            }

            /*
            |--------------------------------------------------------------------------
            | Téléphone
            |--------------------------------------------------------------------------
            */

            $telephone =
                $this->extraireTelephone(
                    $contact
                );

            /*
            |--------------------------------------------------------------------------
            | Convertir PHCIE en PHARMACIE
            |--------------------------------------------------------------------------
            */

            if (
                str_starts_with(
                    $nomUpper,
                    'PHCIE '
                )
            ) {

                $nom = 'PHARMACIE '
                    . trim(
                        mb_substr(
                            $nom,
                            5,
                            null,
                            'UTF-8'
                        )
                    );
            }

            /*
            |--------------------------------------------------------------------------
            | Ajouter
            |--------------------------------------------------------------------------
            */

            $gardes[] = [

                'ville' =>
                    mb_strtoupper(
                        trim($ville),
                        'UTF-8'
                    ),

                'nom' =>
                    trim($nom),

                'telephone' =>
                    $telephone,

                'adresse' =>
                    null,
            ];
        }

        /*
        |--------------------------------------------------------------------------
        | Doublons
        |--------------------------------------------------------------------------
        */

        return collect(
            $gardes
        )
        ->unique(function ($item) {

            return mb_strtoupper(
                trim($item['ville'])
                . '|'
                . trim($item['nom']),
                'UTF-8'
            );

        })
        ->values()
        ->toArray();
    }

    /*
    |--------------------------------------------------------------------------
    | EXTRACTION TÉLÉPHONE
    |--------------------------------------------------------------------------
    */

    private function extraireTelephone(
        string $contact
    ): ?string {

        if (
            !preg_match_all(
                '/(?:TEL\.?|TÉL\.?)\s*'
                . '([0-9][0-9\s\/.\-]*)/iu',
                $contact,
                $matches
            )
        ) {

            return null;
        }

        $telephones = [];

        foreach ($matches[1] as $tel) {

            $tel = trim(
                $tel
            );

            $tel = preg_replace(
                '/\s+/u',
                ' ',
                $tel
            );

            $tel = trim(
                $tel,
                " \t\n\r\0\x0B/-."
            );

            if (!empty($tel)) {

                $telephones[] =
                    $tel;
            }
        }

        if (empty($telephones)) {
            return null;
        }

        return implode(
            ' / ',
            $telephones
        );
    }

    /*
    |--------------------------------------------------------------------------
    | NETTOYAGE TEXTE
    |--------------------------------------------------------------------------
    */

    private function nettoyerTexte(
        string $texte
    ): string {

        $texte = html_entity_decode(
            $texte,
            ENT_QUOTES | ENT_HTML5,
            'UTF-8'
        );

        /*
        | Supprimer accents combinés
        */

        $texte = preg_replace(
            '/\p{Mn}+/u',
            '',
            $texte
        );

        $texte = preg_replace(
            '/\s+/u',
            ' ',
            $texte
        );

        return trim(
            $texte
        );
    }

    /*
    |--------------------------------------------------------------------------
    | EXTRACTION DES DATES
    |--------------------------------------------------------------------------
    */

    private function extraireDates(
        string $html
    ): array {

        /*
        |--------------------------------------------------------------------------
        | HTML -> texte
        |--------------------------------------------------------------------------
        */

        $texte = html_entity_decode(
            $html,
            ENT_QUOTES | ENT_HTML5,
            'UTF-8'
        );

        $texte = strip_tags(
            $texte
        );

        $texte = html_entity_decode(
            $texte,
            ENT_QUOTES | ENT_HTML5,
            'UTF-8'
        );

        /*
        |--------------------------------------------------------------------------
        | Majuscules
        |--------------------------------------------------------------------------
        */

        $texte = mb_strtoupper(
            $texte,
            'UTF-8'
        );

        /*
        |--------------------------------------------------------------------------
        | IMPORTANT
        |--------------------------------------------------------------------------
        |
        | Supprime les accents Unicode combinés.
        |
        | Exemple :
        |
        | AOÛT
        |
        | devient :
        |
        | AOUT
        |
        */

        $texte = preg_replace(
            '/\p{Mn}+/u',
            '',
            $texte
        );

        /*
        |--------------------------------------------------------------------------
        | Accents classiques
        |--------------------------------------------------------------------------
        */

        $texte = strtr(
            $texte,
            [

                'À' => 'A',
                'Â' => 'A',
                'Ä' => 'A',
                'Á' => 'A',
                'Ã' => 'A',

                'É' => 'E',
                'È' => 'E',
                'Ê' => 'E',
                'Ë' => 'E',

                'Î' => 'I',
                'Ï' => 'I',
                'Í' => 'I',
                'Ì' => 'I',

                'Ô' => 'O',
                'Ö' => 'O',
                'Ó' => 'O',
                'Ò' => 'O',

                'Ù' => 'U',
                'Û' => 'U',
                'Ü' => 'U',
                'Ú' => 'U',

                'Ç' => 'C',

                '’' => "'",
                '‘' => "'",
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | Espaces
        |--------------------------------------------------------------------------
        */

        $texte = preg_replace(
            '/\s+/u',
            ' ',
            $texte
        );

        $texte = trim(
            $texte
        );

        /*
        |--------------------------------------------------------------------------
        | Sauvegarde debug
        |--------------------------------------------------------------------------
        */

        file_put_contents(
            storage_path(
                'app/debug-date.txt'
            ),
            $texte
        );

        /*
        |--------------------------------------------------------------------------
        | MOIS
        |--------------------------------------------------------------------------
        */

        $mois = [

            'JANVIER' =>
                1,

            'FEVRIER' =>
                2,

            'MARS' =>
                3,

            'AVRIL' =>
                4,

            'MAI' =>
                5,

            'JUIN' =>
                6,

            'JUILLET' =>
                7,

            'AOUT' =>
                8,

            'SEPTEMBRE' =>
                9,

            'OCTOBRE' =>
                10,

            'NOVEMBRE' =>
                11,

            'DECEMBRE' =>
                12,
        ];

        $moisRegex = implode(
            '|',
            array_keys($mois)
        );

        /*
        |--------------------------------------------------------------------------
        | Jours
        |--------------------------------------------------------------------------
        */

        $jours =
            'LUNDI|MARDI|MERCREDI|JEUDI|VENDREDI|SAMEDI|DIMANCHE';

        /*
        |--------------------------------------------------------------------------
        | FORMAT PRINCIPAL
        |--------------------------------------------------------------------------
        |
        | DU SAMEDI 15 AOUT AU VENDREDI 21 AOUT 2026
        |
        */

        $pattern = '/
            DU
            \s*

            (?:
                (?:' . $jours . ')
                \s*
            )?

            (\d{1,2})
            \s+
            (' . $moisRegex . ')
            \s+

            AU
            \s*

            (?:
                (?:' . $jours . ')
                \s*
            )?

            (\d{1,2})
            \s+
            (' . $moisRegex . ')
            \s+
            (\d{4})

        /ux';

        if (
            preg_match(
                $pattern,
                $texte,
                $match
            )
        ) {

            $annee =
                (int) $match[5];

            $dateDebut =
                sprintf(
                    '%04d-%02d-%02d',

                    $annee,

                    $mois[
                        $match[2]
                    ],

                    (int) $match[1]
                );

            $dateFin =
                sprintf(
                    '%04d-%02d-%02d',

                    $annee,

                    $mois[
                        $match[4]
                    ],

                    (int) $match[3]
                );

            $this->info(
                '📅 Période trouvée : '
                . $dateDebut
                . ' → '
                . $dateFin
            );

            return [

                'date_debut' =>
                    $dateDebut,

                'date_fin' =>
                    $dateFin,
            ];
        }

        /*
        |--------------------------------------------------------------------------
        | FORMAT SANS "DU"
        |--------------------------------------------------------------------------
        |
        | 15 AOUT AU 21 AOUT 2026
        |
        */

        $pattern = '/

            (\d{1,2})
            \s+
            (' . $moisRegex . ')
            \s+
            AU
            \s+
            (\d{1,2})
            \s+
            (' . $moisRegex . ')
            \s+
            (\d{4})

        /ux';

        if (
            preg_match(
                $pattern,
                $texte,
                $match
            )
        ) {

            $annee =
                (int) $match[5];

            $dateDebut =
                sprintf(
                    '%04d-%02d-%02d',

                    $annee,

                    $mois[
                        $match[2]
                    ],

                    (int) $match[1]
                );

            $dateFin =
                sprintf(
                    '%04d-%02d-%02d',

                    $annee,

                    $mois[
                        $match[4]
                    ],

                    (int) $match[3]
                );

            $this->info(
                '📅 Période trouvée : '
                . $dateDebut
                . ' → '
                . $dateFin
            );

            return [

                'date_debut' =>
                    $dateDebut,

                'date_fin' =>
                    $dateFin,
            ];
        }

        /*
        |--------------------------------------------------------------------------
        | FORMAT NUMÉRIQUE
        |--------------------------------------------------------------------------
        |
        | 15/08/2026 - 21/08/2026
        |
        */

        if (
            preg_match(
                '/
                    (\d{1,2})
                    [\/\-]
                    (\d{1,2})
                    [\/\-]
                    (\d{4})

                    .*?

                    (\d{1,2})
                    [\/\-]
                    (\d{1,2})
                    [\/\-]
                    (\d{4})
                /ux',

                $texte,

                $match
            )
        ) {

            $dateDebut =
                sprintf(
                    '%04d-%02d-%02d',

                    $match[3],
                    $match[2],
                    $match[1]
                );

            $dateFin =
                sprintf(
                    '%04d-%02d-%02d',

                    $match[6],
                    $match[5],
                    $match[4]
                );

            $this->info(
                '📅 Période trouvée : '
                . $dateDebut
                . ' → '
                . $dateFin
            );

            return [

                'date_debut' =>
                    $dateDebut,

                'date_fin' =>
                    $dateFin,
            ];
        }

        /*
        |--------------------------------------------------------------------------
        | ERREUR
        |--------------------------------------------------------------------------
        */

        $this->error(
            '❌ Aucun format de date reconnu.'
        );

        $this->error(
            '🔎 Vérifie : storage/app/debug-date.txt'
        );

        throw new \Exception(
            'Impossible d\'extraire la période du planning.'
        );
    }
}