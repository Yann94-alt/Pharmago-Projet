<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Facture;
use App\Models\bon_assurances; 
use App\Models\notifications;  
use App\Models\QrCode;         
use App\Models\Reservation;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class FactureController extends Controller
{
   
    public function store(Request $request)
    {
        // 🔄 Validation
        $request->validate([
            'reservation_id'         => 'required|exists:reservations,id',
            'montant_total'          => 'required|numeric|min:0',
            'avec_bon'               => 'boolean',
            'montant_pris_en_charge' => 'required_if:avec_bon,true|numeric|min:0',
        ], [
            'reservation_id.required'         => 'La réservation est obligatoire.',
            'reservation_id.exists'           => 'La réservation sélectionnée n\'existe pas.',
            'montant_total.required'          => 'Le montant total est obligatoire.',
            'montant_total.numeric'           => 'Le montant total doit être un nombre.',
            'montant_pris_en_charge.required_if' => 'Le montant pris en charge est obligatoire lorsque vous utilisez un bon d\'assurance.',
        ]);

        // 1. Récupérer la réservation
        $reservation = Reservation::with('user')->find($request->reservation_id);

        if ($reservation === null) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Réservation introuvable.'
            ], 404);
        }

        // 🛡️ SÉCURITÉ
        if ($reservation->pharmacie_id !== $request->user()->id && $request->user()->role === 'pharmacie') {
            return response()->json([
                'status'  => 'error',
                'message' => 'Action non autorisée pour cette pharmacie.'
            ], 403);
        }

        $montantTotal = $request->montant_total;
        
        // 2. PAR DÉFAUT (Sans bon)
        $montantAssurance = 0;
        $montantRestantAssurance = 0;
        $bonAssurance = null;

        // 3. LOGIQUE SI AVEC BON D'ASSURANCE
        if ($request->boolean('avec_bon')) {
            // L'assurance prend en charge ce qui est écrit sur le bon
            $montantAssurance = $request->montant_pris_en_charge;

            // Le montant restant du bon (ici s'il couvre tout ou pas, selon ta logique métier)
            // Si le bon est consommé entièrement pour cette facture, le reste devient 0
            $montantRestantAssurance = 0; 

            $nomComplet = null;
            if ($reservation->user) {
                $nomComplet = $reservation->user->nom . ' ' . $reservation->user->prenom;
            }

            // Création du Bon d'Assurance
            $bonAssurance = bon_assurances::create([
                'reservation_id'         => $reservation->id,
                'assurance_id'           => $reservation->assurance_id,
                'nom_beneficiaire'       => $nomComplet ?? 'Bénéficiaire Inconnu',
                'montant_pris_en_charge' => $request->montant_pris_en_charge,
                'montant_restant'        => $montantRestantAssurance,
            ]);
        }

        // 4. CALCUL AUTOMATIQUE DE LA PART PATIENT
        // Exemple : 15 000 - 8 000 = 7 000
        $montantPatient = $montantTotal - $montantAssurance;

        // Sécurité au cas où le montant pris en charge dépasse le total de la facture
        if ($montantPatient < 0) {
            $montantAssurance = $montantTotal; // L'assurance ne peut pas payer plus que le total
            $montantPatient = 0; // Le patient ne paye rien
        }

        // ==========================================
        // 5. CRÉATION DE LA FACTURE
        // ==========================================
        $idDuBon = $bonAssurance ? $bonAssurance->id : null;
        $numeroFacture = 'FAC-' . strtoupper(Str::random(8));

        $facture = Facture::create([
            'reservation_id'    => $reservation->id,
            'pharmacie_id'      => $reservation->pharmacie_id,
            'bon_assurance_id'  => $idDuBon,
            'montant_total'     => $montantTotal,
            'montant_assurance' => $montantAssurance, // Va maintenant valoir 8000 !
            'montant_patient'   => $montantPatient,   // Va maintenant valoir 7000 !
            'numero_facture'    => $numeroFacture,
        ]);

        // QR CODE
        $qrCode = QrCode::create([
            'reservation_id' => $reservation->id,
            'code'           => (string) Str::uuid(),
            'expires_at'     => now()->addDays(3),
        ]);

        // Notification
        $donneesNotification = [
            'facture_id'      => $facture->id,
            'qr_code'         => $qrCode->code,
            'montant_patient' => $montantPatient,
        ];

        notifications::create([ 
            'user_id' => $reservation->user_id,
            'titre'   => 'Facture disponible',
            'message' => 'Votre facture et QR Code sont disponibles.',
            'type'    => 'facture',
            'data'    => json_encode($donneesNotification),
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Facture et QR Code générés avec succès.',
            'data'    => [
                'facture'       => $facture,
                'bon_assurance' => $bonAssurance,
                'qr_code'       => $qrCode
            ]
        ], 201);
    }

    public function show(Request $request, Facture $facture)
    {
        $userConnecte = $request->user();

        $estLePatientProprietaire = false;
        $estLaPharmacieProprietaire = false;

        // Vérification pour le Patient
        if ($userConnecte->role === 'patient') {
            if ($facture->reservation && $facture->reservation->user_id === $userConnecte->id) {
                $estLePatientProprietaire = true;
            }
        }

        // Vérification pour la Pharmacie
        if ($userConnecte->role === 'pharmacie') {
            if ($facture->pharmacie_id === $userConnecte->id) {
                $estLaPharmacieProprietaire = true;
            }
        }

        // Si ce n'est NI l'un NI l'autre, on refuse l'accès
        if ($estLePatientProprietaire === false && $estLaPharmacieProprietaire === false) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Accès refusé à cette ressource.'
            ], 403);
        }

        // Si l'accès est validé, on charge les détails importants
        $facture->load([
            'reservation:id,user_id,pharmacie_id,statut', 
            'reservation.user:id,nom,prenom,telephone', 
            'bonAssurance'
        ]);

        return response()->json([
            'status' => 'success',
            'data'   => $facture
        ], 200);
    }
}