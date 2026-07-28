<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Medcin;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;
use Illuminate\Http\Request;

class MedcinController extends Controller
{
    public function show($id){
       $medcin=User::with('medcin')->find($id);
       if(!$medcin){
        return response()->json([
            "error"=>"Médecin inconnu"
        ],404);
    
       }
       return response()->json([$medcin]);
    }
    public function inscription(Request $request){
        // 🔄 Validation avec messages d'erreur traduits en français
        $request->validate([
            'name'=>'required|string',
            'email'=>'required|email|unique:users,email',
            'password'=>'required|string',
            'specialite'=>'required|string',
            'num_odre'=>'required|string',
        ], [
            'name.required'        => 'Le nom est obligatoire.',
            'name.string'          => 'Le nom doit être une chaîne de caractères.',
            'email.required'       => 'L\'adresse e-mail est obligatoire.',
            'email.email'          => 'L\'adresse e-mail doit être valide.',
            'email.unique'         => 'Cette adresse e-mail est déjà utilisée.',
            'password.required'    => 'Le mot de passe est obligatoire.',
            'password.string'      => 'Le mot de passe doit être une chaîne de caractères.',
            'specialite.required'  => 'La spécialité est obligatoire.',
            'specialite.string'    => 'La spécialité doit être une chaîne de caractères.',
            'num_odre.required'    => 'Le numéro d\'ordre est obligatoire.',
            'num_odre.string'      => 'Le numéro d\'ordre doit être une chaîne de caractères.',
        ]);

        $user=User::create([
            'name'=>$request->name,
            'email'=>$request->email,
            'password'=>Hash::make($request->password),
            'role'=>'medcin',
        ]);
        $medcin=Medcin::create([
             'user_id'=>$user->id,
            'specialite'=>$request->specialite,
            'num_odre'=>$request->num_odre,
        ]);
        $token=JWTAuth::fromUser($user);
        return response()->json([
            'user'=>$user,
            'medcin'=>$medcin,
            'token'=>$token
        ],201);
    }
    
    public function connexion(Request $request){
        // 🔄 Validation avec messages d'erreur traduits en français
        $request->validate([
            'email'=>'required|email',
            'password'=>'required'
        ], [
            'email.required'    => 'L\'adresse e-mail est obligatoire.',
            'email.email'       => 'L\'adresse e-mail doit être valide.',
            'password.required' => 'Le mot de passe est obligatoire.',
        ]);

        $user=User::where('email',$request->email)->first();
        if(!$user || !Hash::check($request->password, $user->password)){
             return response()->json([
                "error"=>"Email ou mot de passe incorrect"
            ],401);
        }
         $token = JWTAuth::fromUser($user);

       return response()->json([
    'user' => [
        'id' => $user->id,
        'name' => $user->name,
        'email' => $user->email,
        'role' => $user->role
    ],
    'token' => $token
]);
    }

    public function update(Request $request, $id){

    $user = User::with('medcin')->find($id);

    if(!$user){
        return response()->json([
            "error"=>"Médecin non trouvé"
        ],404);
    }

    // 🔄 Validation avec messages d'erreur traduits en français
    $request->validate([
        'name'=>'sometimes|string',
        'email'=>'sometimes|email|unique:users,email,'.$id,
        'specialite'=>'sometimes|string',
        'num_odre'=>'sometimes|string'
    ], [
        'name.string'        => 'Le nom doit être une chaîne de caractères.',
        'email.email'        => 'L\'adresse e-mail doit être valide.',
        'email.unique'       => 'Cette adresse e-mail est déjà utilisée.',
        'specialite.string'  => 'La spécialité doit être une chaîne de caractères.',
        'num_odre.string'    => 'Le numéro d\'ordre doit être une chaîne de caractères.',
    ]);

    // Mise à jour User
    $user->update($request->only(['name','email']));

    // Mise à jour Patient
    $user->patient->update($request->only(['specialite','num_odre']));

    return response()->json($user->load('medcin'));
}

    // Supprimer utilisateur
    public function destroy($id){

        $user = User::find($id);

        if(!$user){
            return response()->json([
                "error"=>"Médecin non trouvé"
            ],404);
        }

        Medcin::where('user_id',$user->id)->delete();

        $user->delete();

        return response()->json([
            "message"=>"Médecin supprimé avec succès"
        ]);
    }
}