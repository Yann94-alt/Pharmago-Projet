<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ordonnance;
use Illuminate\Http\Request;

class OrdonnanceController extends Controller
{
    /**
     * GET /api/ordonnances
     * Liste des ordonnances de l'utilisateur connecté
     */
    public function index(Request $request)
    {
        $ordonnances = Ordonnance::where(
            'user_id',
            $request->user()->id
        )
        ->latest()
        ->get();

        return response()->json($ordonnances);
    }

    /**
     * POST /api/ordonnances
     * Envoyer une ordonnance
     */
  public function store(Request $request)
{
    // 🔄 Validation
    $request->validate([
        'fichier' => 'required|file|mimes:jpg,jpeg,png,pdf,avif|max:5120',
    ], [
        'fichier.required' => 'Le fichier de l\'ordonnance est obligatoire.',
        'fichier.file'     => 'Le document doit être un fichier valide.',
        'fichier.mimes'    => 'Le fichier doit être au format : jpg, jpeg, png, pdf ou avif.',
        'fichier.max'      => 'Le fichier ne doit pas dépasser 5 Mo.',
    ]);

    // 📁 Upload du fichier
    $path = $request->file('fichier')->store('ordonnances', 'public');

    // 💾 Création ordonnance
    $ordonnance = Ordonnance::create([
        'user_id' => $request->user()->id,
        'fichier' => $path,
        'statut'  => 'en_attente',
    ]);

    // 🔗 Réponse
    return response()->json([
        'message' => 'Ordonnance créée avec succès',
        'ordonnance' => $ordonnance,
        'url' => asset('storage/' . $path)
    ], 201);
}
    /**
     * GET /api/ordonnances/{id}
     * Voir une ordonnance
     */
    public function show(Request $request, Ordonnance $ordonnance)
    {
        // Vérification propriétaire
        if ($ordonnance->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Accès refusé.'
            ], 403);
        }

        return response()->json($ordonnance);
    }
}