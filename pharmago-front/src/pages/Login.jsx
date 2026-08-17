import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage } from '../api/errors'
import Alert from '../components/Alert'
import { captureLocation, getStoredLocation } from '../utils/geolocation'

// Import des icônes React
import { 
  FiMail, 
  FiLock, 
  FiEye, 
  FiEyeOff, 
  FiLogIn,
  FiUserPlus,
  FiShield,
  FiActivity
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
    <div className="min-h-screen w-full lg:grid lg:grid-cols-12 bg-slate-50 font-sans">
      
      {/* CÔTÉ GAUCHE : Panneau visuel / Branding immersif (Visible uniquement sur grands écrans) */}
      <div className="hidden lg:flex lg:col-span-5 xl:col-span-6 relative bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950 p-12 flex-col justify-between overflow-hidden text-white">
        {/* Motifs de fond géométriques & lumineux */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-teal-400/20 blur-3xl pointer-events-none"></div>
        
        {/* Grille subtile en arrière-plan */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

        {/* En-tête du panneau gauche */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
            <FiActivity className="w-5 h-5 text-emerald-400" />
          </div>
          <span className="text-xl font-bold tracking-tight">Pharma<span className="text-emerald-400">Go</span></span>
        </div>

        {/* Contenu central du panneau gauche */}
        <div className="relative z-10 my-auto py-12 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 text-xs font-semibold backdrop-blur-xs">
            <FiShield className="w-3.5 h-3.5" />
            <span>Sécurité certifiée & Conforme Santé</span>
          </div>
          
          <h2 className="text-4xl xl:text-5xl font-black tracking-tight leading-[1.15]">
            Optimisez la gestion de votre santé et de vos officines.
          </h2>
          
          <p className="text-emerald-100/80 text-base max-w-md leading-relaxed font-normal">
            Accédez à votre espace centralisé pour suivre vos ordonnances, interagir avec vos pharmacies partenaires et piloter votre activité en toute simplicité.
          </p>
        </div>

        {/* Pied du panneau gauche */}
        <div className="relative z-10 flex items-center justify-between text-xs text-emerald-200/60 pt-6 border-t border-white/10">
          <p>&copy; {new Date().getFullYear()} PharmaGo. Tous droits réservés.</p>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Systèmes opérationnels
          </span>
        </div>
      </div>

      {/* CÔTÉ DROIT : Formulaire de connexion épuré et moderne */}
      <div className="col-span-12 lg:col-span-7 xl:col-span-6 flex flex-col justify-between min-h-screen p-6 sm:p-12 lg:p-16 bg-white">
        
        {/* En-tête mobile uniquement */}
        <div className="lg:hidden flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <FiActivity className="w-4 h-4" />
            </div>
            <span className="text-lg font-bold text-slate-900">Pharma<span className="text-emerald-600">Go</span></span>
          </div>
        </div>

        <div className="w-full max-w-md mx-auto my-auto space-y-8">
          
          {/* Titre et bienvenue */}
          <div className="space-y-2 text-left">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Bon retour !</h1>
            <p className="text-sm text-slate-500">
              Veuillez saisir vos identifiants pour accéder à votre tableau de bord.
            </p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Adresse e-mail
              </label>
              <div className="relative group">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                  <FiMail className="h-4.5 w-4.5" />
                </div>
                <input
                  type="email"
                  id="email"
                  required
                  placeholder="nom@exemple.com"
                  className="w-full h-12 rounded-2xl border border-slate-200 bg-slate-50/50 pl-11 pr-4 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" class="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Mot de passe
                </label>
                <Link 
                  to="/forgot-password" 
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative group">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                  <FiLock className="h-4.5 w-4.5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  required
                  placeholder="••••••••"
                  className="w-full h-12 rounded-2xl border border-slate-200 bg-slate-50/50 pl-11 pr-12 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <FiEyeOff className="h-4.5 w-4.5" /> : <FiEye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            {/* Bouton de soumission */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-2 flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition-all duration-200 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Connexion en cours...</span>
                </div>
              ) : (
                <>
                  <span>Se connecter</span>
                  <FiLogIn className="h-4.5 w-4.5" />
                </>
              )}
            </button>
          </form>

          {/* Séparateur */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-xs font-bold uppercase tracking-wider text-slate-400">ou</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Inscription */}
          <div className="text-center space-y-3">
            <p className="text-xs text-slate-500">
              Vous n'avez pas encore de compte sur la plateforme ?
            </p>
            <Link
              to="/inscription"
              className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white text-xs font-bold text-slate-700 transition-all duration-200 hover:border-emerald-600 hover:bg-emerald-50/20 hover:text-emerald-700 active:scale-[0.98]"
            >
              <FiUserPlus className="h-4 w-4" />
              <span>Créer un compte gratuitement</span>
            </Link>
          </div>

        </div>

        {/* Pied de page mobile / minimaliste */}
        <div className="pt-8 text-center lg:text-left text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-100">
          <p>&copy; {new Date().getFullYear()} PharmaGo. Tous droits réservés.</p>
          <p className="flex items-center justify-center gap-1.5 text-slate-500 font-medium">
            <FiShield className="w-3.5 h-3.5 text-emerald-600" />
            Sécurisé SSL 256-bit
          </p>
        </div>

      </div>
    </div>
  )
}