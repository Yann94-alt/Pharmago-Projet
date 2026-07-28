<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Pharmacies;
use App\Models\PharmacyInvitation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class PharmacyRegisterController extends Controller
{

    /**
     * Inscription d'une pharmacie via invitation
     */
    public function register(Request $request, $token)
    {

        /*
        |--------------------------------------------------------------------------
        | Validation formulaire pharmacie
        |--------------------------------------------------------------------------
        */

        $request->validate([

            'nom' => [
                'required',
                'string',
                'max:255'
            ],

            'adresse' => [
                'required',
                'string'
            ],

            'telephone' => [
                'required',
                'string'
            ],

            'password' => [
                'required',
                'string',
                'min:8'
            ],

            'latitude' => [
                'nullable',
                'numeric'
            ],

            'longitude' => [
                'nullable',
                'numeric'
            ],

        ],[

            'nom.required' =>
            'Le nom de la pharmacie est obligatoire.',

            'adresse.required' =>
            'L\'adresse de la pharmacie est obligatoire.',

            'telephone.required' =>
            'Le téléphone est obligatoire.',

            'password.required' =>
            'Le mot de passe est obligatoire.',

            'password.min' =>
            'Le mot de passe doit contenir au moins 8 caractères.',

        ]);



        /*
        |--------------------------------------------------------------------------
        | Vérifier invitation
        |--------------------------------------------------------------------------
        */

        $invitation = PharmacyInvitation::where('token',$token)
            ->first();



        if(!$invitation){

            return response()->json([
                'message'=>'Lien d\'invitation invalide.'
            ],404);

        }



        if($invitation->used_at){

            return response()->json([
                'message'=>'Cette invitation a déjà été utilisée.'
            ],400);

        }



        if($invitation->expires_at < now()){

            return response()->json([
                'message'=>'Cette invitation a expiré.'
            ],400);

        }



        if($invitation->role !== 'pharmacie'){

            return response()->json([
                'message'=>'Cette invitation n\'est pas destinée à une pharmacie.'
            ],400);

        }



        /*
        |--------------------------------------------------------------------------
        | Vérifier si email déjà utilisé
        |--------------------------------------------------------------------------
        */

        if(User::where('email',$invitation->email)->exists()){

            return response()->json([
                'message'=>'Un compte existe déjà avec cette adresse email.'
            ],400);

        }




        /*
        |--------------------------------------------------------------------------
        | Création utilisateur + pharmacie
        |--------------------------------------------------------------------------
        */

        $result = DB::transaction(function () use ($request,$invitation){


            /*
            | Création compte utilisateur
            */

            $user = User::create([

                'nom' => $request->nom,

                // Si tu as rendu prenom nullable
                'prenom' => null,

                // Email provenant uniquement de l'invitation admin
                'email' => $invitation->email,

                'telephone' => $request->telephone,

                'password' => Hash::make($request->password),

                'role' => 'pharmacie',

            ]);



            /*
            | Création pharmacie
            */

            $pharmacie = Pharmacies::create([

                'user_id' => $user->id,

                'nom' => $request->nom,

                'adresse' => $request->adresse,

                'telephone' => $request->telephone,

                'email' => $invitation->email,

                'latitude' => $request->latitude,

                'longitude' => $request->longitude,

                'is_active' => true,

            ]);



            /*
            | Désactiver invitation
            */

            $invitation->update([

                'used_at'=>now()

            ]);



            return [

                'user'=>$user,

                'pharmacie'=>$pharmacie

            ];


        });




        return response()->json([

            'status'=>'success',

            'message'=>'Votre compte pharmacie a été créé avec succès.',

            'data'=>[

                'user'=>$result['user'],

                'pharmacie'=>$result['pharmacie']

            ]

        ],201);

    }

}