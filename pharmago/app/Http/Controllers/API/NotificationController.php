<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\notifications;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * GET /api/notifications
     * Liste des notifications de l'utilisateur connecté
     */
    public function index(Request $request)
    {
        $notifications = notifications::where(
            'user_id',
            $request->user()->id
        )
        ->latest()
        ->get();

        return response()->json([
            'status' => true,
            'notifications' => $notifications,
        ]);
    }

    /**
     * PUT /api/notifications/{notification}/lu
     * Marquer une notification comme lue
     */
    public function marquerLue(
        Request $request,
        notifications $notification
    ) {
        // Sécurité
        if ($notification->user_id !== $request->user()->id) {
            return response()->json([
                'status' => false,
                'message' => 'Accès refusé.',
            ], 403);
        }

        $notification->update([
            'lu' => true,
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Notification marquée comme lue.',
            'notification' => $notification,
        ]);
    }

    /**
     * PUT /api/notifications/lire-tout
     * Marquer toutes les notifications comme lues
     */
    public function marquerToutLu(Request $request)
    {
        notifications::where(
            'user_id',
            $request->user()->id
        )->update([
            'lu' => true,
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Toutes les notifications ont été marquées comme lues.',
        ]);
    }
    public function destroy(
        Request $request,
        notifications $notification
    ) {
        // Sécurité :
        // l'utilisateur ne peut supprimer que ses propres notifications
        if ($notification->user_id !== $request->user()->id) {
            return response()->json([
                'status' => false,
                'message' => 'Accès refusé.',
            ], 403);
        }

        $notification->delete();

        return response()->json(['status' => true,
            'message' => 'Notification supprimée avec succès.',
        ]);
    }
}