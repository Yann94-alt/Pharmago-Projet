<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Patient;
use Tymon\JWTAuth\Facades\JWTAuth;

class PatientController extends Controller
{

    // Afficher un utilisateur
    public function show($id){
        $user = User::with('patient')->find($id);

        if(!$user){
            return response()->json([
                "error"=>"L'utilisateur n'existe pas"
            ],404);
        }
        return response()->json($user);
    }


    // Inscription patient
    public function store(Request $request){

        // 🔄 Validation avec messages d'erreur traduits en français
        $request->validate([
            'name'=>'required|string',
            'email'=>'required|email|unique:users,email',
            'password'=>'required|min:6',
            'prenom'=>'required|string',
            'telephone'=>'required|string',
            'num_assurance'=>'nullable|string'
        ], [
            'name.required'       => 'Le nom est obligatoire.',
            'name.string'         => 'Le nom doit être une chaîne de caractères.',
            'email.required'      => 'L\'adresse e-mail est obligatoire.',
            'email.email'         => 'L\'adresse e-mail doit être valide.',
            'email.unique'        => 'Cette adresse e-mail est déjà utilisée.',
            'password.required'   => 'Le mot de passe est obligatoire.',
            'password.min'        => 'Le mot de passe doit contenir au moins 6 caractères.',
            'prenom.required'     => 'Le prénom est obligatoire.',
            'prenom.string'       => 'Le prénom doit être une chaîne de caractères.',
            'telephone.required'  => 'Le numéro de téléphone est obligatoire.',
            'telephone.string'    => 'Le numéro de téléphone doit être une chaîne de caractères.',
            'num_assurance.string'=> 'Le numéro d\'assurance doit être une chaîne de caractères.',
        ]);

        $user = User::create([
            'name'=>$request->name,
            'email'=>$request->email,
            'password'=>Hash::make($request->password),
            'role'=>'Patient'
        ]);

        $patient = Patient::create([
            'user_id'=>$user->id,
            'prenom'=>$request->prenom,
            'telephone'=>$request->telephone,
            'num_assurance'=>$request->num_assurance
        ]);

        $token = JWTAuth::fromUser($user);

        return response()->json([
            'user'=>$user,
            'patient'=>$patient,
            'token'=>$token
        ],201);
    }


    // Connexion patient
    public function login(Request $request){

        // 🔄 Validation avec messages d'erreur traduits en français
        $request->validate([
            'email'=>'required|email',
            'password'=>'required'
        ], [
            'email.required'    => 'L\'adresse e-mail est obligatoire.',
            'email.email'       => 'L\'adresse e-mail doit être valide.',
            'password.required' => 'Le mot de passe est obligatoire.',
        ]);

        $user = User::where('email',$request->email)->first();

        if(!$user || !Hash::check($request->password,$user->password)){
            return response()->json([
                "error"=>"Email ou mot de passe incorrect"
            ],401);
        }

        $token = JWTAuth::fromUser($user);

        return response()->json([
            'user'=>$user,
            'token'=>$token
        ]);
    }


    // Mise à jour utilisateur
   public function update(Request $request, $id){

    $user = User::with('patient')->find($id);

    if(!$user){
        return response()->json([
            "error"=>"Utilisateur non trouvé"
        ],404);
    }

    // 🔄 Validation avec messages d'erreur traduits en français
    $request->validate([
        'name'=>'sometimes|string',
        'email'=>'sometimes|email|unique:users,email,'.$id,
        'prenom'=>'sometimes|string',
        'telephone'=>'sometimes|string',
        'num_assurance'=>'sometimes|string'
    ], [
        'name.string'         => 'Le nom doit être une chaîne de caractères.',
        'email.email'         => 'L\'adresse e-mail doit être valide.',
        'email.unique'        => 'Cette adresse e-mail est déjà utilisée.',
        'prenom.string'       => 'Le prénom doit être une chaîne de caractères.',
        'telephone.string'    => 'Le numéro de téléphone doit être une chaîne de caractères.',
        'num_assurance.string'=> 'Le numéro d\'assurance doit être une chaîne de caractères.',
    ]);

    // Mise à jour User
    $user->update($request->only(['name','email']));

    // Mise à jour Patient
    $user->patient->update($request->only(['prenom','telephone','num_assurance']));

    return response()->json($user->load('patient'));
}

    // Supprimer utilisateur
    public function destroy($id){

        $user = User::find($id);

        if(!$user){
            return response()->json([
                "error"=>"Utilisateur non trouvé"
            ],404);
        }

        Patient::where('user_id',$user->id)->delete();

        $user->delete();

        return response()->json([
            "message"=>"Utilisateur supprimé avec succès"
        ]);
    }
}