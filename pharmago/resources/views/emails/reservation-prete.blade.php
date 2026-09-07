<!DOCTYPE html>
<html lang="fr">

<head>
    <meta charset="UTF-8">

    <title>Réservation prête</title>
</head>

<body style="font-family: Arial, sans-serif; background:#f8fafc; padding:30px;">

    <div style="
        max-width:600px;
        margin:auto;
        background:white;
        padding:30px;
        border-radius:16px;
        border:1px solid #e2e8f0;
    ">

        <h1 style="color:#059669;">
            Votre réservation est prête
        </h1>

        <p>
            Bonjour
            {{ $reservation->user->prenom ?? '' }}
            {{ $reservation->user->nom ?? '' }},
        </p>

        <p>
            Votre réservation
            <strong>#{{ $reservation->id }}</strong>
            est maintenant prête.
        </p>

        <p>
            Vous pouvez vous rendre à la pharmacie pour
            récupérer vos médicaments.
        </p>

        @if($reservation->pharmacie)
            <p>
                <strong>Pharmacie :</strong>
                {{ $reservation->pharmacie->nom ?? 'Votre pharmacie' }}
            </p>
        @endif

        <p>
            Pensez à vous munir des documents nécessaires
            lors de votre passage.
        </p>

        <p style="margin-top:30px;">
            Merci d'avoir utilisé PharmaGo.
        </p>

    </div>

</body>

</html>