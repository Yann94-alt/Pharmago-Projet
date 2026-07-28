<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use App\Models\Ordonnance;
use App\Models\notifications;
use Illuminate\Http\Request;

class ReservationController extends Controller
{

    /**
     * Liste des réservations selon le rôle
     */
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->role === 'patient') {

            $reservations = Reservation::where('user_id', $user->id)
                ->with([
                    'pharmacie',
                    'ordonnance',
                    'assurance',
                    'medicaments',
                    'facture'
                ])
                ->latest()
                ->get();

        } else {

            $pharmacieId = $user->pharmacie?->id;

            if (!$pharmacieId) {
                return response()->json([
                    'status' => false,
                    'message' => 'Aucune pharmacie associée à ce compte.'
                ], 404);
            }

            $reservations = Reservation::where('pharmacie_id', $pharmacieId)
                ->with([
                    'user',
                    'ordonnance',
                    'assurance',
                    'medicaments'
                ])
                ->latest()
                ->get();
        }


        return response()->json([
            'status' => true,
            'data' => $reservations
        ]);
    }
    public function store(Request $request)
    {

        $request->validate([

            'pharmacie_id' => 'required|exists:pharmacies,id',

            'assurance_id' => 'nullable|exists:assurances,id',

            'ordonnance' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',

            'note' => 'nullable|string'

        ]);
        $cheminOrdonnance = $request
            ->file('ordonnance')
            ->store('ordonnances', 'local');
        $ordonnance = Ordonnance::create([
            'user_id' => $request->user()->id,
            'fichier' => $cheminOrdonnance
        ]);
        $reservation = Reservation::create([

            'user_id' => $request->user()->id,

            'pharmacie_id' => $request->pharmacie_id,

            'ordonnance_id' => $ordonnance->id,

            'assurance_id' => $request->assurance_id,

            'note' => $request->note,

            'statut' => 'verification'

        ]);



        // Notification pharmacie

        notifications::create([

            'user_id' => $reservation->pharmacie->user_id,

            'titre' => 'Nouvelle ordonnance reçue',

            'message' => 'Un patient a envoyé une ordonnance à vérifier.',

            'type' => 'reservation',

            'data' => json_encode([

                'reservation_id' => $reservation->id

            ])

        ]);



        return response()->json([

            'status' => true,

            'message' => 'Votre ordonnance a été envoyée à la pharmacie.',

            'data' => $reservation->load([

                'pharmacie',
                'ordonnance',
                'assurance'

            ])

        ], 201);

    }   
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



        // Sécurité pharmacie

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

    }/**
 * Patient accepte la proposition de la pharmacie
 */
public function accepterProposition(Request $request, Reservation $reservation)
{
    $user = $request->user();
    if (
        $user->role !== 'patient'
        ||
        $reservation->user_id !== $user->id
    ) {

        return response()->json([
            'message' => 'Action non autorisée.'
        ],403);

    }
    if ($reservation->statut !== 'proposition') {

        return response()->json([

            'message' => 'Cette proposition n\'est plus disponible.'

        ],400);

    }
    // Le patient doit maintenant envoyer sa pièce d'identité

    $reservation->statut = 'attente_identite';

    $reservation->save();
    return response()->json([

        'status'=>true,

        'message'=>'Votre réservation est acceptée. Veuillez envoyer votre pièce d\'identité.',

        'data'=>$reservation

    ]);

}
public function envoyerPieceIdentite(Request $request, Reservation $reservation)
{
    $request->validate([
        'piece_identite' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120'
    ]);


    $user = $request->user();


    if (
        $user->role !== 'patient'
        ||
        $reservation->user_id !== $user->id
    ) {

        return response()->json([
            'message'=>'Action non autorisée.'
        ],403);

    }


    if ($reservation->statut !== 'attente_identite') {

        return response()->json([
            'message'=>'Vous devez accepter la réservation avant.'
        ],400);

    }



    // Sauvegarde de la pièce d'identité

    $chemin = $request
        ->file('piece_identite')
        ->store('pieces_identite','local');


    $reservation->piece_identite = $chemin;

    $reservation->statut = 'confirmee';

    $reservation->save();



    return response()->json([

        'status'=>true,

        'message'=>'Votre identité a été vérifiée, réservation confirmée.',

        'data'=>$reservation

    ]);

}
public function annulerReservation(Request $request, Reservation $reservation)
{

    $user = $request->user();
    if (
        $user->role !== 'patient'
        ||
        $reservation->user_id !== $user->id
    ) {

        return response()->json([

            'message'=>'Action non autorisée.'

        ],403);

    }
    if (
        !in_array(
            $reservation->statut,
            ['proposition','attente_identite']
        )
    ){

        return response()->json([

            'message'=>'Cette réservation ne peut plus être annulée.'

        ],400);

    }
    $reservation->statut='annulee';

    $reservation->save();
    notifications::create([

        'user_id'=>$reservation->pharmacie->user_id,

        'titre'=>'Réservation annulée',

        'message'=>'Le patient a annulé la réservation.',

        'type'=>'reservation',

        'data'=>json_encode([

            'reservation_id'=>$reservation->id

        ])

    ]);
    return response()->json([

        'status'=>true,

        'message'=>'Votre réservation a été annulée.'

    ]);
}
/**
 * Patient envoie sa pièce d'identité
 * Confirmation finale + facture
 */
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