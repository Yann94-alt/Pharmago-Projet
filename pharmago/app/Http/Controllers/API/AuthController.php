<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    
  public function register(Request $request)
{
    $request->validate([
        'nom'            => 'required|string|max:255',
        'prenom'         => 'required|string|max:255',
        'email'          => 'required|email|unique:users,email',
        'password'       => 'required|string|min:6|confirmed',
        'telephone'      => 'nullable|string|max:20',
        'role'           => 'required|in:patient,pharmacie',
        'date_naissance' => 'nullable|date',

        // Documents du patient
        'carte_identite' => 'required_if:role,patient|file|mimes:jpg,jpeg,png,pdf|max:5120',
        'carte_assurance' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',

    ], [
        'nom.required' => 'Le nom est obligatoire.',
        'nom.string' => 'Le nom doit être une chaîne de caractères.',
        'nom.max' => 'Le nom ne doit pas dépasser 255 caractères.',

        'prenom.required' => 'Le prénom est obligatoire.',
        'prenom.string' => 'Le prénom doit être une chaîne de caractères.',
        'prenom.max' => 'Le prénom ne doit pas dépasser 255 caractères.',

        'email.required' => 'L\'adresse e-mail est obligatoire.',
        'email.email' => 'L\'adresse e-mail doit être valide.',
        'email.unique' => 'Cette adresse e-mail est déjà utilisée.',

        'password.required' => 'Le mot de passe est obligatoire.',
        'password.string' => 'Le mot de passe doit être une chaîne de caractères.',
        'password.min' => 'Le mot de passe doit contenir au moins 6 caractères.',
        'password.confirmed' => 'La confirmation du mot de passe ne correspond pas.',

        'telephone.string' => 'Le numéro de téléphone doit être une chaîne de caractères.',
        'telephone.max' => 'Le numéro de téléphone ne doit pas dépasser 20 caractères.',

        'role.required' => 'Le rôle est obligatoire.',
        'role.in' => 'Le rôle sélectionné n\'est pas valide.',

        'date_naissance.date' => 'La date de naissance doit être une date valide.',

        'carte_identite.required_if' =>
            'La pièce d\'identité est obligatoire pour un patient.',
        'carte_identite.file' =>
            'La pièce d\'identité doit être un fichier.',
        'carte_identite.mimes' =>
            'La pièce d\'identité doit être une image ou un PDF.',
        'carte_identite.max' =>
            'La pièce d\'identité ne doit pas dépasser 5 Mo.',

        'carte_assurance.file' =>
            'La carte d\'assurance doit être un fichier.',
        'carte_assurance.mimes' =>
            'La carte d\'assurance doit être une image ou un PDF.',
        'carte_assurance.max' =>
            'La carte d\'assurance ne doit pas dépasser 5 Mo.',
    ]);


    // Création de l'utilisateur
    $user = User::create([
        'nom'            => $request->nom,
        'prenom'         => $request->prenom,
        'email'          => $request->email,
        'password'       => Hash::make($request->password),
        'telephone'      => $request->telephone,
        'role'           => $request->role,
        'date_naissance' => $request->date_naissance,
    ]);


    // Documents uniquement pour les patients
    if ($request->role === 'patient') {

        // Pièce d'identité obligatoire
        $carteIdentite = $request
            ->file('carte_identite')
            ->store('cartes_identite', 'local');

        $user->carte_identite = $carteIdentite;


        // Carte d'assurance facultative
        if ($request->hasFile('carte_assurance')) {

            $carteAssurance = $request
                ->file('carte_assurance')
                ->store('cartes_assurance', 'local');

            $user->carte_assurance = $carteAssurance;
        }

        $user->save();
    }


    $token = JWTAuth::fromUser($user);


    return response()->json([
        'status'  => 'success',
        'message' => 'Inscription réussie.',
        'token'   => $token,
        'user'    => $user
    ], 201);
}
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ], [
            'email.required'    => 'L\'adresse e-mail est obligatoire.',
            'email.email'       => 'L\'adresse e-mail doit être valide.',
            'password.required' => 'Le mot de passe est obligatoire.',
            'password.string'   => 'Le mot de passe doit être une chaîne de caractères.',
        ]);

        $credentials = $request->only('email', 'password');

        if (!$token = JWTAuth::attempt($credentials)) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Identifiants incorrects.'
            ], 401);
        }

        return response()->json([
            'status'  => 'success',
            'message' => 'Connexion réussie.',
            'token'   => $token,
            'user'    => auth()->user()
        ], 200);
    }

    /**
     * GET /api/auth/me
     * Récupérer le profil connecté (via Bearer Token)
     */
   public function me()
{
    $user = User::with('pharmacie')->find(auth()->id());

    return response()->json([
        'status' => 'success',
        'user'   => $user
    ]);
}
    public function logout()
    {
        try {
            JWTAuth::invalidate(JWTAuth::getToken());
            
            return response()->json([
                'status'  => 'success',
                'message' => 'Déconnexion réussie.'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Impossible de traiter la déconnexion.'
            ], 500);
        }
    }

    /**
     * POST /api/auth/forgot-password
     * Demande de réinitialisation -> Envoi OTP
     */
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email'
        ], [
            'email.required' => 'L\'adresse e-mail est obligatoire.',
            'email.email'    => 'L\'adresse e-mail doit être valide.',
        ]);

       
        $user = User::where('email', $request->email)->first();

        if ($user) {
            $otp = rand(100000, 999999);

            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $request->email],
                [
                    'token'      => $otp,
                    'created_at' => now()
                ]
            );

            Mail::send([], [], function ($message) use ($request, $otp) {
                $message->to($request->email)
                    ->subject("Réinitialisation de votre mot de passe")
                    ->html("
                        <div style='font-family: Arial, sans-serif; padding:20px; max-width: 600px; margin: auto; border: 1px solid #eee;'>
                            <h2 style='color: #2d89ef;'>PharmaGo</h2>
                            <p>Bonjour,</p>
                            <p>Vous avez demandé la réinitialisation de votre mot de passe. Voici votre code de validation OTP :</p>
                            <div style='background: #f4f4f4; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2d89ef;'>
                                $otp
                            </div>
                            <p>Ce code est valide pendant <b>15 minutes</b>. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>
                            <hr style='border:none; border-top:1px solid #eee;'>
                            <p style='font-size: 12px; color: #777;'>L'équipe PharmaGo</p>
                        </div>
                    ");
            });
        }

        return response()->json([
            'status'  => 'success',
            'message' => 'Si cet e-mail correspond à un compte, un code OTP vous a été envoyé.'
        ], 200);
    }

    /**
     * POST /api/auth/reset-password
     * Validation OTP et changement de mot de passe
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'token'    => 'required|numeric', // Ton OTP
            'password' => 'required|string|min:6|confirmed'
        ], [
            'email.required'     => 'L\'adresse e-mail est obligatoire.',
            'email.email'        => 'L\'adresse e-mail doit être valide.',
            'token.required'     => 'Le code OTP est obligatoire.',
            'token.numeric'      => 'Le code OTP doit être composé uniquement de chiffres.',
            'password.required'  => 'Le nouveau mot de passe est obligatoire.',
            'password.string'    => 'Le mot de passe doit être une chaîne de caractères.',
            'password.min'       => 'Le nouveau mot de passe doit contenir au moins 6 caractères.',
            'password.confirmed' => 'La confirmation du mot de passe ne correspond pas.',
        ]);

        // 1. Récupérer le jeton OTP en BDD
        $record = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->where('token', $request->token)
            ->first();

        if (!$record) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Code OTP invalide.'
            ], 400);
        }

        // 2. Vérifier s'il a expiré (15 minutes)
        if (now()->diffInMinutes($record->created_at) > 15) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Ce code OTP a expiré.'
            ], 400);
        }

        // 3. Récupérer l'utilisateur
        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Utilisateur introuvable.'
            ], 404);
        }

        // 4. Mettre à jour le mot de passe
        $user->update([
            'password' => Hash::make($request->password)
        ]);

        // 5. Supprimer le jeton utilisé pour éviter les réutilisations
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return response()->json([
            'status'  => 'success',
            'message' => 'Votre mot de passe a été modifié avec succès.'
        ], 200);
    }
    /**
 * DELETE /api/auth/delete-account
 * Supprimer le compte de l'utilisateur connecté
 */
public function deleteAccount()
{
    try {
        $user = auth()->user();

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Utilisateur non authentifié.'
            ], 401);
        }

        // Invalider le token JWT
        JWTAuth::invalidate(JWTAuth::getToken());

        // Supprimer le compte
        $user->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Votre compte a été supprimé avec succès.'
        ], 200);

    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => 'Une erreur est survenue lors de la suppression du compte.',
            'error' => $e->getMessage() // À retirer en production
        ], 500);
    }
}
}