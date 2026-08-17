<?php

namespace App\Http\Controllers\API;
use App\Models\Reservation;
use App\Models\Ordonnance;
use App\Models\notifications;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Beneficiaire;
use Illuminate\Support\Facades\Storage;
use App\Models\Assurance;

class ReservationPatientController extends Controller
{


public function documents(Request $request, Reservation $reservation)
{
    $user = $request->user();

    if (
        $user->role !== 'pharmacie' ||
        $reservation->pharmacie_id !== $user->pharmacie?->id
    ) {
        return response()->json([
            'message' => 'Accès refusé.'
        ], 403);
    }

    $reservation->load('ordonnance');

    return response()->json([
        'status' => true,

        'ordonnance' => $reservation->ordonnance
            ? $reservation->ordonnance->fichier
            : null,

        'carte_assurance' => $reservation->carte_assurance,

        'carte_identite' => $reservation->carte_identite,
    ]);
}

   public function store(Request $request)
{
    $request->validate([
        'pharmacie_id' => 'required|exists:pharmacies,id',

        'beneficiaire_id' => 'nullable|exists:beneficiaires,id',

        'ordonnance' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',

        'carte_assurance' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',

        'note' => 'nullable|string',
    ]);

    $user = $request->user();

    /*
    |--------------------------------------------------------------------------
    | Vérifier le bénéficiaire
    |--------------------------------------------------------------------------
    */

    if ($request->filled('beneficiaire_id')) {

        $beneficiaire = Beneficiaire::where('id', $request->beneficiaire_id)
            ->where('user_id', $user->id)
            ->first();

        if (!$beneficiaire) {
            return response()->json([
                'status' => false,
                'message' => 'Ce bénéficiaire ne vous appartient pas.'
            ], 403);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Upload ordonnance
    |--------------------------------------------------------------------------
    */

    $cheminOrdonnance = $request
        ->file('ordonnance')
        ->store('ordonnances', 'local');

    $ordonnance = Ordonnance::create([
        'user_id' => $user->id,
        'fichier' => $cheminOrdonnance
    ]);

    /*
    |--------------------------------------------------------------------------
    | Upload carte d'assurance
    |--------------------------------------------------------------------------
    */

    $cheminCarteAssurance = null;

    if ($request->hasFile('carte_assurance')) {

        $cheminCarteAssurance = $request
            ->file('carte_assurance')
            ->store('cartes_assurance_reservations', 'local');
    }

    /*
    |--------------------------------------------------------------------------
    | Création de la réservation
    |--------------------------------------------------------------------------
    */

    $reservation = Reservation::create([
        'user_id' => $user->id,

        'beneficiaire_id' => $request->beneficiaire_id,

        'pharmacie_id' => $request->pharmacie_id,

        'ordonnance_id' => $ordonnance->id,

        'carte_assurance' => $cheminCarteAssurance,

        'note' => $request->note,

        'statut' => 'verification'
    ]);

    /*
    |--------------------------------------------------------------------------
    | Notification pharmacie
    |--------------------------------------------------------------------------
    */

    notifications::create([
        'user_id' => $reservation->pharmacie->user_id,

        'titre' => 'Nouvelle ordonnance reçue',

        'message' => $reservation->beneficiaire_id
            ? 'Une ordonnance pour un bénéficiaire a été reçue.'
            : 'Un patient a envoyé une ordonnance à vérifier.',

        'type' => 'reservation',

        'data' => json_encode([
            'reservation_id' => $reservation->id
        ])
    ]);

    /*
    |--------------------------------------------------------------------------
    | Réponse
    |--------------------------------------------------------------------------
    */

    return response()->json([
        'status' => true,

        'message' => 'Votre ordonnance a été envoyée à la pharmacie.',

        'data' => $reservation->load([
            'pharmacie',
            'ordonnance',
            'beneficiaire'
        ])
    ], 201);
}
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
}
