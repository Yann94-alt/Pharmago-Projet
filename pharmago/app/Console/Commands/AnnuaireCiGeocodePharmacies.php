<?php

namespace App\Console\Commands;

use App\Models\GardePharmacie;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class AnnuaireCiGeocodePharmacies extends Command
{
    protected $signature = 'pharmacies:annuaire-geocode {--limit= : Nombre maximum de pharmacies}';
    protected $description = 'Récupère les coordonnées des pharmacies depuis AnnuaireCI';
    public function handle()
    {
        $limit = $this->option('limit');
        $query = GardePharmacie::where(function ($q) {
            $q->whereNull('latitude')
              ->orWhereNull('longitude');
        });
        if ($limit) {
            $query->limit((int)$limit);
        }
        $pharmacies = $query->get();



        $this->info(
            "📍 Pharmacies à traiter : ".$pharmacies->count()
        );



        foreach ($pharmacies as $pharmacie) {


            $this->info(
                "🔎 Recherche : {$pharmacie->nom} - {$pharmacie->ville}"
            );


            $coordonnees = $this->chercherAnnuaire(
                $pharmacie->nom,
                $pharmacie->ville
            );



            if ($coordonnees) {


                $pharmacie->update([

                    'latitude' =>
                        $coordonnees['latitude'],

                    'longitude' =>
                        $coordonnees['longitude'],

                ]);



                $this->info(
                    "✅ ".$coordonnees['latitude']
                    ." / "
                    .$coordonnees['longitude']
                );



            } else {


                $this->warn("❌ Pas trouvé");


            }



            sleep(1);

        }



        $this->info("🎉 Terminé");


        return Command::SUCCESS;
    }





    private function chercherAnnuaire($nom, $ville)
    {


        /*
        Nettoyage du nom pharmacie
        */


        $nomClean = str_ireplace(
            [
                'PHCIE',
                'PHARMACIE'
            ],
            '',
            $nom
        );



        /*
        Conversion des abréviations AnnuaireCI
        */


        $nomClean = str_ireplace(

            [
                'GRDE',
                'GDE',
                'NVLLE',
                'NLLE'
            ],

            [
                'GRANDE',
                'GRANDE',
                'NOUVELLE',
                'NOUVELLE'
            ],

            $nomClean

        );



        $nomClean = trim(
            preg_replace('/\s+/', ' ', $nomClean)
        );



        /*
        Création du slug
        */


        $slug = strtolower(

            "pharmacie {$nomClean} {$ville} cote divoire"

        );



        // Suppression accents

        $slug = iconv(
            'UTF-8',
            'ASCII//TRANSLIT',
            $slug
        );



        $slug = str_replace(

            [
                ' ',
                "'",
                '’',
                '(',
                ')'
            ],

            '-',

            $slug

        );



        $slug = preg_replace(
            '/-+/',
            '-',
            $slug
        );



        $slug = trim(
            $slug,
            '-'
        );



        $url =
            "https://annuaireci.com/entreprises/"
            .$slug
            ."/";



        $this->line(
            "🌐 ".$url
        );



        try {


            $response = Http::withoutVerifying()

                ->timeout(15)

                ->withHeaders([

                    'User-Agent' =>
                    'Mozilla/5.0 PharmaGoCI'

                ])

                ->get($url);





            if (!$response->successful()) {

                return null;

            }





            $html = $response->body();





            preg_match_all(

                '/<script type="application\/ld\+json">(.*?)<\/script>/s',

                $html,

                $matches

            );





            foreach ($matches[1] as $json) {



                $data = json_decode(

                    html_entity_decode($json),

                    true

                );





                if (

                    isset($data['@type'])

                    &&

                    $data['@type'] === 'Pharmacy'

                    &&

                    isset($data['geo']['latitude'])

                    &&

                    isset($data['geo']['longitude'])

                ) {
                    return [

                        'latitude' =>
                            (float)$data['geo']['latitude'],


                        'longitude' =>
                            (float)$data['geo']['longitude']

                    ];

                }


            }




        } catch (\Exception $e) {


            return null;

        }





        return null;

    }

}