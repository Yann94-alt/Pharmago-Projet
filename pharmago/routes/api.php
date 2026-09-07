<?php
 
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\ReservationPharmacieController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PharmacieController;
use App\Http\Controllers\Api\OrdonnanceController;
use App\Http\Controllers\Api\ReservationController;
use App\Http\Controllers\Api\ReservationPatientController;
use App\Http\Controllers\Api\FactureController;
use App\Http\Controllers\Api\MedicamentController;
use App\Http\Controllers\Api\AssuranceController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\QrCodeController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\PharmacyRegisterController;
use App\Http\Controllers\API\BeneficiaireController;
use Illuminate\Support\Facades\Broadcast;

Broadcast::routes([
    'middleware' => ['auth:api'],
]);

 
Route::post('/auth/forgot-password', [
    AuthController::class,
    'forgotPassword'
]);
Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);
 
Route::post('/inscription', [
    AuthController::class,
    'register'
]);
 
Route::post('/connexion', [
    AuthController::class,
    'login'
]);
 
 
 
/*
|--------------------------------------------------------------------------
| ADMIN - INVITATION PHARMACIE + DASHBOARD
|--------------------------------------------------------------------------
*/
 
Route::middleware([
    'auth:api',
    'admin'
])->group(function () {
 
Route::get(
    '/admin/users',
    [
        AdminController::class,
        'users'
    ]
);
 
Route::delete(
    '/admin/users/{id}',
    [
        AdminController::class,
        'deleteUser'
    ]
)->whereNumber('id');
    Route::get(
        '/admin/dashboard',
        [
            AdminController::class,
            'dashboard'
        ]
    );
Route::post('/admins', [AdminController::class, 'createAdmin']);


    Route::post(
        '/admin/inviter-pharmacie',
        [
            AdminController::class,
            'invitePharmacie'
        ]
    );
 
});
 
Route::get(
    '/admin/invitation/{token}',
    [
        AdminController::class,
        'verifyInvitation'
    ]
);
Route::post(
    '/pharmacie/register/{token}',
    [
        PharmacyRegisterController::class,
        'register'
    ]
);
 
Route::get(
    '/pharmacies/garde',
    [
        PharmacieController::class,
        'deGarde'
    ]
);
 
 
Route::get(
    '/pharmacies/search',
    [
        PharmacieController::class,
        'search'
    ]
);
 
 
Route::get(
    '/pharmacies/nearby',
    [
        PharmacieController::class,
        'nearby'
    ]
);

Route::get('/pharmacies/medicaments', [MedicamentController::class, 'tousMedicaments']);

 

Route::get(
    '/pharmacies',
    [
        PharmacieController::class,
        'index'
    ]
);
 
 
Route::get(
    '/pharmacies/{pharmacie}',
    [
        PharmacieController::class,
        'show'
    ]
)->whereNumber('pharmacie');
 
 
Route::get(
    '/pharmacies/nearby-partners',
    [PharmacieController::class, 'nearbyPartners']
);
Route::get(
    '/medicaments',
    [
        MedicamentController::class,
        'index'
    ]
);
 
 
Route::get(
    '/medicaments/{medicament}',
    [
        MedicamentController::class,
        'show'
    ]
)->whereNumber('medicament');
 
Route::middleware('auth:api')->group(function () {
 
Route::get('/beneficiaires', [BeneficiaireController::class, 'index']);
Route::post('/beneficiaires', [BeneficiaireController::class, 'store']);
Route::delete('/beneficiaires/{beneficiaire}', [BeneficiaireController::class, 'destroy']);
 
 
 
    Route::post(
        '/logout',
        [
            AuthController::class,
            'logout'
        ]
    );
 
 
    Route::get(
        '/me',
        [
            AuthController::class,
            'me'
        ]
    );
 
 
    Route::post(
        '/pharmacies',
        [
            PharmacieController::class,
            'store'
        ]
    );
 
 
    Route::put(
        '/pharmacies/{pharmacie}',
        [
            PharmacieController::class,
            'update'
        ]
    )->whereNumber('pharmacie');
 
    Route::get(
        '/ordonnances',
        [
            OrdonnanceController::class,
            'index'
        ]
    );
 
 
    Route::post(
        '/ordonnances',
        [
            OrdonnanceController::class,
            'store'
        ]
    );
 
 
    Route::get(
        '/ordonnances/{ordonnance}',
        [
            OrdonnanceController::class,
            'show'
        ]
    )->whereNumber('ordonnance');
 
  Route::delete(
    '/auth/delete-account',
    [
        AuthController::class,
        'deleteAccount'
    ]
);
 
Route::post(
    '/reservations',
    [
        ReservationPatientController::class,
        'store'
    ]
)->whereNumber('pharmacie_id');
 
 
Route::post(
    '/reservations/{reservation}/confirmer',
    [
        ReservationPatientController::class,
        'confirmerReservation'
    ]
)->whereNumber('reservation');
  Route::get(
        '/pharmacie/historique-reservations',
        [ ReservationPharmacieController::class, 'historiqueReservations']
    );
 
Route::post(
    '/reservations/{reservation}/annuler',
    [
        ReservationPatientController::class,
        'annulerReservation'
    ]
)->whereNumber('reservation');
 

Route::delete(
        '/notifications/{notification}',
        [NotificationController::class, 'destroy']
    );
 
 
Route::get(
    '/pharmacies/reservations',
    [
        ReservationPharmacieController::class,
        'index'
    ]
);
 
 
Route::get(
    '/pharmacies/reservations/{reservation}',
    [
        ReservationPharmacieController::class,
        'show'
    ]
)->whereNumber('reservation');
Route::post(
    '/pharmacies/reservations/{reservation}/proposition',
    [
        ReservationPharmacieController::class,
        'analyserReservation'
    ]
)->whereNumber('reservation');
 
Route::put(
    '/pharmacies/reservations/{reservation}/statut',
    [
        ReservationPharmacieController::class,
        'updateStatut'
    ]
)->whereNumber('reservation');
 
Route::get(
    '/pharmacies/reservations/{reservation}/documents',
    [
        ReservationPharmacieController::class,
        'documents'
    ]
)->whereNumber('reservation');
 
 
Route::get(
    '/pharmacies/reservations/{reservation}/documents/{type}',
    [
        ReservationPharmacieController::class,
        'document'
    ]
)->whereNumber('reservation')
 ->whereIn(
     'type',
     [
         'ordonnance',
         'assurance',
         'bon'
     ]
 );

    Route::get(
        '/assurances',
        [
            AssuranceController::class,
            'index'
        ]
    );
 
 
    Route::post(
        '/assurances',
        [
            AssuranceController::class,
            'store'
        ]
    );
 
 
    Route::delete(
        '/assurances/{assurance}',
        [
            AssuranceController::class,
            'destroy'
        ]
    )->whereNumber('assurance');
 
 
 
 
 
    /*
    |--------------------------------------------------------------------------
    | FACTURES
    |--------------------------------------------------------------------------
    */
 
 
    Route::post(
        '/factures',
        [
            FactureController::class,
            'store'
        ]
    );
 
 
    Route::get(
        '/factures/{facture}',
        [
            FactureController::class,
            'show'
        ]
    )->whereNumber('facture');
 
 
 
 
 
    /*
    |--------------------------------------------------------------------------
    | QR CODE
    |--------------------------------------------------------------------------
    */
 
 
    Route::put(
        '/qrcodes/{code}/utiliser',
        [
            QrCodeController::class,
            'utiliser'
        ]
    );
 
 
 
 
 
    Route::get(
        '/notifications',
        [
            NotificationController::class,
            'index'
        ]
    );
 
 
    Route::put(
        '/notifications/{notification}/lu',
        [
            NotificationController::class,
            'marquerLue'
        ]
    );
 
 
    Route::put(
        '/notifications/lire-tout',
        [
            NotificationController::class,
            'marquerToutLu'
        ]
    );
 
 Route::get(
    '/reservations/{reservation}',
    [ReservationPatientController::class, 'show']
);
 
    /*
    |--------------------------------------------------------------------------
    | MEDICAMENTS ADMIN
    |--------------------------------------------------------------------------
    */
 
 
    Route::post(
        '/medicaments',
        [
            MedicamentController::class,
            'store'
        ]
    );
   
 
 
});
 
