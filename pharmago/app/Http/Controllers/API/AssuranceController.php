<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Assurance;
use Illuminate\Http\Request;

class AssuranceController extends Controller
{
    
    public function index(Request $request)
    {
        $assurances = Assurance::where(
            'user_id',
            $request->user()->id
        )->get();

        return response()->json($assurances);
    }

    
    public function store(Request $request)
    {
        // 🔄 Validation avec messages d'erreur traduits en français
        $request->validate([
            'compagnie'       => 'required|string|max:255',
            'numero_police'   => 'required|string|max:255',
            'fichier'         => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'date_expiration' => 'nullable|date',
        ], [
            'compagnie.required'       => 'La compagnie d\'assurance est obligatoire.',
            'compagnie.string'         => 'La compagnie d\'assurance doit être une chaîne de caractères.',
            'compagnie.max'            => 'Le nom de la compagnie ne doit pas dépasser 255 caractères.',
            
            'numero_police.required'   => 'Le numéro de police est obligatoire.',
            'numero_police.string'     => 'Le numéro de police doit être une chaîne de caractères.',
            'numero_police.max'        => 'Le numéro de police ne doit pas dépasser 255 caractères.',
            
            'fichier.file'             => 'Le document doit être un fichier valide.',
            'fichier.mimes'            => 'Le fichier doit être au format : jpg, jpeg, png ou pdf.',
            'fichier.max'              => 'Le fichier ne doit pas dépasser 5 Mo.',
            
            'date_expiration.date'     => 'La date d\'expiration n\'est pas une date valide.',
        ]);

        $data = $request->only([
            'compagnie',
            'numero_police',
            'date_expiration'
        ]);

        $data['user_id'] = $request->user()->id;

        if ($request->hasFile('fichier')) {
            $data['fichier'] = $request
                ->file('fichier')
                ->store('assurances', 'public');
        }

        $assurance = Assurance::create($data);

        return response()->json([
            'message'   => 'Assurance ajoutée',
            'assurance' => $assurance
        ], 201);
    }

    /**
     * DELETE /api/assurances/{id}
     * Supprimer une assurance
     */
    public function destroy(Assurance $assurance)
    {
        $assurance->delete();

        return response()->json([
            'message' => 'Assurance supprimée'
        ]);
    }
}