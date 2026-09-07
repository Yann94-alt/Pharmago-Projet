<?php

namespace App\Http\Controllers\API;
use App\Models\Reservation;
use App\Models\Ordonnance;
use App\Models\medicament;
use App\Models\notifications;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use App\Mail\ReservationPrete;
use Illuminate\Support\Facades\Mail;
use App\Events\ReservationStatusUpdated;
use App\Events\NotificationCreated;

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

            'bon' =>
                $reservation->bon,

            default => null,
        };

        if (!$path) {
            return response()->json([
                'message' => 'Document introuvable.'
            ], 404);
        }

        // Vérifier que le fichier existe
        if (!Storage::disk('local')->exists($path)) {
            return response()->json([
                'message' =>
                    'Le fichier n’existe pas dans le stockage privé.',
                'path' => $path
            ], 404);
        }

        // Retourner directement le fichier
        return response()->file(
            Storage::disk('local')->path($path)
        );
    }

    public function documents(
        Request $request,
        Reservation $reservation
    ) {
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

            'ordonnance' =>
                !empty($reservation->ordonnance?->fichier),

            'assurance' =>
                !empty($reservation->carte_assurance),

            'bon' =>
                !empty($reservation->bon),
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

        // Récupérer la pharmacie
        $pharmacie = $user->pharmacie;

        if (!$pharmacie) {
            return response()->json([
                'status' => false,
                'message' =>
                    'Aucune pharmacie associée à ce compte.'
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

    public function show(
        Request $request,
        Reservation $reservation
    ) {
        $user = $request->user();

        // Sécurité patient
        if (
            $user->role === 'patient' &&
            $reservation->user_id !== $user->id
        ) {
            return response()->json([
                'message' => 'Accès refusé.'
            ], 403);
        }

        // Sécurité pharmacie
        if (
            $user->role === 'pharmacie' &&
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
            'beneficiaire',
            'medicaments',
            'facture'
        ]);

        return response()->json([
            'status' => true,
            'data' => $reservation
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Analyse de l'ordonnance par la pharmacie
    |--------------------------------------------------------------------------
    */

    public function analyserReservation(
    Request $request,
    Reservation $reservation
) {
    $validated = $request->validate([
        'medicaments' => 'required|array|min:1',

        'medicaments.*.medicament_id' =>
            'required|integer|exists:medicaments,id',

        'medicaments.*.quantite' =>
            'required|integer|min:1',

        'medicaments.*.prix_unitaire' =>
            'required|numeric|min:0',

        'medicaments.*.disponible' =>
            'nullable|boolean',

        'medicaments.*.sur_bon' =>
            'nullable|boolean',

        'montant_total' =>
            'required|numeric|min:0',

        'montant_assurance' =>
            'nullable|numeric|min:0',

        'reste_patient' =>
            'required|numeric|min:0',
    ]);

    $user = $request->user();

    if (
        !$user ||
        $user->role !== 'pharmacie' ||
        $reservation->pharmacie_id !== $user->pharmacie?->id
    ) {
        return response()->json([
            'status' => false,
            'message' => 'Action non autorisée.',
        ], 403);
    }

    /*
    |--------------------------------------------------------------------------
    | Vérifier le statut
    |--------------------------------------------------------------------------
    */

    if ($reservation->statut !== 'en_attente') {
        return response()->json([
            'status' => false,
            'message' =>
                'Cette réservation a déjà été analysée.',
        ], 400);
    }

    $montantTotal =
        (float) $validated['montant_total'];

    $montantAssurance =
        (float) (
            $validated['montant_assurance'] ?? 0
        );

    $restePatient =
        (float) $validated['reste_patient'];

    if ($montantAssurance > $montantTotal) {
        return response()->json([
            'status' => false,
            'message' =>
                "Le montant de l'assurance ne peut pas dépasser le montant total.",
        ], 422);
    }

    if ($restePatient > $montantTotal) {
        return response()->json([
            'status' => false,
            'message' =>
                "Le reste à payer ne peut pas dépasser le montant total.",
        ], 422);
    }

    try {

        DB::beginTransaction();

        /*
        |--------------------------------------------------------------------------
        | MÉDICAMENTS
        |--------------------------------------------------------------------------
        */

        $reservation->medicaments()->sync(
            collect($validated['medicaments'])
                ->mapWithKeys(function ($medicament) {

                    return [
                        $medicament['medicament_id'] => [

                            'quantite' =>
                                $medicament['quantite'],

                            'prix_unitaire' =>
                                $medicament['prix_unitaire'],

                            /*
                            |--------------------------------------------------------------------------
                            | IMPORTANT
                            | disponible = 0 si le médicament est en rupture
                            |--------------------------------------------------------------------------
                            */

                            'disponible' =>
                                $medicament['disponible']
                                ?? true,

                            'sur_bon' =>
                                $medicament['sur_bon']
                                ?? false,
                        ],
                    ];
                })
                ->toArray()
        );

        /*
        |--------------------------------------------------------------------------
        | MONTANTS
        |--------------------------------------------------------------------------
        */

        $reservation->montant_total =
            $montantTotal;

        $reservation->montant_assurance =
            $montantAssurance;

        $reservation->reste_patient =
            $restePatient;

        /*
        |--------------------------------------------------------------------------
        | PROPOSITION DISPONIBLE
        |--------------------------------------------------------------------------
        */

        $reservation->statut = 'acceptee';

        $reservation->save();

        /*
        |--------------------------------------------------------------------------
        | ÉVÉNEMENT TEMPS RÉEL — STATUT
        |--------------------------------------------------------------------------
        */

        event(
            new ReservationStatusUpdated(
                $reservation->fresh()
            )
        );

        /*
        |--------------------------------------------------------------------------
        | RÉCUPÉRER LES MÉDICAMENTS EN RUPTURE
        |--------------------------------------------------------------------------
        */

        $medicamentsIndisponibles = collect(
            $validated['medicaments']
        )
            ->filter(function ($medicament) {

                return isset($medicament['disponible'])
                    && (int) $medicament['disponible'] === 0;

            })
            ->map(function ($medicament) {

                $medicamentBase = medicament::find(
                    $medicament['medicament_id']
                );

                return $medicamentBase?->nom;

            })
            ->filter()
            ->values();

        /*
        |--------------------------------------------------------------------------
        | CONSTRUIRE LE MESSAGE
        |--------------------------------------------------------------------------
        */

        if ($medicamentsIndisponibles->count() > 0) {

            $listeRupture =
                $medicamentsIndisponibles->implode(', ');

            $messageNotification =
                'La pharmacie a analysé votre ordonnance. '
                . 'Les médicaments suivants sont actuellement en rupture : '
                . $listeRupture
                . '. Consultez la proposition pour plus de détails.';

        } else {

            $messageNotification =
                'La pharmacie a analysé votre ordonnance '
                . 'et a préparé une proposition.';

        }

        /*
        |--------------------------------------------------------------------------
        | NOTIFICATION PATIENT
        |--------------------------------------------------------------------------
        */

        $notificationPatient = notifications::create([

            'user_id' =>
                $reservation->user_id,

            'titre' =>
                'Votre ordonnance a été analysée',

            'message' =>
                $messageNotification,

            'type' =>
                'reservation',

            'data' => [

                'reservation_id' =>
                    $reservation->id,

                'statut' =>
                    'acceptee',

                /*
                |--------------------------------------------------------------------------
                | On enregistre également les médicaments indisponibles
                |--------------------------------------------------------------------------
                */

                'medicaments_indisponibles' =>
                    $medicamentsIndisponibles->values()->toArray(),
            ],
        ]);

        DB::commit();

        /*
        |--------------------------------------------------------------------------
        | 🔔 ENVOI TEMPS RÉEL AU PATIENT
        |--------------------------------------------------------------------------
        */

        event(
            new NotificationCreated(
                $notificationPatient
            )
        );

        /*
        |--------------------------------------------------------------------------
        | RÉPONSE
        |--------------------------------------------------------------------------
        */

        return response()->json([

            'status' =>
                true,

            'message' =>
                'La réservation a été analysée avec succès.',

            'reservation' =>
                $reservation->fresh()->load([
                    'medicaments',
                    'pharmacie',
                    'user',
                    'beneficiaire',
                    'ordonnance',
                    'assurance',
                ]),
        ]);

    } catch (\Throwable $e) {

        DB::rollBack();

        return response()->json([

            'status' =>
                false,

            'message' =>
                "Erreur lors de l'analyse de la réservation.",

            'error' =>
                $e->getMessage(),

        ], 500);
    }
}

    public function historiqueReservations(
        Request $request
    ) {
        $user = $request->user();

        // Vérifier que l'utilisateur est une pharmacie
        if (
            !$user ||
            $user->role !== 'pharmacie'
        ) {
            return response()->json([
                'status' => false,
                'message' => 'Accès non autorisé.'
            ], 403);
        }

        // Vérifier que la pharmacie existe
        $pharmacie = $user->pharmacie;

        if (!$pharmacie) {
            return response()->json([
                'status' => false,
                'message' =>
                    'Aucune pharmacie associée à ce compte.'
            ], 404);
        }

        $query = Reservation::where(
            'pharmacie_id',
            $pharmacie->id
        )
            ->with([
                'user',
                'beneficiaire',
                'ordonnance',
                'medicaments',
            ])
            ->orderByDesc('created_at');

        // Filtre par année
        if ($request->filled('annee')) {
            $query->whereYear(
                'created_at',
                $request->annee
            );
        }

        // Filtre par mois
        if ($request->filled('mois')) {
            $query->whereMonth(
                'created_at',
                $request->mois
            );
        }

        $reservations = $query->paginate(15);

        return response()->json([
            'status' => true,
            'data' => $reservations,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Mettre une réservation à "prête"
    |--------------------------------------------------------------------------
    */

    public function updateStatut(
        Request $request,
        Reservation $reservation
    ) {
        $request->validate([
            'statut' => 'required|in:prete'
        ]);

        $user = $request->user();

        /*
        |--------------------------------------------------------------------------
        | Vérification pharmacie
        |--------------------------------------------------------------------------
        */

        if (
            !$user ||
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
        | Vérifier la confirmation du patient
        |--------------------------------------------------------------------------
        */

        if ($reservation->statut !== 'confirmee') {
            return response()->json([
                'status' => false,
                'message' =>
                    "La réservation doit être confirmée par le patient avant de pouvoir être mise en préparation."
            ], 400);
        }

        /*
        |--------------------------------------------------------------------------
        | Passage à PRÊTE
        |--------------------------------------------------------------------------
        */

        $reservation->statut = 'prete';

        $reservation->save();

        /*
        |--------------------------------------------------------------------------
        | 🔴 ÉVÉNEMENT TEMPS RÉEL — STATUT
        |--------------------------------------------------------------------------
        */

        event(
            new ReservationStatusUpdated(
                $reservation->fresh()
            )
        );

        /*
        |--------------------------------------------------------------------------
        | Notification dans l'application
        |--------------------------------------------------------------------------
        */

        $notificationPatient = notifications::create([
            'user_id' =>
                $reservation->user_id,

            'titre' =>
                'Réservation prête',

            'message' =>
                'Votre réservation est prête. Vous pouvez passer à la pharmacie pour récupérer vos médicaments.',

            'type' =>
                'reservation',

            'data' => [
                'reservation_id' =>
                    $reservation->id,

                'statut' =>
                    'prete',
            ]
        ]);

        /*
        |--------------------------------------------------------------------------
        | 🔔 BROADCAST TEMPS RÉEL
        |--------------------------------------------------------------------------
        */

        event(
            new NotificationCreated(
                $notificationPatient
            )
        );

        /*
        |--------------------------------------------------------------------------
        | Email au patient
        |--------------------------------------------------------------------------
        */

        $reservation->load([
            'user',
            'pharmacie',
            'medicaments'
        ]);

        if (
            $reservation->user &&
            !empty($reservation->user->email)
        ) {
            Mail::to($reservation->user->email)
                ->send(
                    new ReservationPrete(
                        $reservation
                    )
                );
        }

        /*
        |--------------------------------------------------------------------------
        | Réponse
        |--------------------------------------------------------------------------
        */

        return response()->json([
            'status' => true,

            'message' =>
                'La réservation est maintenant prête. Le patient a été notifié par l’application et par email.',

            'data' =>
                $reservation
        ]);
    }
}
