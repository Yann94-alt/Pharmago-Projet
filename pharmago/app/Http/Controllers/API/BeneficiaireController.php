<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Beneficiaire;
use Illuminate\Http\Request;

class BeneficiaireController extends Controller
{
    /**
     * GET /api/beneficiaires
     *
     * Récupérer les bénéficiaires de l'utilisateur connecté.
     */
    public function index(Request $request)
    {
        $beneficiaires = Beneficiaire::where(
            'user_id',
            $request->user()->id
        )
        ->orderBy('prenom')
        ->orderBy('nom')
        ->get();

        return response()->json([
            'status' => true,
            'data' => $beneficiaires
        ]);
    }

    /**
     * POST /api/beneficiaires
     *
     * Créer un bénéficiaire.
     */
    public function store(Request $request)
{
    $request->validate([
        'nom' => 'required|string|max:255',
        'prenom' => 'required|string|max:255',
    ]);

    // JWT
    $user = auth('api')->user();

    if (!$user) {
        return response()->json([
            'status' => false,
            'message' => 'Utilisateur non authentifié.'
        ], 401);
    }

    $beneficiaire = Beneficiaire::create([
        'user_id' => $user->id,
        'nom' => $request->nom,
        'prenom' => $request->prenom,
    ]);

    return response()->json([
        'status' => true,
        'message' => 'Bénéficiaire ajouté avec succès.',
        'data' => $beneficiaire
    ], 201);
}
    /**
     * DELETE /api/beneficiaires/{beneficiaire}
     *
     * Supprimer un bénéficiaire.
     */
    public function destroy(
        Request $request,
        Beneficiaire $beneficiaire
    ) {
        // Vérifier que le bénéficiaire appartient
        // bien à l'utilisateur connecté.
        if ($beneficiaire->user_id !== $request->user()->id) {
            return response()->json([
                'status' => false,
                'message' => 'Vous na\'êtes pas autorisé à supprimer ce bénéficiaire.'
            ], 403);
        }

        $beneficiaire->delete();

        return response()->json([
            'status' => true,
            'message' => 'Bénéficiaire supprimé avec succès.'
        ]);
    }
}