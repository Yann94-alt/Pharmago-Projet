<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PharmacyInvitation;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use App\Mail\PharmacyInvitationMail;

class AdminController extends Controller
{

    /**
     * Créer et envoyer une invitation pharmacie
     */
    public function invitePharmacie(Request $request)
    {

        /*
        |--------------------------------------------------------------------------
        | Vérifier que l'utilisateur est admin
        |--------------------------------------------------------------------------
        */

        if ($request->user()->role !== 'admin') {

            return response()->json([
                'message' => 'Accès interdit.'
            ],403);

        }



        /*
        |--------------------------------------------------------------------------
        | Validation email pharmacie
        |--------------------------------------------------------------------------
        */

        $request->validate([

            'email'=>'required|email|unique:pharmacy_invitations,email'

        ],[

            'email.required'=>'L\'email de la pharmacie est obligatoire.',

            'email.email'=>'L\'email doit être valide.',

            'email.unique'=>'Une invitation existe déjà pour cet email.'

        ]);




        /*
        |--------------------------------------------------------------------------
        | Création du token
        |--------------------------------------------------------------------------
        */

        $token = Str::random(64);




        /*
        |--------------------------------------------------------------------------
        | Enregistrement invitation
        |--------------------------------------------------------------------------
        */

        $invitation = PharmacyInvitation::create([

            'email'=>$request->email,

            'token'=>$token,

            'role'=>'pharmacie',

            'expires_at'=>now()->addDays(7),

            'created_by'=>$request->user()->id,

        ]);




        /*
        |--------------------------------------------------------------------------
        | Création du lien React 
        |--------------------------------------------------------------------------
        */
     
        $link = "http://192.168.1.151:5173/pharmacie/register/".$token;




        /*
        |--------------------------------------------------------------------------
        | Envoi du mail
        |--------------------------------------------------------------------------
        */

        Mail::to($invitation->email)
            ->send(
                new PharmacyInvitationMail($link)
            );




        return response()->json([

            'status'=>'success',

            'message'=>'Invitation pharmacie envoyée avec succès.',

            'data'=>[

                'email'=>$invitation->email,

                'expires_at'=>$invitation->expires_at,

            ]

        ],201);

    }





    /**
     * Vérifier un lien d'inscription pharmacie
     */
    public function verifyInvitation($token)
    {


        $invitation = PharmacyInvitation::where('token',$token)
            ->first();



        if(!$invitation){

            return response()->json([

                'message'=>'Lien invalide.'

            ],404);

        }




        if($invitation->used_at){

            return response()->json([

                'message'=>'Lien déjà utilisé.'

            ],400);

        }




        if($invitation->expires_at < now()){

            return response()->json([

                'message'=>'Lien expiré.'

            ],400);

        }




        return response()->json([

            'status'=>'success',

            'message'=>'Lien valide.',

            'email'=>$invitation->email

        ]);

    }

}