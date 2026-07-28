<?php

namespace App\Http\Controllers\API;
use App\Models\Reservation;
use App\Models\Ordonnance;
use App\Models\notifications;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ReservationPharmacieController extends Controller
{
    public function show(Request $request, Reservation $reservation)
    {

        $user = $request->user();



        // Sécurité patient

        if (
            $user->role === 'patient'
            &&
            $reservation->user_id !== $user->id
        ) {

            return response()->json([

                'message' => 'Accès refusé.'

            ], 403);
        }
        if (
            $user->role === 'pharmacie'
            &&
            $reservation->pharmacie_id !== $user->pharmacie?->id
        ) {
            return response()->json([
                'message' => 'Accès refusé.'

            ], 403);

        }

        $reservation->load([

            'user',
            'pharmacie',
            'ordonnance',
            'assurance',
            'medicaments',
            'facture'

        ]);



        return response()->json([

            'status' => true,

            'data' => $reservation

        ]);

    }
    public function analyserReservation(Request $request, Reservation $reservation)
    {

        $request->validate([


            'medicaments' => 'required|array',


            'medicaments.*.nom' => 'required|string',


            'medicaments.*.quantite' => 'required|integer|min:1',


            'medicaments.*.prix' => 'required|numeric|min:0',


            'medicaments.*.disponible' => 'required|boolean',


            'montant_total' => 'required|numeric|min:0',


            'montant_assurance' => 'nullable|numeric|min:0',


            'reste_patient' => 'required|numeric|min:0'

        ]);
        $user = $request->user();
        if (
            $user->role !== 'pharmacie'
            ||
            $reservation->pharmacie_id !== $user->pharmacie?->id
        ) {

            return response()->json([

                'message' => 'Action non autorisée.'

            ],403);
        }
        $reservation->medicaments()->detach();
        foreach ($request->medicaments as $medicament) {


            $reservation->medicaments()->attach(

                null,

                [

                    'nom' => $medicament['nom'],

                    'quantite' => $medicament['quantite'],

                    'prix' => $medicament['prix'],

                    'disponible' => $medicament['disponible']

                ]

            );

        }
        $reservation->montant_total = $request->montant_total;
        $reservation->montant_assurance = $request->montant_assurance ?? 0;
        $reservation->reste_patient = $request->reste_patient;
        $reservation->statut = 'proposition';
        $reservation->save();
        notifications::create([
            'user_id' => $reservation->user_id,

            'titre' => 'Votre ordonnance a été analysée',

            'message' => 'La pharmacie a préparé une proposition pour votre réservation.',

            'type' => 'reservation',

            'data' => json_encode([

                'reservation_id' => $reservation->id

            ])

        ]);
        return response()->json([

            'status' => true,

            'message' => 'Proposition envoyée au patient.',

            'data' => $reservation->load('medicaments')

        ]);

    }
    public function confirmer(Request $request, Reservation $reservation)
{
    $request->validate([

        'carte_identite'=>'required|file|mimes:jpg,jpeg,png,pdf|max:5120'

    ]);
    $user=$request->user();
    if (
        $user->role !== 'patient'
        ||
        $reservation->user_id !== $user->id
    ){

        return response()->json([

            'message'=>'Action non autorisée.'

        ],403);

    }
    if ($reservation->statut !== 'attente_identite') {
        return response()->json([

            'message'=>'Vous devez accepter la proposition avant.'

        ],400);


    }
    $chemin = $request
        ->file('carte_identite')
        ->store('cartes_identite','local');
    $reservation->carte_identite = $chemin;

    $reservation->statut='confirmee';

    $reservation->save();
    notifications::create([

        'user_id'=>$reservation->pharmacie->user_id,

        'titre'=>'Réservation confirmée',

        'message'=>'Le patient a confirmé la réservation avec sa pièce d\'identité.',

        'type'=>'reservation',

        'data'=>json_encode([

            'reservation_id'=>$reservation->id

        ])

    ]);
    return response()->json([

        'status'=>true,

        'message'=>'Réservation confirmée.',

        'data'=>$reservation

    ]);

}
public function updateStatut(Request $request, Reservation $reservation)
{

    $request->validate([

        'statut'=>'required|in:prete,remise'

    ]);
    $user=$request->user();
    if(
        $user->role !== 'pharmacie'
        ||
        $reservation->pharmacie_id !== $user->pharmacie?->id
    ){

        return response()->json([

            'message'=>'Action non autorisée.'

        ],403);

    }
    $reservation->statut=$request->statut;
    $reservation->save();
    notifications::create([
        'user_id'=>$reservation->user_id,
        'titre'=>'Mise à jour réservation',
        'message'=>'Votre réservation est maintenant '.$request->statut.'.',
        'type'=>'reservation',
        'data'=>json_encode([
            'reservation_id'=>$reservation->id,
            'statut'=>$request->statut
        ])
    ]);
    return response()->json([
        'status'=>true,
        'message'=>'Statut mis à jour.',
        'data'=>$reservation
    ]);
}
}
