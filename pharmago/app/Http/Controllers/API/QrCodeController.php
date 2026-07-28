<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\QrCode;
use App\Models\Facture; // Ne pas oublier d'importer le modèle Facture
use Illuminate\Http\Request;

class QrCodeController extends Controller
{
    /**
     * POST /api/qrcodes/scanner
     * Scanner un QR code et récupérer les données de la facture exacte
     */
    public function scanner(Request $request)
    {
        // 🔄 Validation avec messages d'erreur traduits en français
        $request->validate([
            'code' => 'required|string'
        ], [
            'code.required' => 'Le code QR est obligatoire pour effectuer le scan.',
            'code.string'   => 'Le format du code QR doit être une chaîne de caractères valide.',
        ]);

        // 1. Trouver le QR Code valide
        $qrCode = QrCode::where('code', $request->code)
            ->where('utilise', false)
            ->where('expires_at', '>', now())
            ->first();

        if (!$qrCode) {
            return response()->json([
                'message' => 'QR code invalide ou expiré.'
            ], 404);
        }

        // 2. Récupérer la réservation liée
        $reservation = $qrCode->reservation;

        if (!$reservation) {
            return response()->json([
                'message' => 'Réservation introuvable pour ce QR Code.'
            ], 404);
        }

        // 3. Charger l'utilisateur et les médicaments sur la réservation
        $reservation->load(['user', 'medicaments']);

        // 4. SÉCURITÉ : Récupérer explicitement la facture LA PLUS RÉCENTE liée à cette réservation
        // Corrigé ici avec un underscore (_) au lieu de l'espace !
        $facture_exacte = Facture::where('reservation_id', $reservation->id)
            ->latest() 
            ->first();

        // On injecte manuellement la bonne facture calculée dans l'objet réservation
        $reservation->setRelation('facture', $facture_exacte);

        return response()->json([
            'message' => 'QR Code valide.',
            'reservation' => $reservation,
        ]);
    }

    /**
     * PUT /api/qrcodes/{code}/utiliser
     * Valider utilisation QR code
     */
    public function utiliser(Request $request, string $code)
    {
        $qrCode = QrCode::where('code', $code)->firstOrFail();

        // Vérification sécurité
        if ($qrCode->utilise) {
            return response()->json([
                'message' => 'QR code déjà utilisé.'
            ], 400);
        }

        if ($qrCode->expires_at < now()) {
            return response()->json([
                'message' => 'QR code expiré.'
            ], 400);
        }

        // Marquer comme utilisé
        $qrCode->update([
            'utilise' => true
        ]);

        // Mettre à jour réservation
        if ($qrCode->reservation) {
            $qrCode->reservation->update([
                'statut' => 'remise'
            ]);
        }

        return response()->json([
            'message' => 'Retrait confirmé.'
        ]);
    }
}