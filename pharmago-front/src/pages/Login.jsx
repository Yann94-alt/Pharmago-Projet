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
  FiUserPlus
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
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Identifiants incorrects.'))
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-tr from-emerald-50/30 via-white to-green-50/40 px-4 py-12 sm:px-6 lg:px-8">
      
      {/* Éléments de fond médicaux & scientifiques discrets */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        {/* Cercles de flou gradients */}
        <div className="absolute -left-20 -top-20 h-[450px] w-[450px] rounded-full bg-emerald-100/30 blur-3xl" />
        <div className="absolute -right-20 bottom-10 h-[500px] w-[500px] rounded-full bg-green-100/30 blur-3xl" />
        
        {/* Lignes sinusoïdales discrètes de type ECG en arrière-plan */}
        <svg className="absolute top-1/4 left-10 w-64 h-32 text-emerald-200/40" viewBox="0 0 200 100" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M0,50 L40,50 L50,20 L60,80 L70,45 L75,55 L85,50 L200,50" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <svg className="absolute bottom-1/4 right-10 w-80 h-40 text-emerald-100/50" viewBox="0 0 200 100" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M0,50 L50,50 L60,30 L70,70 L75,48 L80,52 L90,50 L200,50" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Container Principal */}
      <div className="relative z-10 w-full max-w-[460px] transform transition-all duration-500 animate-fadeIn">
        
        {/* 1. En-tête de bienvenue sans logo */}
        <div className="mb-8 flex flex-col items-center text-center">
          
          {/* Typographie de marque élégante */}
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 font-sans">
            Pharma<span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">Go</span>
          </h1>
          
          {/* Badge de réassurance */}
          <span className="mt-2.5 inline-flex items-center rounded-full bg-emerald-50 px-3 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/10">
            Portail Médical Sécurisé
          </span>

          {/* Texte d'accueil utilisateur */}
          <div className="mt-5 space-y-2">
            <h2 className="text-xl font-bold text-slate-800">Bienvenue sur PharmaGo</h2>
            <p className="max-w-xs mx-auto text-sm text-slate-500 leading-relaxed">
              Votre solution digitale pour une gestion simple et rapide de votre pharmacie.
            </p>
          </div>
        </div>

        {/* 2. Carte de Connexion Premium */}
        <div className="rounded-[2rem] border border-white/80 bg-white/95 p-8 shadow-2xl shadow-emerald-950/5 backdrop-blur-md sm:p-10">
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}

            {/* 3. Champ d'adresse e-mail optimisé */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 pl-1">
                Adresse e-mail
              </label>
              <div className="relative group">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors duration-200">
                  <FiMail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  id="email"
                  required
                  placeholder="exemple@pharmago.fr"
                  className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50/50 pl-11 pr-4 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 hover:border-slate-300"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            {/* Champ de mot de passe optimisé */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 pl-1">
                Mot de passe
              </label>
              <div className="relative group">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors duration-200">
                  <FiLock className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  required
                  placeholder="••••••••"
                  className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50/50 pl-11 pr-12 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 hover:border-slate-300"
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
                  {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* 4. Lien de mot de passe oublié élégant */}
            <div className="flex justify-end px-1">
              <Link 
                to="/forgot-password" 
                className="text-xs font-semibold text-emerald-600 transition-all duration-200 hover:text-emerald-700 hover:underline active:scale-95"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            {/* 5. Bouton de Connexion Premium */}
            <button
              type="submit"
              disabled={loading}
              className="group relative flex h-12 w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-sm font-bold text-white shadow-md shadow-emerald-600/10 transition-all duration-300 hover:opacity-95 hover:shadow-lg hover:shadow-emerald-600/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
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
                  <FiLogIn className="h-4.5 w-4.5 transition-transform group-hover:translate-x-0.5" />
                  <span>Se connecter</span>
                </>
              )}
            </button>
          </form>

          {/* Ligne de séparation élégante */}
          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-wider">
              <span className="bg-white px-4 text-slate-400">Nouveau membre</span>
            </div>
          </div>

          {/* 6. Zone d'inscription simplifiée */}
          <div className="flex flex-col items-center space-y-3.5">
            <p className="text-xs font-medium text-slate-500">
              Vous n'avez pas encore de compte ?
            </p>
            <Link
              to="/inscription"
              className="flex w-full h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 transition-all duration-200 hover:border-emerald-500 hover:bg-emerald-50/30 hover:text-emerald-700 active:scale-[0.98]"
            >
              <FiUserPlus className="h-4 w-4" />
              <span>Créer un compte</span>
            </Link>
          </div>

        </div>
      </div>
      
      {/* Mentions de sécurité réglementaires */}
      <div className="absolute bottom-4 flex flex-col items-center gap-1 text-[10px] font-medium text-slate-400">
        <p>&copy; {new Date().getFullYear()} PharmaGo. Tous droits réservés.</p>
        <p className="flex items-center gap-1">
          <svg className="h-3 w-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.9C2.044 4.86 2 4.734 2 4.617V4a2 2 0 012-2h12a2 2 0 012 2v.616c0 .118-.044.244-.166.285C14.393 6.072 12 9.695 12 14v4a1 1 0 01-1.555.832l-3-2A1 1 0 017 16v-2c0-4.305-2.393-7.928-5.834-9.1z" clipRule="evenodd" />
          </svg>
          Connexion sécurisée SSL 256-bit
        </p>
      </div>
    </div>
  )
}