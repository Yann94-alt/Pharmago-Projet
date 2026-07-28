<?php

namespace App\Console\Commands;

use App\Models\GardePharmacie;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Exception;

class GeocodePharmacies extends Command
{

    protected $signature = 'pharmacies:geocode {--limit=}';

    protected $description = 'Ajoute les coordonnées GPS des pharmacies de garde';



    public function handle()
    {

        $this->info("🚀 Début du géocodage...");


        $query = GardePharmacie::where(function($q){

            $q->whereNull('latitude')
              ->orWhereNull('longitude');

        });



        if($this->option('limit')){

            $query->limit(
                intval($this->option('limit'))
            );

        }



        $pharmacies = $query->get();



        if($pharmacies->isEmpty()){

            $this->info(
                "✅ Toutes les pharmacies ont déjà des coordonnées."
            );

            return Command::SUCCESS;

        }




        foreach($pharmacies as $pharmacie){


            $this->newLine();


            $this->info(
                "Recherche : ".$pharmacie->nom." - ".$pharmacie->ville
            );



            $gps = $this->trouverCoordonnees(

                $pharmacie->nom,

                $pharmacie->ville

            );



            if($gps){


                $pharmacie->update([

                    'latitude'=>$gps['latitude'],

                    'longitude'=>$gps['longitude']

                ]);



                $this->info(
                    "✅ GPS : ".$gps['latitude']." / ".$gps['longitude']
                );



            }else{


                $this->warn(
                    "❌ Introuvable"
                );

            }



            sleep(1);

        }



        $this->newLine();

        $this->info(
            "🎉 Géocodage terminé"
        );



        return Command::SUCCESS;

    }






   private function trouverCoordonnees($nom, $ville)
{

    $nom = $this->nettoyerNom($nom);

    $ville = $this->nettoyerVille($ville);



    $recherches = [

        // Recherche complète
        "Pharmacie {$nom}, {$ville}, Côte d'Ivoire",

        // Sans pharmacie
        "{$nom}, {$ville}, Côte d'Ivoire",

        // Nom + ville simple
        "{$nom} {$ville}",

        // Avec pharmacie + ville seulement
        "Pharmacie, {$ville}, Côte d'Ivoire",

        // Recherche ville
        "{$ville}, Côte d'Ivoire"

    ];



    foreach($recherches as $texte){


        $this->line("🔎 ".$texte);


        $gps = $this->chercherOSM($texte);



        if($gps){

            return $gps;

        }


    }


    return null;

}

   private function nettoyerNom($nom)
{

    $nom = strtoupper($nom);


    // enlever les responsables
    $nom = preg_replace(
        '/\b(M|MME|MR|MADAME|MONSIEUR)\b.*/',
        '',
        $nom
    );


    // enlever les mentions inutiles

    $nom = str_replace(
        [
            'PHARMACIE',
            'PHCIE',
            'NLLE',
            'NVLLE',
            '(NOUVELLE)',
            '(GDE)'
        ],
        '',
        $nom
    );



    $nom = preg_replace(
        '/\(.*?\)/',
        '',
        $nom
    );



    return trim(
        preg_replace('/\s+/',' ',$nom)
    );

}


    private function nettoyerVille($ville)
    {


        $ville = strtoupper($ville);



        // garde uniquement la première ville

        $ville = explode(

            '+',

            $ville

        )[0];



        $ville = str_replace(

            [

                'CENTRE',
                'COMMUNE',
                'ABIDJAN'

            ],

            '',

            $ville

        );



        return trim($ville);

    }








    private function chercherOSM($query)
    {


        try{


            $response = Http::withoutVerifying()

                ->timeout(15)

                ->withHeaders([

                    'User-Agent'=>
                    'PharmaGoCI/1.0'

                ])

                ->get(

                    'https://nominatim.openstreetmap.org/search',

                    [

                        'q'=>$query,

                        'format'=>'json',

                        'limit'=>5,

                        'countrycodes'=>'ci',

                        'addressdetails'=>1

                    ]

                );





            if(!$response->successful()){

                return null;

            }





            foreach($response->json() as $item){



                $country =
                $item['address']['country_code'] ?? '';



                if($country != 'ci'){

                    continue;

                }




                $display = strtoupper(

                    $item['display_name'] ?? ''

                );




                /*
                 Vérifie que c'est bien un commerce/pharmacie
                */


                if(

                    !str_contains($display,'PHARM')

                    &&

                    !str_contains($display,'DRUG')

                ){

                    continue;

                }




                $type =
                $item['type'] ?? '';



                $class =
                $item['class'] ?? '';





                // Refuse villes/quartiers

                if(

                    $class == 'boundary'

                    ||

                    in_array(

                        $type,

                        [

                            'city',
                            'town',
                            'village',
                            'administrative'

                        ]

                    )

                ){

                    continue;

                }





                return [

                    'latitude'=>(float)$item['lat'],

                    'longitude'=>(float)$item['lon']

                ];

            }



        }catch(Exception $e){


            return null;

        }



        return null;

    }


}