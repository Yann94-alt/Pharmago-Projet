<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GardePharmacie;
use App\Models\Pharmacies;
use Illuminate\Http\Request;

class PharmacieController extends Controller
{
    /**
 * Pharmacies de garde proches de moi
 * Route : /api/pharmacies/nearby
 */
public function nearby(Request $request)
{
    /*
    |--------------------------------------------------------------------------
    | Vérification GPS utilisateur
    |--------------------------------------------------------------------------
    */

    if (
        !is_numeric($request->lat) ||
        !is_numeric($request->lng)
    ) {

        return response()->json([
            'message' => 'Position GPS utilisateur obligatoire',
            'data' => []
        ], 400);

    }



    $lat = (float) $request->lat;
    $lng = (float) $request->lng;

    $rayon = (float) $request->get('rayon', 20);



    /*
    |--------------------------------------------------------------------------
    | Pharmacies de garde actuellement valides
    |--------------------------------------------------------------------------
    */

    $today = now()->format('Y-m-d');


    $query = GardePharmacie::query()

        ->whereDate(
            'date_debut',
            '<=',
            $today
        )

        ->whereDate(
            'date_fin',
            '>=',
            $today
        );




    /*
    |--------------------------------------------------------------------------
    | Filtre ville optionnel
    |--------------------------------------------------------------------------
    */

    if ($request->filled('ville')) {

        $query->where(
            'ville',
            'like',
            '%' . $request->ville . '%'
        );

    }




    /*
    |--------------------------------------------------------------------------
    | Calcul distance GPS
    |--------------------------------------------------------------------------
    */

    $query
    ->whereNotNull('latitude')
    ->whereNotNull('longitude')

    ->selectRaw("
        garde_pharmacies.*,

        (
            6371 *
            acos(
                cos(radians(?))
                *
                cos(radians(latitude))
                *
                cos(
                    radians(longitude)
                    -
                    radians(?)
                )
                +
                sin(radians(?))
                *
                sin(radians(latitude))
            )
        ) AS distance

    ",[
        $lat,
        $lng,
        $lat
    ])


    ->having(
        'distance',
        '<=',
        $rayon
    )


    ->orderBy(
        'distance',
        'asc'
    );




    $pharmacies = $query->get();




    /*
    |--------------------------------------------------------------------------
    | Ajouter informations carte
    |--------------------------------------------------------------------------
    */

    $pharmacies->transform(function($pharmacie){


        $pharmacie->distance =
            round($pharmacie->distance,2);



        if(
            $pharmacie->latitude &&
            $pharmacie->longitude
        ){

            $pharmacie->map_url =
                "https://www.google.com/maps/dir/?api=1&destination="
                .$pharmacie->latitude
                .","
                .$pharmacie->longitude;


        }else{

            $pharmacie->map_url = null;

        }



        return $pharmacie;

    });




    return response()->json([

        'user_position'=>[
            'latitude'=>$lat,
            'longitude'=>$lng
        ],

        'rayon_km'=>$rayon,

        'total'=>$pharmacies->count(),

        'pharmacies'=>$pharmacies

    ]);
}
    /**
     * Recherche des pharmacies à proximité
     */
    
    /**
     * Recherche textuelle + tri optionnel par distance
     */
    public function search(Request $request)
    {
        $q = $request->get('q');
        $query = Pharmacies::where('is_active', true);

        if ($q) {
            $query->where(function ($sub) use ($q) {
                $sub->where('nom', 'like', "%{$q}%")
                    ->orWhere('adresse', 'like', "%{$q}%")
                    ->orWhere('ville', 'like', "%{$q}%");
            });
        }

        if ($request->filled(['lat', 'lng'])) {
            $lat = $request->lat;
            $lng = $request->lng;

            $query->selectRaw("
                pharmacies.*,
                (
                    6371 * acos(
                        cos(radians(?)) *
                        cos(radians(latitude)) *
                        cos(radians(longitude) - radians(?)) +
                        sin(radians(?)) *
                        sin(radians(latitude))
                    )
                ) AS distance
            ", [$lat, $lng, $lat])
            ->orderBy('distance');
        }

        return response()->json($query->get());
    }

    /**
     * Liste globale des pharmacies
     */
   public function index(Request $request)
{
    $query = Pharmacies::query();

    if ($request->filled('ville')) {
        $query->where('ville', 'like', '%'.$request->ville.'%');
    }

    return response()->json(
        $query->orderBy('ville')
              ->orderBy('nom')
              ->get()
    );
}
    /**
     * Obtenir une pharmacie
     */
    public function show(Pharmacies $pharmacie)
    {
        return response()->json(
            $pharmacie->load('medicaments')
        );
    }

    /**
     * Enregistrer une pharmacie
     */
   
    public function update(Request $request, Pharmacies $pharmacie)
    {
        if ($pharmacie->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Accès refusé.',
            ], 403);
        }

        $pharmacie->update(
            $request->only([
                'nom',
                'adresse',
                'telephone',
                'latitude',
                'longitude',
                'est_de_garde',
            ])
        );

        return response()->json([
            'message'   => 'Pharmacie mise à jour avec succès.',
            'pharmacie' => $pharmacie,
        ]);
    }

   public function deGarde(Request $request)
{
    $query = GardePharmacie::query();

    // 1 - Vérifier les gardes valides pour aujourd'hui
    $today = now()->format('Y-m-d');
    $query->whereDate('date_debut', '<=', $today)
          ->whereDate('date_fin', '>=', $today);

    // 2 - Filtrer par ville (optionnel)
    if ($request->filled('ville')) {
        $query->where('ville', 'like', '%' . $request->ville . '%');
    }

    // 3 - FILTRE GPS OBLIGATOIRE SI demandés (ou géré par l'API)
    if ($request->filled(['lat', 'lng'])) {
        $lat = $request->lat;
        $lng = $request->lng;
        $rayon = $request->get('rayon', 10); // Rayon par défaut réduit à 10km pour être plus précis

        $query->whereNotNull('latitude')
              ->whereNotNull('longitude')
              ->selectRaw("
                  garde_pharmacies.*,
                  (
                      6371 * acos(
                          cos(radians(?)) *
                          cos(radians(latitude)) *
                          cos(radians(longitude) - radians(?)) +
                          sin(radians(?)) *
                          sin(radians(latitude))
                      )
                  ) AS distance
              ", [$lat, $lng, $lat])
              ->having('distance', '<=', $rayon)
              ->orderBy('distance');
    } else {
        // Si aucune coordonnée n'est envoyée, on peut limiter ou renvoyer vide 
        // pour t'obliger à activer la géolocalisation si tu veux du "proche"
        $query->whereRaw('1 = 0'); // Vide la liste si pas de GPS
    }

    $pharmacies = $query->get();

    // Ajouter les liens GPS
    $pharmacies->transform(function($pharmacie) {
        if ($pharmacie->latitude && $pharmacie->longitude) {
            $pharmacie->map_url = "https://www.google.com/maps/dir/?api=1&destination=" . $pharmacie->latitude . "," . $pharmacie->longitude;
        } else {
            $pharmacie->map_url = null;
        }
        return $pharmacie;
    });

    return response()->json($pharmacies);
}}