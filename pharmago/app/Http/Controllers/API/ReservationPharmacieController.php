<?php

namespace App\Http\Controllers\API;
use App\Models\Reservation;
use App\Models\Ordonnance;
use App\Models\medicament;
use App\Models\notifications;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ReservationPharmacieController extends Controller
{
public function document(
    Request $request,
    Reservation $reservation,
    string $type
) {
    $user = $request->user();

    // Vérifier que c'est bien la pharmacie concernée
    if (
        $user->role !== 'pharmacie' ||
        $reservation->pharmacie_id !== $user->pharmacie?->id
    ) {
        return response()->json([
            'message' => 'Accès refusé.'
        ], 403);
    }

    $reservation->load('ordonnance');

    // Déterminer le chemin du fichier
    $path = match ($type) {

        'ordonnance' =>
            $reservation->ordonnance?->fichier,

        'assurance' =>
            $reservation->carte_assurance,

        'identite' =>
            $reservation->carte_identite,

        default => null,
    };

    if (!$path) {
        return response()->json([
            'message' => 'Document introuvable.'
        ], 404);
    }

    // Vérifier que le fichier existe dans storage/app/private
    if (!Storage::disk('local')->exists($path)) {
        return response()->json([
            'message' => 'Le fichier n’existe pas dans le stockage privé.',
            'path' => $path
        ], 404);
    }

    // Retourner directement le fichier
    return response()->file(
        Storage::disk('local')->path($path)
    );
}

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

    public function index(Request $request)
{
    $user = $request->user();

    // Vérifier que l'utilisateur est bien une pharmacie
    if ($user->role !== 'pharmacie') {
        return response()->json([
            'status' => false,
            'message' => 'Accès non autorisé.'
        ], 403);
    }

    // Récupérer la pharmacie de l'utilisateur connecté
    $pharmacie = $user->pharmacie;

    if (!$pharmacie) {
        return response()->json([
            'status' => false,
            'message' => 'Aucune pharmacie associée à ce compte.'
        ], 404);
    }

    // Récupérer uniquement les réservations de cette pharmacie
    $reservations = Reservation::where(
        'pharmacie_id',
        $pharmacie->id
    )
    ->with([
        'user',
        'pharmacie',
        'ordonnance',
        'assurance',
        'beneficiaire',
        'medicaments',
        'facture'
    ])
    ->latest()
    ->get();

    return response()->json([
        'status' => true,
        'data' => $reservations
    ]);
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
        'beneficiaire', // ✅ AJOUT
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
    /*
    |--------------------------------------------------------------------------
    | Validation
    |--------------------------------------------------------------------------
    */

    $request->validate([
        'medicaments' => 'required|array|min:1',

        'medicaments.*.medicament_id'
            => 'required|integer|exists:medicaments,id',

        'medicaments.*.quantite'
            => 'required|integer|min:1',

        'medicaments.*.prix_unitaire'
            => 'required|numeric|min:0',

        'montant_total'
            => 'required|numeric|min:0',

        'montant_assurance'
            => 'nullable|numeric|min:0',

        'reste_patient'
            => 'required|numeric|min:0',
    ]);

    /*
    |--------------------------------------------------------------------------
    | Vérification pharmacie
    |--------------------------------------------------------------------------
    */

    $user = $request->user();

    if (
        $user->role !== 'pharmacie' ||
        $reservation->pharmacie_id !== $user->pharmacie?->id
    ) {
        return response()->json([
            'status' => false,
            'message' => 'Action non autorisée.'
        ], 403);
    }

    /*
    |--------------------------------------------------------------------------
    | Supprimer les anciens médicaments
    |--------------------------------------------------------------------------
    */

    $reservation->medicaments()->detach();

    /*
    |--------------------------------------------------------------------------
    | Ajouter les médicaments
    |--------------------------------------------------------------------------
    */

    foreach ($request->medicaments as $medicament) {

        $reservation->medicaments()->attach(
            $medicament['medicament_id'],
            [
                'quantite' => $medicament['quantite'],
                'prix_unitaire' => $medicament['prix_unitaire'],
            ]
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Montants
    |--------------------------------------------------------------------------
    */

    $reservation->montant_total = $request->montant_total;

    $reservation->montant_assurance =
        $request->montant_assurance ?? 0;

    $reservation->reste_patient =
        $request->reste_patient;

    /*
    |--------------------------------------------------------------------------
    | Statut
    |--------------------------------------------------------------------------
    */

    $reservation->statut = 'proposition';

    $reservation->save();

    /*
    |--------------------------------------------------------------------------
    | Notification patient
    |--------------------------------------------------------------------------
    */

    notifications::create([
        'user_id' => $reservation->user_id,

        'titre' => 'Votre ordonnance a été analysée',

        'message' =>
            'La pharmacie a analysé votre ordonnance et a préparé une proposition.',

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

        'message' =>
            'Proposition envoyée au patient.',

        'data' => $reservation->load([
            'medicaments',
            'user',
            'beneficiaire',
        ])
    ]);
}
  public function confirmer(Request $request, Reservation $reservation)
{
    // La pièce d'identité est toujours obligatoire
    $request->validate([
        'carte_identite' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
    ]);

    $user = $request->user();

    // Vérifier que la réservation appartient bien au patient connecté
    if (
        $user->role !== 'patient'
        ||
        $reservation->user_id !== $user->id
    ) {
        return response()->json([
            'message' => 'Action non autorisée.'
        ], 403);
    }

    // Vérifier que la proposition a été acceptée
    if ($reservation->statut !== 'attente_identite') {
        return response()->json([
            'message' => 'Vous devez accepter la proposition avant.'
        ], 400);
    }

    /*
    |--------------------------------------------------------------------------
    | Vérifier les médicaments
    |--------------------------------------------------------------------------
    */

    $reservation->load([
        'medicaments',
        'beneficiaire'
    ]);

    $assuranceRequise = $reservation->medicaments->contains(function ($medicament) {
        return (bool) $medicament->pivot->sur_bon === true;
    });

    /*
    |--------------------------------------------------------------------------
    | Si c'est une réservation pour un bénéficiaire
    |--------------------------------------------------------------------------
    */

    if ($reservation->beneficiaire_id) {

        // La carte d'assurance devait déjà être envoyée
        // lors de la création de la réservation.
        if (!$reservation->carte_assurance) {
            return response()->json([
                'message' => 'La carte d’assurance du bénéficiaire est manquante.'
            ], 422);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Si l'assurance est nécessaire
    |--------------------------------------------------------------------------
    */

    if ($assuranceRequise && !$reservation->carte_assurance) {
        return response()->json([
            'message' => 'La carte d’assurance est manquante pour cette réservation.'
        ], 422);
    }

    /*
    |--------------------------------------------------------------------------
    | Enregistrer la pièce d'identité
    |--------------------------------------------------------------------------
    */

    $cheminIdentite = $request
        ->file('carte_identite')
        ->store('cartes_identite', 'local');

    $reservation->carte_identite = $cheminIdentite;

    /*
    |--------------------------------------------------------------------------
    | Confirmer la réservation
    |--------------------------------------------------------------------------
    */

    $reservation->statut = 'confirmee';

    $reservation->save();

    /*
    |--------------------------------------------------------------------------
    | Notification pharmacie
    |--------------------------------------------------------------------------
    */

    notifications::create([
        'user_id' => $reservation->pharmacie->user_id,

        'titre' => 'Réservation confirmée',

        'message' => $reservation->beneficiaire_id
            ? 'Le bénéficiaire a envoyé sa pièce d’identité. La réservation est confirmée.'
            : 'Le patient a envoyé sa pièce d’identité. La réservation est confirmée.',

        'type' => 'reservation',

        'data' => json_encode([
            'reservation_id' => $reservation->id
        ])
    ]);

    return response()->json([
        'status' => true,

        'message' => 'Réservation confirmée.',

        'data' => $reservation->load([
            'medicaments',
            'beneficiaire'
        ])
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
