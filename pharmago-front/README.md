# PharmaGo — Front React

Front-end React (Vite + Tailwind, thème vert/blanc) connecté à ton backend Laravel PharmaGo (auth JWT, pharmacies, médicaments, réservations, ordonnances, assurances, factures, QR codes, notifications).

## Installation

```bash
cd pharmago-front
npm install
cp .env.example .env
```

Dans `.env`, vérifie l'URL de ton API Laravel (par défaut `http://127.0.0.1:8000/api`).

## Lancer le projet

1. Démarre ton backend Laravel :
   ```bash
   php artisan serve
   ```
2. Démarre le front :
   ```bash
   npm run dev
   ```
3. Ouvre `http://localhost:5173`.

⚠️ Pense à autoriser CORS côté Laravel pour `http://localhost:5173` (fichier `config/cors.php`).

## Fonctionnalités

- **Auth JWT** : inscription (patient / pharmacie), connexion, déconnexion, session persistée.
- **Patient** : recherche de pharmacies (nom, adresse, géolocalisation, de garde), catalogue médicaments, envoi d'ordonnances, gestion des assurances, réservation de médicaments, suivi des réservations, facture + QR code de retrait, notifications.
- **Pharmacie** : création/mise à jour de la fiche officine, tableau de bord (compteurs de réservations), gestion des réservations reçues (changement de statut), génération de facture (avec ou sans bon d'assurance), ajout de médicaments au catalogue, scanner de QR code pour valider les retraits.

## Structure

```
src/
  api/            client axios + gestion des erreurs Laravel
  context/        AuthContext (JWT, utilisateur courant)
  components/     Navbar, Layout, PrivateRoute, Alert, Loader, StatutBadge
  pages/          une page par écran (voir App.jsx pour les routes)
```

## Notes

- Le thème utilise une palette verte personnalisée (`brand`) définie dans `tailwind.config.js`.
- Le QR code est affiché via l'API publique `api.qrserver.com` (aucune dépendance supplémentaire).
- L'ajout de médicament via le tableau de bord pharmacie crée une entrée dans le catalogue global (`/api/medicaments`) ; le lien prix/stock par pharmacie (`pharmacy_medicament`) n'a pas de route dédiée côté back — à ajouter si besoin.
