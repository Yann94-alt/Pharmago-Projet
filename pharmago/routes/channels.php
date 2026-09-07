<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel(
    'notifications.{userId}',
    function ($user, $userId) {
        return (int) $user->id === (int) $userId;
    },
    ['guards' => ['api']]
);

Broadcast::channel(
    'pharmacies.{pharmacieId}',
    function ($user, $pharmacieId) {
        return $user->pharmacie &&
            (int) $user->pharmacie->id === (int) $pharmacieId;
    },
    ['guards' => ['api']]
);
