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


import QrScanner from './pages/QrScanner'

import PatientDash from './pages/PatientDash'
import CartePage from './pages/CartePage'


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
          DASHBOARD PHARMACIE
      ========================== */}


      <Route
        path="/pharmacie/dashboard"
        element={
          <PrivateRoute role="pharmacie">
            <PharmacyDashboard />
          </PrivateRoute>
        }
      />




      {/* =========================
          ESPACE PROTEGE
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



        <Route
          path="/notifications"
          element={
            <PrivateRoute>
              <Notifications />
            </PrivateRoute>
          }
        />



        {/* Profil pharmacie */}

      
       



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