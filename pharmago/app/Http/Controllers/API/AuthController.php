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
    // =========================================================
    // VALIDATION DES DONNÉES
    // =========================================================

    $request->validate([
       'nom' => [
    'required',
    'string',
    'max:255',
    'regex:/^\pL+$/u',
],

'prenom' => [
    'required',
    'string',
    'max:255',
    'regex:/^\pL+$/u',
],
        'email' => [
            'required',
            'email',
            'unique:users,email',
        ],

        'password' => [
            'required',
            'string',
            'min:6',
            'confirmed',
        ],

        'telephone' => [
            'nullable',
            'string',
            'max:20',
        ],

        'role' => [
            'required',
            'in:patient,pharmacie',
        ],

        'date_naissance' => [
            'nullable',
            'date',
        ],

        // Carte d'assurance facultative
        'carte_assurance' => [
            'nullable',
            'file',
            'mimes:jpg,jpeg,png,pdf',
            'max:5120',
        ],

    ], [

        // =====================================================
        // NOM
        // =====================================================

        'nom.required' =>
            'Le nom est obligatoire.',

        'nom.string' =>
            'Le nom doit être une chaîne de caractères.',

        'nom.max' =>
            'Le nom ne doit pas dépasser 255 caractères.',

        'nom.regex' =>
            'Le nom ne doit contenir que des lettres',


        // =====================================================
        // PRÉNOM
        // =====================================================

        'prenom.required' =>
            'Le prénom est obligatoire.',

        'prenom.string' =>
            'Le prénom doit être une chaîne de caractères.',

        'prenom.max' =>
            'Le prénom ne doit pas dépasser 255 caractères.',

        'prenom.regex' =>
            'Le prénom ne doit contenir que des lettres',


        // =====================================================
        // EMAIL
        // =====================================================

        'email.required' =>
            'L\'adresse e-mail est obligatoire.',

        'email.email' =>
            'L\'adresse e-mail doit être valide.',

        'email.unique' =>
            'Cette adresse e-mail est déjà utilisée.',


        // =====================================================
        // MOT DE PASSE
        // =====================================================

        'password.required' =>
            'Le mot de passe est obligatoire.',

        'password.string' =>
            'Le mot de passe doit être une chaîne de caractères.',

        'password.min' =>
            'Le mot de passe doit contenir au moins 6 caractères.',

        'password.confirmed' =>
            'La confirmation du mot de passe ne correspond pas.',


        // =====================================================
        // TÉLÉPHONE
        // =====================================================

        'telephone.string' =>
            'Le numéro de téléphone doit être une chaîne de caractères.',

        'telephone.max' =>
            'Le numéro de téléphone ne doit pas dépasser 20 caractères.',


        // =====================================================
        // RÔLE
        // =====================================================

        'role.required' =>
            'Le rôle est obligatoire.',

        'role.in' =>
            'Le rôle sélectionné n\'est pas valide.',


        // =====================================================
        // DATE DE NAISSANCE
        // =====================================================

        'date_naissance.date' =>
            'La date de naissance doit être une date valide.',


        // =====================================================
        // CARTE D'ASSURANCE
        // =====================================================

        'carte_assurance.file' =>
            'La carte d\'assurance doit être un fichier.',

        'carte_assurance.mimes' =>
            'La carte d\'assurance doit être une image ou un PDF.',

        'carte_assurance.max' =>
            'La carte d\'assurance ne doit pas dépasser 5 Mo.',
    ]);


    // =========================================================
    // CRÉATION DE L'UTILISATEUR
    // =========================================================

    $user = User::create([
        'nom'            => $request->nom,
        'prenom'         => $request->prenom,
        'email'          => $request->email,
        'password'       => Hash::make($request->password),
        'telephone'      => $request->telephone,
        'role'           => $request->role,
        'date_naissance' => $request->date_naissance,
    ]);


    // =========================================================
    // CARTE D'ASSURANCE FACULTATIVE
    // =========================================================

    if ($request->hasFile('carte_assurance')) {

        $carteAssurance = $request
            ->file('carte_assurance')
            ->store('cartes_assurance', 'local');

        $user->carte_assurance = $carteAssurance;

        $user->save();
    }


    // =========================================================
    // GÉNÉRATION DU TOKEN JWT
    // =========================================================

    $token = JWTAuth::fromUser($user);


    // =========================================================
    // RÉPONSE
    // =========================================================

    return response()->json([
        'status'  => 'success',
        'message' => 'Inscription réussie.',
        'token'   => $token,
        'user'    => $user,
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
 * Demande de réinitialisation -> Vérification utilisateur -> Envoi OTP
 */
public function forgotPassword(Request $request)
{
    $request->validate([
        'email' => 'required|email',
    ], [
        'email.required' => 'L\'adresse e-mail est obligatoire.',
        'email.email'    => 'L\'adresse e-mail doit être valide.',
    ]);

    $email = strtolower(trim($request->email));

    // Vérifier que l'utilisateur existe dans la table users
    $user = User::where('email', $email)->first();

    if (!$user) {
        return response()->json([
            'status'  => 'error',
            'message' => 'Aucun compte PharmaGo ne correspond à cette adresse e-mail.',
        ], 404);
    }

    // Supprimer un ancien OTP
    DB::table('password_reset_tokens')
        ->where('email', $email)
        ->delete();

    // Générer un OTP à 6 chiffres
    $otp = random_int(100000, 999999);

    // Enregistrer le nouvel OTP
    DB::table('password_reset_tokens')->insert([
        'email'      => $email,
        'token'      => (string) $otp,
        'created_at' => now(),
    ]);

    // Envoyer l'OTP par email
    Mail::send([], [], function ($message) use ($email, $otp) {
        $message
            ->to($email)
            ->subject('Réinitialisation de votre mot de passe - PharmaGo')
            ->html("
                <div style='font-family:Arial,sans-serif;padding:20px;max-width:600px;margin:auto;border:1px solid #eee;border-radius:12px;'>
                    <h2 style='color:#059669;'>PharmaGo</h2>

                    <p>Bonjour,</p>

                    <p>
                        Vous avez demandé la réinitialisation de votre mot de passe.
                    </p>

                    <p>
                        Voici votre code de validation :
                    </p>

                    <div style='
                        background:#ecfdf5;
                        padding:20px;
                        text-align:center;
                        font-size:32px;
                        font-weight:bold;
                        letter-spacing:6px;
                        color:#047857;
                        border-radius:10px;
                        margin:20px 0;
                    '>
                        {$otp}
                    </div>

                    <p>
                        Ce code est valide pendant <strong>15 minutes</strong>.
                    </p>

                    <p style='font-size:12px;color:#777;'>
                        Si vous n'êtes pas à l'origine de cette demande,
                        ignorez cet e-mail.
                    </p>

                    <hr style='border:none;border-top:1px solid #eee;'>

                    <p style='font-size:12px;color:#777;'>
                        L'équipe PharmaGo
                    </p>
                </div>
            ");
    });

    return response()->json([
        'status'  => 'success',
        'message' => 'Un code OTP a été envoyé à votre adresse e-mail.',
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
        'token'    => 'required|numeric',
        'password' => 'required|string|min:6|confirmed',
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

    $email = strtolower(trim($request->email));

    // Vérifier que l'utilisateur existe
    $user = User::where('email', $email)->first();

    if (!$user) {
        return response()->json([
            'status'  => 'error',
            'message' => 'Aucun compte PharmaGo ne correspond à cette adresse e-mail.',
        ], 404);
    }

    // Vérifier le code OTP
    $record = DB::table('password_reset_tokens')
        ->where('email', $email)
        ->where('token', (string) $request->token)
        ->first();

    if (!$record) {
        return response()->json([
            'status'  => 'error',
            'message' => 'Code OTP invalide.',
        ], 400);
    }

    // Vérifier l'expiration : 15 minutes
    $createdAt = \Carbon\Carbon::parse($record->created_at);

    if ($createdAt->addMinutes(15)->isPast()) {

        DB::table('password_reset_tokens')
            ->where('email', $email)
            ->delete();

        return response()->json([
            'status'  => 'error',
            'message' => 'Ce code OTP a expiré. Veuillez demander un nouveau code.',
        ], 400);
    }

    // Modifier le mot de passe
    $user->update([
        'password' => Hash::make($request->password),
    ]);

    // Supprimer l'OTP après utilisation
    DB::table('password_reset_tokens')
        ->where('email', $email)
        ->delete();

    return response()->json([
        'status'  => 'success',
        'message' => 'Votre mot de passe a été modifié avec succès.',
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