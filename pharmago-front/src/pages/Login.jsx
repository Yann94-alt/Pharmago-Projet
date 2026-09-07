import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage } from '../api/errors'
import Alert from '../components/Alert'
import { captureLocation, getStoredLocation } from '../utils/geolocation'

import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiUserPlus,
  FiShield,
  FiCheckCircle,
} from 'react-icons/fi'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const loggedUser = await login(form.email, form.password)

      if (loggedUser?.role === 'patient' && !getStoredLocation()) {
        captureLocation().catch(() => {})
      }

      if (loggedUser?.role === 'patient') {
        navigate('/')
      } else if (loggedUser?.role === 'pharmacie') {
        navigate('/pharmacie/dashboard')
      } else if (loggedUser?.role === 'admin') {
        navigate('/admin/dashboard')
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Identifiants incorrects.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-12 bg-[#F8FAFC] text-slate-800 font-['Outfit',sans-serif]">
      {/* Import des polices Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap');
        .font-brand { font-family: 'Outfit', sans-serif; }
      `}</style>

      {/* ================= PANNEAU GAUCHE (BRANDING) ================= */}
      <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 relative p-16 flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-700 text-white shadow-2xl">
        
        {/* Éléments lumineux décoratifs en arrière-plan */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full bg-teal-900/20 blur-[100px] pointer-events-none" />

        {/* Logo / Header */}
        <div className="relative z-10 flex items-center gap-3.5">
          <img 
            src="/pwa-192x192.png" 
            alt="Logo PharmaGo" 
            className="w-16 h-16 object-cover rounded-2xl shadow-md" 
          />
          <span className="text-2xl font-brand font-bold tracking-tight text-white">
            Pharma<span className="text-emerald-200 font-light">Go</span>
          </span>
        </div>

        {/* Contenu central */}
        <div className="relative z-10 my-auto max-w-xl space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-emerald-100 text-xs font-semibold tracking-wide backdrop-blur-md shadow-sm">
            <FiShield className="w-4 h-4 text-emerald-200" />
            <span>Plateforme de santé sécurisée & chiffrée</span>
          </div>

          <h1 className="font-brand text-4xl xl:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
            La santé connectée, <br />
            <span className="text-emerald-200">
              simplifiée pour tous.
            </span>
          </h1>

          <p className="text-emerald-100/90 text-base xl:text-lg leading-relaxed font-normal">
            Gérez vos ordonnances, communiquez en temps réel avec les pharmacies partenaires et pilotez votre officine depuis une interface moderne.
          </p>

          {/* Points clés rassurants */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="flex items-center gap-3 bg-white/10 border border-white/15 p-4 rounded-2xl backdrop-blur-md shadow-sm transition-transform hover:scale-[1.02]">
              <FiCheckCircle className="w-5 h-5 text-emerald-300 shrink-0" />
              <span className="text-sm font-medium text-white">Conforme normes de santé</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 border border-white/15 p-4 rounded-2xl backdrop-blur-md shadow-sm transition-transform hover:scale-[1.02]">
              <FiCheckCircle className="w-5 h-5 text-emerald-300 shrink-0" />
              <span className="text-sm font-medium text-white">Dispo 24/7 en continu</span>
            </div>
          </div>
        </div>

        {/* Footer du panneau gauche */}
        <div className="relative z-10 flex items-center justify-between text-xs text-emerald-100/70 pt-6 border-t border-white/15">
          <p>&copy; {new Date().getFullYear()} PharmaGo. Tous droits réservés.</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white font-medium">Systèmes opérationnels</span>
          </div>
        </div>
      </div>

      {/* ================= PANNEAU DROIT (FORMULAIRE) ================= */}
      <div className="col-span-12 lg:col-span-6 xl:col-span-5 flex flex-col justify-between min-h-screen p-8 sm:p-12 lg:p-16 bg-white">
        
        {/* En-tête Mobile */}
        <div className="lg:hidden flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <img 
              src="/pwa-192x192.png" 
              alt="Logo PharmaGo" 
              className="w-10 h-10 object-cover rounded-xl shadow-md" 
            />
            <span className="text-lg font-brand font-bold tracking-tight text-slate-900">
              Pharma<span className="text-emerald-600">Go</span>
            </span>
          </div>
        </div>

        {/* Formulaire principal */}
        <div className="w-full max-w-md mx-auto my-auto space-y-8">
          <div className="space-y-2">
            <h2 className="font-brand text-3xl xl:text-4xl font-bold tracking-tight text-slate-900">
              Bon retour parmi nous 
            </h2>
            <p className="text-sm text-slate-500">
              Entrez vos identifiants pour accéder à votre espace sécurisé.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert type="error" onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            {/* Champ Email */}
            <div className="space-y-2">
              <label 
                htmlFor="email" 
                className="block text-xs font-bold uppercase tracking-wider text-slate-600"
              >
                Adresse e-mail
              </label>
              <div className="relative group">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                  <FiMail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  id="email"
                  required
                  placeholder="nom@exemple.com"
                  className="w-full h-14 rounded-2xl pl-12 pr-4 text-sm bg-slate-50 border-2 border-slate-200 text-slate-900 placeholder-slate-400 font-medium outline-none transition-all duration-200 hover:border-slate-300 focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 shadow-sm"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            {/* Champ Mot de passe */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label 
                  htmlFor="password" 
                  className="block text-xs font-bold uppercase tracking-wider text-slate-600"
                >
                  Mot de passe
                </label>
                <Link
                  to="/mot-de-passe-oublie"
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative group">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                  <FiLock className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  required
                  placeholder="••••••••"
                  className="w-full h-14 rounded-2xl pl-12 pr-12 text-sm bg-slate-50 border-2 border-slate-200 text-slate-900 placeholder-slate-400 font-medium outline-none transition-all duration-200 hover:border-slate-300 focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 shadow-sm"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Bouton de Connexion */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 mt-2 flex items-center justify-center gap-3 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Connexion sécurisée...</span>
                </div>
              ) : (
                <>
                  <span>Se connecter à mon espace</span>
                  <FiArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          {/* Séparateur */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200" />
            <span className="flex-shrink mx-4 text-xs font-bold uppercase tracking-wider text-slate-400">
              ou
            </span>
            <div className="flex-grow border-t border-slate-200" />
          </div>

          {/* Inscription */}
          <div className="text-center space-y-3">
            <p className="text-xs text-slate-500 font-medium">
              Nouveau sur PharmaGo ?
            </p>
            <Link
              to="/inscription"
              className="w-full h-14 flex items-center justify-center gap-2.5 rounded-2xl text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 hover:border-slate-300 transition-all duration-200 active:scale-[0.98] shadow-sm"
            >
              <FiUserPlus className="h-4.5 w-4.5 text-emerald-600" />
              <span>Créer un compte gratuitement</span>
            </Link>
          </div>
        </div>

        {/* Pied de page */}
        <div className="pt-8 text-center lg:text-left text-xs flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 text-slate-400">
          <p>&copy; {new Date().getFullYear()} PharmaGo.</p>
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <FiShield className="w-3.5 h-3.5 text-emerald-600" />
          </div>
        </div>
      </div>
    </div>
  )
}