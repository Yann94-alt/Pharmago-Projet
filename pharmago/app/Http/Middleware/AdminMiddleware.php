<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->user()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Utilisateur non authentifié.'
            ], 401);
        }

        if ($request->user()->role !== 'admin') {
            return response()->json([
                'status' => 'error',
                'message' => 'Accès interdit.'
            ], 403);
        }

        return $next($request);
    }
}