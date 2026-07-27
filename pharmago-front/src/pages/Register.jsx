import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage } from '../api/errors'
import Alert from '../components/Alert'
import { captureLocation } from '../utils/geolocation'

const initialForm = {
  nom: '',
  prenom: '',
  email: '',
  password: '',
  password_confirmation: '',
  telephone: '',
  role: 'patient', // Conservé en arrière-plan pour la logique interne
  date_naissance: '',
}

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [locationStatus, setLocationStatus] = useState('idle') // idle | loading | ok | denied

  useEffect(() => {
    setLocationStatus('loading')
    captureLocation()
      .then(() => setLocationStatus('ok'))
      .catch(() => setLocationStatus('denied'))
  }, [])

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form)
      if (locationStatus !== 'ok') {
        captureLocation().catch(() => {})
      }
      navigate('/')
    } catch (err) {
      setError(getErrorMessage(err, "L'inscription a échoué."))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-tr from-green-50/50 via-white to-green-50/30 px-4 py-12 sm:px-6 lg:px-8 overflow-hidden">
      
      {/* Éléments décoratifs discrets en arrière-plan */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none select-none">
        <svg className="absolute top-12 left-12 w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 10.5h-5.5V5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v5.5H5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h5.5V19c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z"/>
        </svg>
        <svg className="absolute bottom-16 right-16 w-48 h-48" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4.5 10.5C3.67 10.5 3 11.17 3 12s.67 1.5 1.5 1.5h15c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5h-15z M10.5 4.5C10.5 3.67 11.17 3 12 3s1.5.67 1.5 1.5v15c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5v-15z"/>
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-xl">
        {/* En-tête épuré et professionnel */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Créer votre compte <span className="text-[#16A34A]">PharmaGo</span>
          </h1>
          <p className="mt-3 text-base text-slate-500 max-w-md mx-auto">
            Accédez facilement à votre espace de gestion pharmaceutique.
          </p>
        </div>

        {/* Carte d'inscription Premium */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-100 border border-slate-100/80 px-6 py-10 sm:px-10">
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <Alert type="error" onClose={() => setError('')}>{error}</Alert>

            {/* Notification de géolocalisation moderne */}
            <div className="transition-all duration-300">
              {locationStatus === 'loading' && (
                <div className="flex items-center gap-3 bg-blue-50/60 border border-blue-100 text-blue-700 px-4 py-3 rounded-2xl text-sm">
                  <span className="animate-pulse">📍</span>
                  <p className="font-medium">Vérification de votre localisation...</p>
                </div>
              )}
              {locationStatus === 'ok' && (
                <div className="flex items-center gap-3 bg-green-50/60 border border-green-100 text-green-700 px-4 py-3 rounded-2xl text-sm">
                  <span>✅</span>
                  <p className="font-medium">Localisation enregistrée avec succès.</p>
                </div>
              )}
              
            </div>

            {/* Rangée : Nom & Prénom */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nom</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <input
                    required
                    type="text"
                    placeholder="Dupont"
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 transition-all focus:border-[#16A34A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 text-sm"
                    value={form.nom}
                    onChange={set('nom')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Prénom</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <input
                    required
                    type="text"
                    placeholder="Jean"
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 transition-all focus:border-[#16A34A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 text-sm"
                    value={form.prenom}
                    onChange={set('prenom')}
                  />
                </div>
              </div>
            </div>

            {/* Champ : Adresse Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Adresse e-mail</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <input
                  required
                  type="email"
                  placeholder="jean.dupont@exemple.com"
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 transition-all focus:border-[#16A34A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 text-sm"
                  value={form.email}
                  onChange={set('email')}
                />
              </div>
            </div>

            {/* Rangée : Téléphone & Date de naissance */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Téléphone</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  </div>
                  <input
                    type="tel"
                    placeholder="06 12 34 56 78"
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 transition-all focus:border-[#16A34A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 text-sm"
                    value={form.telephone}
                    onChange={set('telephone')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date de naissance</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <input
                    type="date"
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-slate-900 transition-all focus:border-[#16A34A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 text-sm"
                    value={form.date_naissance}
                    onChange={set('date_naissance')}
                  />
                </div>
              </div>
            </div>

            {/* Rangée : Mot de passe & Confirmation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mot de passe</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                  <input
                    required
                    type="password"
                    minLength={6}
                    placeholder="••••••••"
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 transition-all focus:border-[#16A34A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 text-sm"
                    value={form.password}
                    onChange={set('password')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirmation</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  </div>
                  <input
                    required
                    type="password"
                    minLength={6}
                    placeholder="••••••••"
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 transition-all focus:border-[#16A34A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 text-sm"
                    value={form.password_confirmation}
                    onChange={set('password_confirmation')}
                  />
                </div>
              </div>
            </div>

            {/* Bouton Soumettre Premium */}
            <button
              type="submit"
              disabled={loading}
              className="relative w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-[#16A34A] hover:bg-[#15803d] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#16A34A] transition-all shadow-md shadow-green-600/10 disabled:opacity-75 disabled:cursor-not-allowed transform active:scale-[0.99]"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Création du compte...</span>
                </div>
              ) : (
                'Créer mon compte'
              )}
            </button>

            {/* Lien Connexion */}
            <p className="text-center text-sm text-slate-500 pt-2">
              Vous avez déjà un compte ?{' '}
              <Link to="/connexion" className="font-semibold text-[#16A34A] hover:text-[#15803d] transition-colors underline-offset-4 hover:underline">
                Se connecter
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}