import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage } from '../api/errors'
import Alert from '../components/Alert'
import Loader from '../components/Loader'
import { 
  FiUser, 
  FiMail, 
  FiLock, 
  FiPhone, 
  FiCalendar, 
  FiUpload, 
  FiShield, 
  FiPlusSquare 
} from 'react-icons/fi'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    password_confirmation: '',
    telephone: '',
    role: 'patient',
    date_naissance: '',
    carte_identite: null,
    carte_assurance: null,
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
  }

  const handleFileChange = (e) => {
    const { name, files } = e.target
    if (files && files[0]) {
      setForm({
        ...form,
        [name]: files[0],
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('nom', form.nom)
      formData.append('prenom', form.prenom)
      formData.append('email', form.email)
      formData.append('password', form.password)
      formData.append('password_confirmation', form.password_confirmation)
      formData.append('telephone', form.telephone)
      formData.append('role', form.role)

      if (form.date_naissance) {
        formData.append('date_naissance', form.date_naissance)
      }

      if (form.carte_identite) {
        formData.append('carte_identite', form.carte_identite)
      }

      if (form.carte_assurance) {
        formData.append('carte_assurance', form.carte_assurance)
      }

      await register(formData)
      navigate('/')
    } catch (err) {
      if (err.response?.data?.errors) {
        const validationErrors = Object.values(err.response.data.errors).flat().join(' ')
        setError(validationErrors)
      } else {
        setError(getErrorMessage(err))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2.5 group mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#16A34A] to-teal-500 text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
            <FiPlusSquare className="h-7 w-7 stroke-[2.5]" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-slate-900">
            Pharma<span className="text-[#16A34A]">Go</span>
          </span>
        </Link>
        <h2 className="text-center text-2xl font-extrabold tracking-tight text-slate-900">
          Créer un compte patient
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Déjà inscrit ?{' '}
          <Link to="/connexion" className="font-semibold text-[#16A34A] hover:text-emerald-700 transition">
            Se connecter
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-100 sm:px-10">
          
          {error && <div className="mb-6"><Alert type="error" message={error} onClose={() => setError(null)} /></div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nom */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Nom
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <FiUser className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    name="nom"
                    value={form.nom}
                    onChange={handleChange}
                    required
                    placeholder="Votre nom"
                    className="block w-full pl-10 pr-3.5 py-3 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition"
                  />
                </div>
              </div>

              {/* Prénom */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Prénom
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <FiUser className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    name="prenom"
                    value={form.prenom}
                    onChange={handleChange}
                    required
                    placeholder="Votre prénom"
                    className="block w-full pl-10 pr-3.5 py-3 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Adresse email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <FiMail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="nom@exemple.com"
                    className="block w-full pl-10 pr-3.5 py-3 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition"
                  />
                </div>
              </div>

              {/* Téléphone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Téléphone
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <FiPhone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    name="telephone"
                    value={form.telephone}
                    onChange={handleChange}
                    required
                    placeholder="+225..."
                    className="block w-full pl-10 pr-3.5 py-3 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition"
                  />
                </div>
              </div>
            </div>

            {/* Date de naissance */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Date de naissance
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <FiCalendar className="w-4 h-4" />
                </div>
                <input
                  type="date"
                  name="date_naissance"
                  value={form.date_naissance}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3.5 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Mot de passe */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <FiLock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-3.5 py-3 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition"
                  />
                </div>
              </div>

              {/* Confirmation mot de passe */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <FiLock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    name="password_confirmation"
                    value={form.password_confirmation}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-3.5 py-3 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition"
                  />
                </div>
              </div>
            </div>

            {/* Pièce d'identité */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Pièce d'identité <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <FiUpload className="w-4 h-4" />
                </div>
                <input
                  type="file"
                  name="carte_identite"
                  onChange={handleFileChange}
                  accept=".jpg,.jpeg,.png,.pdf"
                  required
                  className="block w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-[#16A34A] hover:file:bg-emerald-100 transition focus:outline-none"
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                Votre pièce d'identité est nécessaire pour la vérification (jpg, jpeg, png, pdf).
              </p>
            </div>

            {/* Carte d'assurance */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Carte d'assurance <span className="text-slate-400 font-normal">(Facultatif)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <FiShield className="w-4 h-4" />
                </div>
                <input
                  type="file"
                  name="carte_assurance"
                  onChange={handleFileChange}
                  accept=".jpg,.jpeg,.png,.pdf"
                  className="block w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-[#16A34A] hover:file:bg-emerald-100 transition focus:outline-none"
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                Facultatif — vous pourrez l'ajouter plus tard si nécessaire.
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-md shadow-emerald-600/20 text-sm font-semibold text-white bg-[#16A34A] hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#16A34A] transition disabled:opacity-50"
              >
                {loading ? <Loader size="sm" /> : "S'inscrire"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}