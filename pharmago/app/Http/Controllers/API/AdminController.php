<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PharmacyInvitation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use App\Mail\PharmacyInvitationMail;

class AdminController extends Controller
{
    /**
     * Vérifier que l'utilisateur connecté est administrateur
     */
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


    /**
     * Dashboard administrateur
     *
     * Retourne les statistiques générales de l'application.
     */
    public function dashboard(Request $request)
{
    $adminCheck = $this->checkAdmin($request);

    if ($adminCheck) {
        return $adminCheck;
    }

    // =========================
    // UTILISATEURS
    // =========================

    $totalUsers = User::count();

    $totalPatients = User::where('role', 'patient')->count();

    $totalAdmins = User::where('role', 'admin')->count();

    $totalPharmacies = User::where('role', 'pharmacie')->count();

    // =========================
    // UTILISATEURS ACTIFS
    // =========================

    $activeUsers = User::where('is_active', true)->count();

    $inactiveUsers = User::where('is_active', false)->count();

    // =========================
    // INVITATIONS
    // =========================

    $totalInvitations = PharmacyInvitation::count();

    $usedInvitations = PharmacyInvitation::whereNotNull('used_at')
        ->count();

    $pendingInvitations = PharmacyInvitation::whereNull('used_at')
        ->where('expires_at', '>', now())
        ->count();

    $expiredInvitations = PharmacyInvitation::whereNull('used_at')
        ->where('expires_at', '<=', now())
        ->count();

    // =========================
    // RÉPONSE
    // =========================

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
    /**
     * Créer et envoyer une invitation pharmacie
     */
    public function invitePharmacie(Request $request)
    {
        // Vérification admin
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


        /*
        |--------------------------------------------------------------------------
        | Création de l'invitation
        |--------------------------------------------------------------------------
        */

        $invitation = PharmacyInvitation::create([

            'email' => $request->email,

            'token' => $token,

            'role' => 'pharmacie',

            'expires_at' => now()->addDays(7),

            'created_by' => $request->user()->id,

        ]);


        /*
        |--------------------------------------------------------------------------
        | Lien React
        |--------------------------------------------------------------------------
        */

        $link = "http://192.168.1.151:5173/pharmacie/register/" . $token;


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
        if ($invitation->expires_at < now()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Lien expiré.'
            ], 400);
        }


        return response()->json([

            'status' => 'success',

            'message' => 'Lien valide.',

            'email' => $invitation->email

        ], 200);
    }
    /**
 * Liste de tous les utilisateurs
 */
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
}