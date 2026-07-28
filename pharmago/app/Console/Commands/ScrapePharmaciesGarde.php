<?php

namespace App\Console\Commands;
use Carbon\Carbon;
use Illuminate\Console\Command;
use App\Models\GardePharmacie;

class ScrapePharmaciesGarde extends Command
{
    protected $signature = 'pharmacies:scrape-garde';

    protected $description = 'Récupère le planning de garde UNPPCI';

   public function handle()
{
    $this->info("🚀 Vérification du planning pharmacies...");


    try {


        /*
        |--------------------------------------------------------------------------
        | Pages à scraper
        |--------------------------------------------------------------------------
        */

        $pages = [

            [
                'nom' => 'Abidjan',
                'url' => 'https://www.pharmacies-de-garde.ci/liste-des-pharmacies-de-garde-a-abidjan-votre-permanence/'
            ],


            [
                'nom' => 'Intérieur',
                'url' => 'https://www.pharmacies-de-garde.ci/liste-des-pharmacies-de-garde-a-linterieur-votre-permanence/'
            ],

        ];




        foreach ($pages as $page) {


            $this->info("");

            $this->info(
                "📄 Lecture ".$page['nom']." : ".$page['url']
            );



            try {


                /*
                |--------------------------------------------------------------------------
                | Récupération page
                |--------------------------------------------------------------------------
                */

                $texte = $this->lirePage($page['url']);



                if(empty($texte)) {

                    $this->error(
                        "❌ Page vide : ".$page['nom']
                    );

                    continue;
                }




                /*
                |--------------------------------------------------------------------------
                | Détection erreur 404
                |--------------------------------------------------------------------------
                */

                if(
                    str_contains(
                        strtoupper($texte),
                        '404 OUPS'
                    )
                ){

                    $this->error(
                        "❌ Page inexistante : ".$page['url']
                    );

                    continue;

                }



                $this->info(
                    "Extraction terminée : ".strlen($texte)." caractères"
                );




                /*
                |--------------------------------------------------------------------------
                | Extraction période
                |--------------------------------------------------------------------------
                */

                $dates = $this->extraireDates($texte);



                $this->info(
                    "Période : ".
                    $dates['date_debut'].
                    " au ".
                    $dates['date_fin']
                );




                /*
                |--------------------------------------------------------------------------
                | Extraction pharmacies
                |--------------------------------------------------------------------------
                */

                $gardes = $this->extraireGardes($texte);



                $this->info(
                    count($gardes).
                    " gardes trouvées pour ".$page['nom']
                );





                /*
                |--------------------------------------------------------------------------
                | Enregistrement base
                |--------------------------------------------------------------------------
                */

                foreach($gardes as $garde){


                    GardePharmacie::updateOrCreate(

                        [

                            'nom'   => $garde['nom'],

                            'ville' => $garde['ville'],

                        ],


                        [

                            'telephone' => $garde['telephone'],

                            'adresse'   => $garde['adresse'],


                            'date_debut'=> $dates['date_debut'],

                            'date_fin'  => $dates['date_fin'],


                            'source' => 'Pharmacies-de-garde.ci',

                        ]

                    );

                }



            } catch(\Exception $e) {


                $this->error(
                    "❌ Erreur sur ".$page['nom']." : ".
                    $e->getMessage()
                );


                continue;

            }



        }




        $this->info("");

        $this->info(
            "✅ Planning mis à jour avec succès !"
        );



    } catch(\Exception $e) {


        $this->error(
            "❌ Erreur générale : ".
            $e->getMessage()
        );


        return Command::FAILURE;

    }



    return Command::SUCCESS;
}
private function lirePage($url)
{
    $this->info("Récupération de la page : ".$url);


    // Télécharger la page HTML
    $ch = curl_init();


    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0');


    $html = curl_exec($ch);


    if ($html === false) {

        throw new \Exception(
            "Erreur récupération site : "
            .curl_error($ch)
        );

    }


    curl_close($ch);



    // Charger le HTML
    $dom = new \DOMDocument();


    libxml_use_internal_errors(true);


    $dom->loadHTML($html);


    libxml_clear_errors();



    $xpath = new \DOMXPath($dom);



    // Supprimer scripts et styles inutiles
    $elements = $xpath->query(
        '//script|//style|//noscript'
    );


    foreach ($elements as $element) {

        $element->parentNode
            ->removeChild($element);

    }



    // Récupérer le texte visible
    $body = $xpath->query('//body');


    if ($body->length == 0) {

        throw new \Exception(
            "Impossible de trouver le contenu de la page"
        );

    }



    $texte = $body
        ->item(0)
        ->textContent;



    // Nettoyage du texte
    $texte = html_entity_decode(
        $texte,
        ENT_QUOTES | ENT_HTML5,
        'UTF-8'
    );


    $texte = preg_replace(
        '/[ \t]+/',
        ' ',
        $texte
    );


    $texte = preg_replace(
        '/\n\s*\n/',
        "\n",
        $texte
    );



    // Sauvegarde pour contrôle
    file_put_contents(
        storage_path('app/debug-pharmacies.txt'),
        trim($texte)
    );



    $this->info(
        "Extraction terminée : "
        .strlen($texte)
        ." caractères"
    );



    return trim($texte);
} 
private function extraireGardes($texte)
{
    $texte = strtoupper($texte);

    $texte = preg_replace('/([A-Z])PHARMACIE/', '$1 PHARMACIE', $texte);

    $lignes = preg_split('/\r\n|\r|\n/', $texte);

    $gardes = [];

    foreach ($lignes as $ligne) {

        $ligne = trim(preg_replace('/\s+/', ' ', $ligne));

        if (!$ligne || !str_contains($ligne, 'PHARMACIE')) {
            continue;
        }


        // Extraction ville + pharmacie + téléphone
        if (preg_match(
            '/^(.+?)\s+PHARMACIE\s+(.+?)\s+(?:M\.|MME|TEL\.|-)\s*.*?TEL\.?\s*([0-9\s]+)/',
            $ligne,
            $match
        )) {

            $nom = trim($match[2]);

            // Nettoyage final
            $nom = preg_replace('/\s+(M\.|MME).*$/', '', $nom);
            $nom = trim($nom);


            $gardes[] = [
                'ville' => trim($match[1]),
                'nom' => 'PHARMACIE '.$nom,
                'telephone' => trim(preg_replace('/\s+/', ' ', $match[3])),
                'adresse' => null,
            ];
        }
    }

    return $gardes;
}
private function extraireDates($texte)
{
    $moisMap = [
        'JANVIER'=>1,
        'FEVRIER'=>2,
        'MARS'=>3,
        'AVRIL'=>4,
        'MAI'=>5,
        'JUIN'=>6,
        'JUILLET'=>7,
        'AOUT'=>8,
        'SEPTEMBRE'=>9,
        'OCTOBRE'=>10,
        'NOVEMBRE'=>11,
        'DECEMBRE'=>12,
    ];


    // Normalisation
    $texte = strtoupper($texte);


    $texte = str_replace(
        [
            'É','È','Ê','Ë',
            'À','Â',
            'Î','Ï',
            'Ô',
            'Û','Ù',
            'Ç',
            '’'
        ],
        [
            'E','E','E','E',
            'A','A',
            'I','I',
            'O',
            'U','U',
            'C',
            "'"
        ],
        $texte
    );


    $texte = preg_replace('/\s+/', ' ', $texte);


    /*
       Cherche :
       25 JUILLET AU 31 JUILLET 2026
       ou
       SAMEDI 25 JUILLET AU VENDREDI 31 JUILLET 2026
    */

    if(
        preg_match(
            '/(\d{1,2})\s+(JANVIER|FEVRIER|MARS|AVRIL|MAI|JUIN|JUILLET|AOUT|SEPTEMBRE|OCTOBRE|NOVEMBRE|DECEMBRE)\s+AU\s+\w+\s*(\d{1,2})\s+(JANVIER|FEVRIER|MARS|AVRIL|MAI|JUIN|JUILLET|AOUT|SEPTEMBRE|OCTOBRE|NOVEMBRE|DECEMBRE)\s+(\d{4})/',
            $texte,
            $match
        )
    ){

        return [

            'date_debut'=>sprintf(
                "%s-%02d-%02d",
                $match[5],
                $moisMap[$match[2]],
                $match[1]
            ),

            'date_fin'=>sprintf(
                "%s-%02d-%02d",
                $match[5],
                $moisMap[$match[4]],
                $match[3]
            )

        ];
    }



    /*
       Cas simple :
       25 AU 31 JUILLET 2026
    */

    if(
        preg_match(
            '/(\d{1,2})\s+AU\s+(\d{1,2})\s+(JANVIER|FEVRIER|MARS|AVRIL|MAI|JUIN|JUILLET|AOUT|SEPTEMBRE|OCTOBRE|NOVEMBRE|DECEMBRE)\s+(\d{4})/',
            $texte,
            $match
        )
    ){

        return [

            'date_debut'=>sprintf(
                "%s-%02d-%02d",
                $match[4],
                $moisMap[$match[3]],
                $match[1]
            ),

            'date_fin'=>sprintf(
                "%s-%02d-%02d",
                $match[4],
                $moisMap[$match[3]],
                $match[2]
            )

        ];

    }



    /*
       Cas numérique
       25/07/2026 au 31/07/2026
    */

    if(
        preg_match(
            '/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4}).*?(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/',
            $texte,
            $match
        )
    ){

        return [

            'date_debut'=>$match[3].'-'.$match[2].'-'.$match[1],

            'date_fin'=>$match[6].'-'.$match[5].'-'.$match[4]

        ];

    }


    // Debug pour voir exactement ce que reçoit la fonction
    file_put_contents(
        storage_path('app/debug-date-erreur.txt'),
        $texte
    );


    throw new \Exception(
        "Impossible d'extraire la période."
    );
}}