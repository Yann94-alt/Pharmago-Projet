<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PharmacyInvitation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use App\Mail\PharmacyInvitationMail;
use Illuminate\Support\Facades\Hash;
class AdminController extends Controller
{
    private function checkAdmin(Request $request)
    {
        if (!$request->user() || $request->user()->role !== 'admin') {
            return response()->json([
                'status' => 'error',
                'message' => 'Accès interdit.'
            ], 403);
        }

        return null;
    }

    public function dashboard(Request $request)
{
    $adminCheck = $this->checkAdmin($request);

    if ($adminCheck) {
        return $adminCheck;
    }

    $totalUsers = User::count();

    $totalPatients = User::where('role', 'patient')->count();

    $totalAdmins = User::where('role', 'admin')->count();

    $totalPharmacies = User::where('role', 'pharmacie')->count();

    

    $activeUsers = User::where('is_active', true)->count();

    $inactiveUsers = User::where('is_active', false)->count();


    $totalInvitations = PharmacyInvitation::count();

    $usedInvitations = PharmacyInvitation::whereNotNull('used_at')
        ->count();

    $pendingInvitations = PharmacyInvitation::whereNull('used_at')
        ->where('expires_at', '>', now())
        ->count();

    $expiredInvitations = PharmacyInvitation::whereNull('used_at')
        ->where('expires_at', '<=', now())
        ->count();

    

    return response()->json([
        'status' => 'success',

        'data' => [

            'users' => [
                'total' => $totalUsers,
                'patients' => $totalPatients,
                'admins' => $totalAdmins,
                'pharmacies' => $totalPharmacies,
                'active' => $activeUsers,
                'inactive' => $inactiveUsers,
            ],

            'pharmacies' => [
                'total' => $totalPharmacies,
            ],

            'invitations' => [
                'total' => $totalInvitations,
                'pending' => $pendingInvitations,
                'used' => $usedInvitations,
                'expired' => $expiredInvitations,
            ],

        ]
    ], 200);
}
   
    public function invitePharmacie(Request $request)
    {
        $adminCheck = $this->checkAdmin($request);

        if ($adminCheck) {
            return $adminCheck;
        }

        $request->validate([
            'email' => 'required|email|unique:pharmacy_invitations,email'
        ], [
            'email.required' => 'L\'email de la pharmacie est obligatoire.',
            'email.email' => 'L\'email doit être valide.',
            'email.unique' => 'Une invitation existe déjà pour cet email.'
        ]);
        $token = Str::random(64);
        $invitation = PharmacyInvitation::create([

            'email' => $request->email,

            'token' => $token,
            'role' => 'pharmacie',
              'expires_at' => now()->addMinutes(10),
            'created_by' => $request->user()->id,

        ]);
        $link = "https://unserialised-inartificial-rosamond.ngrok-free.dev/pharmacie/register/" . $token;
        Mail::to($invitation->email)
            ->send(
                new PharmacyInvitationMail($link)
            );
        return response()->json([

            'status' => 'success',

            'message' => 'Invitation pharmacie envoyée avec succès.',

            'data' => [

                'email' => $invitation->email,

                'expires_at' => $invitation->expires_at,

            ]

        ], 201);
    }
   public function verifyInvitation($token)
{
    $invitation = PharmacyInvitation::where('token', $token)
        ->first();

    if (!$invitation) {
        return response()->json([
            'status' => 'error',
            'message' => 'Lien invalide.'
        ], 404);
    }

    if ($invitation->used_at) {
        return response()->json([
            'status' => 'error',
            'message' => 'Lien déjà utilisé.'
        ], 400);
    }

    if (
        $invitation->expires_at &&
        $invitation->expires_at->isPast()
    ) {
        return response()->json([
            'status' => 'error',
            'message' => 'Lien expiré.'
        ], 410);
    }

    return response()->json([
        'status' => 'success',
        'message' => 'Lien valide.',
        'email' => $invitation->email
    ], 200);
}
public function users(Request $request)
{
    $adminCheck = $this->checkAdmin($request);

    if ($adminCheck) {
        return $adminCheck;
    }

    $users = User::select([
        'id',
        'nom',
        'prenom',
        'email',
        'role',
        'is_active',
        'created_at',
    ])
    ->orderBy('created_at', 'desc')
    ->get();

    return response()->json([
        'status' => 'success',
        'data' => $users,
    ], 200);
}


/**
 * Supprimer un utilisateur
 */
public function deleteUser(Request $request, $id)
{
    $adminCheck = $this->checkAdmin($request);

    if ($adminCheck) {
        return $adminCheck;
    }

    $user = User::find($id);

    if (!$user) {
        return response()->json([
            'status' => 'error',
            'message' => 'Utilisateur introuvable.'
        ], 404);
    }

    // Empêcher l'admin de supprimer son propre compte
    if ($user->id === $request->user()->id) {
        return response()->json([
            'status' => 'error',
            'message' => 'Vous ne pouvez pas supprimer votre propre compte.'
        ], 403);
    }

    $user->delete();

    return response()->json([
        'status' => 'success',
        'message' => 'Utilisateur supprimé avec succès.'
    ], 200);
}
/**
 * Créer un nouvel administrateur
 */
public function createAdmin(Request $request)
{
    // Vérifier que l'utilisateur connecté est admin
    $adminCheck = $this->checkAdmin($request);

    if ($adminCheck) {
        return $adminCheck;
    }

    // Validation des données
    $request->validate([
        'nom' => 'required|string|max:255',
        'prenom' => 'required|string|max:255',
        'email' => 'required|email|unique:users,email',
        'password' => 'required|string|min:8|confirmed',
    ], [
        'nom.required' => 'Le nom est obligatoire.',
        'prenom.required' => 'Le prénom est obligatoire.',
        'email.required' => 'L\'email est obligatoire.',
        'email.email' => 'L\'email doit être valide.',
        'email.unique' => 'Un utilisateur existe déjà avec cet email.',
        'password.required' => 'Le mot de passe est obligatoire.',
        'password.min' => 'Le mot de passe doit contenir au moins 8 caractères.',
        'password.confirmed' => 'La confirmation du mot de passe ne correspond pas.',
    ]);

    // Création du nouvel administrateur
    $admin = User::create([
        'nom' => $request->nom,
        'prenom' => $request->prenom,
        'email' => $request->email,
        'password' => Hash::make($request->password),
         'role' => 'admin',
        'is_active' => true,
    ]);

    return response()->json([
        'status' => 'success',
        'message' => 'Administrateur créé avec succès.',
        'data' => [
            'id' => $admin->id,
            'nom' => $admin->nom,
            'prenom' => $admin->prenom,
            'email' => $admin->email,
            'role' => $admin->role,
            'is_active' => $admin->is_active,
        ]
    ], 201);
}

}