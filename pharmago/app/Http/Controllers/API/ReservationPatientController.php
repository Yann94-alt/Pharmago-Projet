<?php

namespace App\Http\Controllers\API;

use App\Events\NotificationCreated;
use App\Events\ReservationCreated;
use App\Http\Controllers\Controller;
use App\Models\Assurance;
use App\Models\Beneficiaire;
use App\Models\notifications;
use App\Models\Ordonnance;
use App\Models\Reservation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

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

            'bon' => $reservation->bon,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Créer une demande de réservation
    |--------------------------------------------------------------------------
    */

    public function store(Request $request)
    {
        $request->validate([
            'pharmacie_id' =>
                'required|exists:pharmacies,id',

            'beneficiaire_id' =>
                'nullable|exists:beneficiaires,id',

            'ordonnance' =>
                'required|file|mimes:jpg,jpeg,png,pdf|max:5120',

            'carte_assurance' =>
                'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',

            'bon' =>
                'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',

            'note' =>
                'nullable|string',
        ]);

        $user = $request->user();

        /*
        |--------------------------------------------------------------------------
        | VÉRIFICATION DU BÉNÉFICIAIRE
        |--------------------------------------------------------------------------
        */

        if ($request->filled('beneficiaire_id')) {
            $beneficiaire = Beneficiaire::where(
                'id',
                $request->beneficiaire_id
            )
                ->where(
                    'user_id',
                    $user->id
                )
                ->first();

            if (!$beneficiaire) {
                return response()->json([
                    'status' => false,
                    'message' =>
                        'Ce bénéficiaire ne vous appartient.'
                ], 403);
            }
        }

        /*
        |--------------------------------------------------------------------------
        | ENREGISTREMENT DE L'ORDONNANCE
        |--------------------------------------------------------------------------
        */

        $cheminOrdonnance = $request
            ->file('ordonnance')
            ->store(
                'ordonnances',
                'local'
            );

        $ordonnance = Ordonnance::create([
            'user_id' => $user->id,
            'fichier' => $cheminOrdonnance,
        ]);

        /*
        |--------------------------------------------------------------------------
        | CARTE ASSURANCE
        |--------------------------------------------------------------------------
        */

        $cheminCarteAssurance = null;

        if ($request->hasFile('carte_assurance')) {
            $cheminCarteAssurance = $request
                ->file('carte_assurance')
                ->store(
                    'cartes_assurance_reservations',
                    'local'
                );
        }

        /*
        |--------------------------------------------------------------------------
        | BON
        |--------------------------------------------------------------------------
        */

        $cheminBon = null;

        if ($request->hasFile('bon')) {
            $cheminBon = $request
                ->file('bon')
                ->store(
                    'bons_reservations',
                    'local'
                );
        }

        /*
        |--------------------------------------------------------------------------
        | CRÉATION DE LA RÉSERVATION
        |--------------------------------------------------------------------------
        */

        $reservation = Reservation::create([
            'user_id' =>
                $user->id,

            'beneficiaire_id' =>
                $request->beneficiaire_id,

            'pharmacie_id' =>
                $request->pharmacie_id,

            'ordonnance_id' =>
                $ordonnance->id,

            'carte_assurance' =>
                $cheminCarteAssurance,

            'bon' =>
                $cheminBon,

            'note' =>
                $request->note,

            'statut' =>
                'en_attente',
        ]);

        /*
        |--------------------------------------------------------------------------
        | NOTIFICATION DU PATIENT
        |--------------------------------------------------------------------------
        */

        $notificationPatient = notifications::create([
            'user_id' =>
                $user->id,

            'titre' =>
                'Réservation envoyée',

            'message' =>
                'Votre réservation est en cours de traitement. Vous serez notifié dès que la pharmacie aura analysé votre ordonnance.',

            'type' =>
                'reservation',

            'data' => [
                'reservation_id' =>
                    $reservation->id,

                'statut' =>
                    'en_attente',
            ],
        ]);

        // Envoi en temps réel au patient
        event(
            new NotificationCreated(
                $notificationPatient
            )
        );

        /*
        |--------------------------------------------------------------------------
        | NOTIFICATION DE LA PHARMACIE
        |--------------------------------------------------------------------------
        */

        $notificationPharmacie = notifications::create([
            'user_id' =>
                $reservation->pharmacie->user_id,

            'titre' =>
                'Nouvelle ordonnance reçue',

            'message' =>
                $reservation->beneficiaire_id
                    ? 'Une ordonnance pour un bénéficiaire a été reçue.'
                    : 'Un patient a envoyé une ordonnance à vérifier.',

            'type' =>
                'reservation',

            'data' => [
                'reservation_id' =>
                    $reservation->id,

                'statut' =>
                    'en_attente',
            ],
        ]);

        // Envoi en temps réel à la pharmacie
        event(
            new NotificationCreated(
                $notificationPharmacie
            )
        );

        /*
        |--------------------------------------------------------------------------
        | RÉPONSE
        |--------------------------------------------------------------------------
        */

        return response()->json([
            'status' => true,

            'message' =>
                'Votre ordonnance a été envoyée à la pharmacie.',

            'data' =>
                $reservation->load([
                    'pharmacie',
                    'ordonnance',
                    'beneficiaire',
                ]),
        ], 201);
    }

    /*
    |--------------------------------------------------------------------------
    | Afficher une réservation précise pour le patient
    |--------------------------------------------------------------------------
    */

    public function show(
        Request $request,
        Reservation $reservation
    ) {
        $user = $request->user();

        if (
            !$user ||
            $reservation->user_id !== $user->id
        ) {
            return response()->json([
                'status' => false,
                'message' =>
                    'Vous n’êtes pas autorisé à consulter cette réservation.',
            ], 403);
        }

        $reservation->load([
            'medicaments',
            'pharmacie',
            'ordonnance',
            'assurance',
            'beneficiaire',
        ]);

        return response()->json([
            'status' => true,
            'reservation' => $reservation,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Confirmer / réserver une proposition
    |--------------------------------------------------------------------------
    |
    | Flux :
    |
    | en_attente
    |      ↓
    | acceptee        ← pharmacie analyse
    |      ↓
    | confirmee       ← patient confirme / réserve
    |      ↓
    | prete           ← pharmacie prépare
    |      ↓
    | remise
    |
    */

    public function confirmerReservation(
        Request $request,
        Reservation $reservation
    ) {
        $user = $request->user();

        // Vérifier que c'est bien le patient propriétaire
        if (
            !$user ||
            $user->role !== 'patient' ||
            $reservation->user_id !== $user->id
        ) {
            return response()->json([
                'status' => false,
                'message' => 'Action non autorisée.',
            ], 403);
        }

        // La pharmacie doit avoir analysé la réservation
        if ($reservation->statut !== 'acceptee') {
            return response()->json([
                'status' => false,
                'message' =>
                    'Cette réservation ne peut pas être confirmée.',
            ], 400);
        }

        /*
        |--------------------------------------------------------------------------
        | Le patient confirme
        |--------------------------------------------------------------------------
        */

        $reservation->statut = 'confirmee';
        $reservation->save();

        /*
        |--------------------------------------------------------------------------
        | Notification à la pharmacie
        |--------------------------------------------------------------------------
        */

        $notificationPharmacie = notifications::create([
            'user_id' =>
                $reservation->pharmacie->user_id,

            'titre' =>
                'Réservation confirmée',

            'message' =>
                $reservation->beneficiaire_id
                    ? 'Le bénéficiaire a confirmé la réservation et souhaite récupérer les médicaments.'
                    : 'Le patient a confirmé la réservation et souhaite récupérer les médicaments.',

            'type' =>
                'reservation',

            'data' => [
                'reservation_id' =>
                    $reservation->id,

                'statut' =>
                    'confirmee',
            ],
        ]);

        // Envoi en temps réel à la pharmacie
        event(
            new NotificationCreated(
                $notificationPharmacie
            )
        );

        return response()->json([
            'status' => true,

            'message' =>
                'Votre réservation a été confirmée avec succès.',

            'data' => $reservation->load([
                'pharmacie',
                'ordonnance',
                'beneficiaire',
                'medicaments',
            ]),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Annuler une réservation
    |--------------------------------------------------------------------------
    */

    public function annulerReservation(
        Request $request,
        Reservation $reservation
    ) {
        $user = $request->user();

        /*
        |--------------------------------------------------------------------------
        | Vérifier le patient
        |--------------------------------------------------------------------------
        */

        if (
            !$user ||
            $user->role !== 'patient' ||
            $reservation->user_id !== $user->id
        ) {
            return response()->json([
                'status' => false,
                'message' => 'Action non autorisée.',
            ], 403);
        }

        /*
        |--------------------------------------------------------------------------
        | Vérifier que le patient peut encore annuler
        |--------------------------------------------------------------------------
        */

        if ($reservation->statut !== 'attente_confirmation') {
            return response()->json([
                'status' => false,
                'message' =>
                    'Cette réservation ne peut plus être annulée.',
            ], 400);
        }

        /*
        |--------------------------------------------------------------------------
        | Annuler
        |--------------------------------------------------------------------------
        */

        $reservation->statut = 'annulee';
        $reservation->save();

        /*
        |--------------------------------------------------------------------------
        | Notification pharmacie
        |--------------------------------------------------------------------------
        */

        $notificationPharmacie = notifications::create([
            'user_id' =>
                $reservation->pharmacie->user_id,

            'titre' =>
                'Réservation annulée',

            'message' =>
                'Le patient a annulé la demande de réservation.',

            'type' =>
                'reservation',

            'data' => [
                'reservation_id' =>
                    $reservation->id,

                'statut' =>
                    'annulee',
            ],
        ]);

        // Envoi en temps réel à la pharmacie
        event(
            new NotificationCreated(
                $notificationPharmacie
            )
        );

        /*
        |--------------------------------------------------------------------------
        | Réponse
        |--------------------------------------------------------------------------
        */

        return response()->json([
            'status' => true,

            'message' =>
                'Votre réservation a été annulée.',
        ]);
    }
}
