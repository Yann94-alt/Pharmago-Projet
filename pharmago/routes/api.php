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



/*
|--------------------------------------------------------------------------
| AUTH PUBLIQUE
|--------------------------------------------------------------------------
*/

Route::post('/register', [
    AuthController::class,
    'register'
]);

Route::post('/login', [
    AuthController::class,
    'login'
]);



/*
|--------------------------------------------------------------------------
| ADMIN - INVITATION PHARMACIE
|--------------------------------------------------------------------------
*/
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

    /*
    |--------------------------------------------------------------------------
    | DASHBOARD ADMIN
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/admin/dashboard',
        [
            AdminController::class,
            'dashboard'
        ]
    );


    /*
    |--------------------------------------------------------------------------
    | INVITER UNE PHARMACIE
    |--------------------------------------------------------------------------
    */

    Route::post(
        '/admin/inviter-pharmacie',
        [
            AdminController::class,
            'invitePharmacie'
        ]
    );

});


/*
|--------------------------------------------------------------------------
| INVITATION PHARMACIE PUBLIQUE
|--------------------------------------------------------------------------
|
| Cette route est publique car la pharmacie doit pouvoir vérifier
| son invitation avant de créer son compte.
|
*/

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



/*
|--------------------------------------------------------------------------
| PHARMACIES PUBLIQUES
|--------------------------------------------------------------------------
*/


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

/*
|--------------------------------------------------------------------------
| MEDICAMENTS PUBLICS
|--------------------------------------------------------------------------
*/

 
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





/*
|--------------------------------------------------------------------------
| ROUTES AUTH JWT
|--------------------------------------------------------------------------
*/


Route::middleware('auth:api')->group(function () {

Route::get('/beneficiaires', [BeneficiaireController::class, 'index']);
    Route::post('/beneficiaires', [BeneficiaireController::class, 'store']);
    Route::delete('/beneficiaires/{beneficiaire}', [BeneficiaireController::class, 'destroy']);


    /*
    |--------------------------------------------------------------------------
    | AUTH
    |--------------------------------------------------------------------------
    */


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



    /*
    |--------------------------------------------------------------------------
    | PHARMACIES
    |--------------------------------------------------------------------------
    */


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



    /*
    |--------------------------------------------------------------------------
    | ORDONNANCES
    |--------------------------------------------------------------------------
    */


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




    /*
    |--------------------------------------------------------------------------
    | RESERVATIONS PATIENT
    |--------------------------------------------------------------------------
    */


    Route::post(
        '/reservations',
        [
            ReservationPatientController::class,
            'store'
        ]
    );


    Route::post(
        '/reservations/{reservation}/accepter',
        [
            ReservationPatientController::class,
            'accepterProposition'
        ]
    )->whereNumber('reservation');


    Route::post(
        '/reservations/{reservation}/piece-identite',
        [
            ReservationPatientController::class,
            'envoyerPieceIdentite'
        ]
    )->whereNumber('reservation');



    /*
    |--------------------------------------------------------------------------
    | RESERVATIONS PHARMACIE
    |--------------------------------------------------------------------------
    */


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

Route::post(
    '/pharmacies/reservations/{reservation}/confirmer',
    [
        ReservationPharmacieController::class,
        'confirmer'
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
  ->whereIn('type', ['ordonnance', 'assurance', 'identite']);
    /*
    |--------------------------------------------------------------------------
    | RESERVATIONS ADMIN / GENERAL
    |--------------------------------------------------------------------------
    */


    Route::put(
        '/reservations/{reservation}/statut',
        [
            ReservationController::class,
            'updateStatut'
        ]
    )->whereNumber('reservation');


    Route::post(
        '/reservations/{reservation}/confirmer',
        [
            ReservationController::class,
            'confirmer'
        ]
    )->whereNumber('reservation');




    /*
    |--------------------------------------------------------------------------
    | ASSURANCES
    |--------------------------------------------------------------------------
    */


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


    Route::post(
        '/qrcodes/scanner',
        [
            QrCodeController::class,
            'scanner'
        ]
    );


    Route::put(
        '/qrcodes/{code}/utiliser',
        [
            QrCodeController::class,
            'utiliser'
        ]
    );





    /*
    |--------------------------------------------------------------------------
    | NOTIFICATIONS
    |--------------------------------------------------------------------------
    */


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