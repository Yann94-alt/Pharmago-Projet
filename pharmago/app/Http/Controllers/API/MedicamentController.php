<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Medicament;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class MedicamentController extends Controller
{
    /**
     * GET /api/medicaments
     *
     * Liste complète : mise en cache pendant 10 minutes.
     * Recherche : pas de cache.
     */

    public function tousMedicaments()
{
    $medicaments = Medicament::orderBy('nom')->get();

    return response()->json([
        'status' => true,
        'data' => $medicaments
    ]);
}

    public function index(Request $request)
{
    $search = $request->get('search');

    $query = Medicament::query()
        ->orderBy('nom');

    // Recherche
    if ($search) {
        $query->where('nom', 'like', '%' . $search . '%');
    }

    // 30 médicaments par page
    $medicaments = $query->paginate(30);

    return response()->json([
        'status' => true,
        'data' => $medicaments
    ]);
}
    /**
     * GET /api/medicaments/{medicament}
     */
    public function show(Medicament $medicament)
    {
        return response()->json([
            'status' => true,
            'data' => $medicament->load('pharmacies')
        ]);
    }

    /**
     * POST /api/medicaments
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom'         => 'required|string|max:255',
            'description' => 'nullable|string',
            'prix_marche' => 'nullable|numeric|min:0',
            'categorie'   => 'nullable|string|max:255',
        ], [
            'nom.required'        => 'Le nom du médicament est obligatoire.',
            'nom.string'          => 'Le nom du médicament doit être une chaîne de caractères.',
            'nom.max'             => 'Le nom du médicament ne doit pas dépasser 255 caractères.',
            'description.string'  => 'La description doit être une chaîne de caractères.',
            'prix_marche.numeric' => 'Le prix du marché doit être un nombre.',
            'prix_marche.min'     => 'Le prix du marché ne peut pas être inférieur à 0.',
            'categorie.string'    => 'La catégorie doit être une chaîne de caractères.',
            'categorie.max'       => 'La catégorie ne doit pas dépasser 255 caractères.',
        ]);

        $medicament = Medicament::create($validated);

        // Vider le cache de la liste complète pour qu'il prenne en compte le nouveau médicament
        Cache::forget('medicaments.all');

        return response()->json([
            'status'     => true,
            'message'    => 'Médicament créé avec succès.',
            'medicament' => $medicament
        ], 201);
    }
}