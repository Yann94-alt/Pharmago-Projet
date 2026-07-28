<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Medicament;
use Illuminate\Http\Request;

class MedicamentController extends Controller
{
    /**
     * GET /api/medicaments
     * Recherche médicaments + pharmacies (avec pagination)
     */
    public function index(Request $request)
    {
        $query = Medicament::query();

        // Recherche par nom
        if ($request->filled('search')) {
            $query->where(
                'nom',
                'LIKE',
                '%' . $request->search . '%'
            );
        }

        // Pagination à 20 éléments par page pour éviter les lenteurs
        $medicaments = $query
            ->with('pharmacies')
            ->paginate(20);

        return response()->json($medicaments);
    }

    /**
     * GET /api/medicaments/{medicament}
     */
    public function show(Medicament $medicament)
    {
        return response()->json(
            $medicament->load('pharmacies')
        );
    }

    /**
     * POST /api/medicaments
     * Création médicament (admin)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom'         => 'required|string|max:255',
            'description' => 'nullable|string',
            'prix_marche' => 'nullable|numeric|min:0',
            'categorie'   => 'nullable|string|max:255',
        ], [
            'nom.required'       => 'Le nom du médicament est obligatoire.',
            'nom.string'         => 'Le nom du médicament doit être une chaîne de caractères.',
            'nom.max'            => 'Le nom du médicament ne doit pas dépasser 255 caractères.',
            'description.string' => 'La description doit être une chaîne de caractères.',
            'prix_marche.numeric' => 'Le prix du marché doit être un nombre.',
            'prix_marche.min'     => 'Le prix du marché ne peut pas être inférieur à 0.',
            'categorie.string'   => 'La catégorie doit être une chaîne de caractères.',
            'categorie.max'      => 'La catégorie ne doit pas dépasser 255 caractères.',
        ]);

        $medicament = Medicament::create($validated);

        return response()->json([
            'message'    => 'Médicament créé avec succès.',
            'medicament' => $medicament
        ], 201);
    }
}