import { Routes, Route } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

import Layout from './components/Layout'
import PrivateRoute from './components/PrivateRoute'

import PharmacyRegister from "./pages/PharmacyRegister"

import Login from './pages/Login'
import Register from './pages/Register'

import Pharmacies from './pages/Pharmacies'
import PharmacyDetail from './pages/PharmacyDetail'

import Medicaments from './pages/Medicaments'
import Ordonnances from './pages/Ordonnances'
import Assurances from './pages/Assurances'

import Reservations from './pages/Reservations'
import ReservationDetail from './pages/ReservationDetail'

import Notifications from './pages/Notifications'

import PharmacyDashboard from './pages/PharmacyDashboard'
import TraitementReservation from './pages/TraitementReservation' // <-- Import de la page de traitement

import AdminDashboard from './pages/AdminDashboard'

import QrScanner from './pages/QrScanner'

import PatientDash from './pages/PatientDash'
import CartePage from './pages/CartePage'
import AdminPatients from './pages/AdminPatients'


function Home() {
  const { isPharmacie } = useAuth()

  return isPharmacie 
      ? <PharmacyDashboard /> 
      : <Pharmacies />
}


export default function App() {
  return (
    <Routes>

      {/* =========================
          ROUTES PUBLIQUES
      ========================== */}

      <Route 
        path="/connexion" 
        element={<Login />} 
      />

      <Route 
        path="/inscription" 
        element={<Register />} 
      />

      {/* Inscription pharmacie par invitation */}
      <Route
        path="/pharmacie/register/:token"
        element={<PharmacyRegister />}
      />

      {/* Pages publiques */}
      <Route 
        path="/Accueil" 
        element={<PatientDash />} 
      />

      <Route 
        path="/carte" 
        element={<CartePage />} 
      />

      {/* =========================
          DASHBOARD PHARMACIE & ADMIN
      ========================== */}

      <Route
        path="/pharmacie/dashboard"
        element={
          <PrivateRoute role="pharmacie">
            <PharmacyDashboard />
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
 
      <Route
        path="/admin/dashboard"
        element={
            <PrivateRoute role="admin">
                <AdminDashboard />
            </PrivateRoute>
        }
      />


      {/* =========================
          ESPACE PROTEGE (AVEC LAYOUT)
      ========================== */}

      <Route element={<Layout />}>

        <Route
          path="/"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />

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

        {/* Route Traitement de réservation / ordonnance */}
        <Route
          path="/TraitementReservation/:id"
          element={
            <PrivateRoute role="pharmacie">
              <TraitementReservation />
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

        {/* Scanner QR pharmacie */}
        <Route
          path="/scanner"
          element={
            <PrivateRoute role="pharmacie">
              <QrScanner />
            </PrivateRoute>
          }
        />

      </Route>


      {/* =========================
          PAGE INCONNUE
      ========================== */}

      <Route
        path="*"
        element={
          <div className="p-10 text-center text-brand-500">
            Page introuvable.
          </div>
        }
      />

    </Routes>
  )
}