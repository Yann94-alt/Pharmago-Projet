import {
  Routes,
  Route
} from 'react-router-dom'

import {
  lazy,
  Suspense
} from 'react'

import { useAuth } from './context/AuthContext'

import Layout from './components/Layout'
import PrivateRoute from './components/PrivateRoute'


/*
|--------------------------------------------------------------------------
| LAZY LOADING DES PAGES
|--------------------------------------------------------------------------
|
| Les pages ne seront chargées que lorsqu'elles sont nécessaires.
|
*/


// =========================
// AUTHENTIFICATION
// =========================

const NotificationReservation = lazy(
  () => import('./pages/NotificationReservation')
)

const Login = lazy(
  () => import('./pages/Login')
)

const Register = lazy(
  () => import('./pages/Register')
)

const ForgotPassword = lazy(
  () => import('./pages/ForgotPassword')
)

const VerifyOtp = lazy(
  () => import('./pages/VerifyOtp')
)

const PharmacyRegister = lazy(
  () => import('./pages/PharmacyRegister')
)


// =========================
// PATIENT
// =========================

const Pharmacies = lazy(
  () => import('./pages/Pharmacies')
)

const PharmacyDetail = lazy(
  () => import('./pages/PharmacyDetail')
)


const Medicaments = lazy(
  () => import('./pages/Medicaments')
)

const Ordonnances = lazy(
  () => import('./pages/Ordonnances')
)

const Assurances = lazy(
  () => import('./pages/Assurances')
)

const Reservations = lazy(
  () => import('./pages/Reservations')
)

const ReservationDetail = lazy(
  () => import('./pages/ReservationDetail')
)

const Notifications = lazy(
  () => import('./pages/Notifications')
)


const PatientDash = lazy(
  () => import('./pages/PatientDash')
)

const CartePage = lazy(
  () => import('./pages/CartePage')
)


// =========================
// PHARMACIE
// =========================

const PharmacyDashboard = lazy(
  () => import('./pages/PharmacyDashboard')
)

const PharmacyHistory = lazy(
  () => import('./pages/PharmacyHistory')
)

const TraitementReservation = lazy(
  () => import('./pages/TraitementReservation')
)

const QrScanner = lazy(
  () => import('./pages/QrScanner')
)


// =========================
// ADMIN
// =========================

const AdminDashboard = lazy(
  () => import('./pages/AdminDashboard')
)

const AdminPatients = lazy(
  () => import('./pages/AdminPatients')
)


/*
|--------------------------------------------------------------------------
| PAGE DE CHARGEMENT
|--------------------------------------------------------------------------
*/

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">

      <div className="flex flex-col items-center gap-4">

        <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />

        <p className="text-sm font-semibold text-slate-500">
          Chargement...
        </p>

      </div>

    </div>
  )
}


/*
|--------------------------------------------------------------------------
| HOME
|--------------------------------------------------------------------------
|
| La page d'accueil dépend du rôle de l'utilisateur.
|
*/

function Home() {

  const {
    isPharmacie
  } = useAuth()

  return isPharmacie
    ? <PharmacyDashboard />
    : <Pharmacies />
}


/*
|--------------------------------------------------------------------------
| APP
|--------------------------------------------------------------------------
*/

export default function App() {

  return (

    <Suspense fallback={<PageLoader />}>

      <Routes>

        {/* =========================================================
            ROUTES PUBLIQUES
        ========================================================== */}

        <Route
          path="/connexion"
          element={<Login />}
        />

        <Route
          path="/inscription"
          element={<Register />}
        />

        <Route
          path="/mot-de-passe-oublie"
          element={<ForgotPassword />}
        />

        <Route
          path="/verification-otp"
          element={<VerifyOtp />}
        />

        <Route
          path="/pharmacie/register/:token"
          element={<PharmacyRegister />}
        />

        <Route
          path="/Accueil"
          element={<PatientDash />}
        />

        <Route
          path="/carte"
          element={<CartePage />}
        />


        {/* =========================================================
            ESPACE PROTÉGÉ GLOBAL
        ========================================================== */}

        <Route element={<Layout />}>

          {/* =======================================================
              ACCUEIL
          ======================================================== */}

          <Route
            path="/"
            element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            }
          />


          {/* =======================================================
              PHARMACIE
          ======================================================== */}

          <Route
            path="/pharmacie/dashboard"
            element={
              <PrivateRoute role="pharmacie">
                <PharmacyDashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/pharmacie/historique"
            element={
              <PrivateRoute role="pharmacie">
                <PharmacyHistory />
              </PrivateRoute>
            }
          />

          <Route
            path="/TraitementReservation/:id"
            element={
              <PrivateRoute role="pharmacie">
                <TraitementReservation />
              </PrivateRoute>
            }
          />

          <Route
            path="/scanner"
            element={
              <PrivateRoute role="pharmacie">
                <QrScanner />
              </PrivateRoute>
            }
          />


          {/* =======================================================
              ADMIN
          ======================================================== */}

          <Route
            path="/admin/dashboard"
            element={
              <PrivateRoute role="admin">
                <AdminDashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/patients"
            element={
              <PrivateRoute role="admin">
                <AdminPatients />
              </PrivateRoute>
            }
          />


          {/* =======================================================
              PATIENT
          ======================================================== */}

          <Route
            path="/pharmacies/:id"
            element={
              <PrivateRoute>
                <PharmacyDetail />
              </PrivateRoute>
            }
          />

          <Route
            path="/medicaments"
            element={
              <PrivateRoute role="patient">
                <Medicaments />
              </PrivateRoute>
            }
          />

          <Route
            path="/ordonnances"
            element={
              <PrivateRoute role="patient">
                <Ordonnances />
              </PrivateRoute>
            }
          />

          <Route
            path="/assurances"
            element={
              <PrivateRoute role="patient">
                <Assurances />
              </PrivateRoute>
            }
          />

          <Route
            path="/reservations"
            element={
              <PrivateRoute>
                <Reservations />
              </PrivateRoute>
            }
          />

          <Route
            path="/reservations/:id"
            element={
              <PrivateRoute>
                <ReservationDetail />
              </PrivateRoute>
            }
          />

          <Route
            path="/notifications"
            element={
              <PrivateRoute>
                <Notifications />
              </PrivateRoute>
            }
          />

          <Route
  path="/notifications/:id"
  element={
    <PrivateRoute>
      <NotificationReservation />
    </PrivateRoute>
  }
/>

        </Route>


        {/* =========================================================
            PAGE INCONNUE
        ========================================================== */}

        <Route
          path="*"
          element={
            <div className="p-10 text-center text-slate-500 font-semibold">
              Page introuvable.
            </div>
          }
        />

      </Routes>

    </Suspense>

  )
}