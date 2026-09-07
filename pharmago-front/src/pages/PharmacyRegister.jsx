import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FiLock, FiPhone, FiMapPin, FiUser, FiNavigation, FiCheckCircle, FiAlertCircle } from 'react-icons/fi'
import { registerPharmacy } from '../api/api'
import Alert from '../components/Alert'
import { captureLocation } from '../utils/geolocation'

export default function PharmacyRegister() {
  const { token } = useParams()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    nom: '',
    adresse: '',
    telephone: '',
    password: '',
    latitude: '',
    longitude: '',
  })

  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Récupérer automatiquement la géolocalisation au chargement de la page
  useEffect(() => {
    const fetchLocation = async () => {
      setLocating(true)
      try {
        const coords = await captureLocation()
        if (coords?.lat && coords?.lng) {
          setFormData((prev) => ({
            ...prev,
            latitude: coords.lat,
            longitude: coords.lng,
          }))
        }
      } catch (err) {
        console.error("Erreur de géolocalisation automatique :", err)
      } finally {
        setLocating(false)
      }
    }

    fetchLocation()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const response = await registerPharmacy(token, formData)
      setSuccess(response.data?.message || 'Votre compte pharmacie a été créé avec succès.')
      
      setTimeout(() => {
        navigate('/connexion') // Redirection vers la page de connexion après succès
      }, 2500)
    } catch (err) {
      console.error("Erreur lors de l'inscription :", err)
      setError(err.response?.data?.message || 'Une erreur est survenue lors de l\'inscription.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/80 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/80 p-8">
        
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 mb-3 border border-emerald-200">
            Activation du compte
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Inscription Pharmacie
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Renseignez les informations de votre officine pour finaliser votre inscription.
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <Alert type="error" onClose={() => setError('')}>
              {error}
            </Alert>
          </div>
        )}

        {success && (
          <div className="mb-6">
            <Alert type="success">
              {success}
            </Alert>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <FiUser className="w-3.5 h-3.5 text-emerald-600" />
              Nom de la pharmacie <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nom"
              required
              value={formData.nom}
              onChange={handleChange}
              placeholder="Ex: Pharmacie du Progrès"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <FiMapPin className="w-3.5 h-3.5 text-emerald-600" />
              Adresse <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="adresse"
              required
              value={formData.adresse}
              onChange={handleChange}
              placeholder="Ex: Boulevard principal, Quartier..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <FiPhone className="w-3.5 h-3.5 text-emerald-600" />
              Téléphone <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="telephone"
              required
              value={formData.telephone}
              onChange={handleChange}
              placeholder="Ex: +225 0102030405"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <FiLock className="w-3.5 h-3.5 text-emerald-600" />
              Mot de passe (8 caractères min.) <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="password"
              required
              minLength={8}
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
            />
          </div>

          {/* Statut GPS discret */}
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-500">
            <FiNavigation className={`w-3.5 h-3.5 text-emerald-600 ${locating ? 'animate-spin' : ''}`} />
            <span>
              {locating 
                ? 'Récupération de la position GPS...' 
                : formData.latitude 
                  ? 'Position GPS capturée avec succès' 
                  : 'Position GPS non disponible'}
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Création en cours...' : 'Finaliser l\'inscription'}
          </button>

        </form>

      </div>
    </div>
  )
}