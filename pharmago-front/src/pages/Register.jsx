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
  FiShield,
  FiEye,
  FiEyeOff,
  FiArrowRight,
} from 'react-icons/fi'

/*
|--------------------------------------------------------------------------
| Logo
|--------------------------------------------------------------------------
*/
function LogoMark({ size = 48 }) {
  return (
     <img 
            src="/pwa-192x192.png" 
            alt="Logo PharmaGo" 
            className="w-16 h-16 object-cover rounded-2xl shadow-md" 
          />
  )
}

/*
|--------------------------------------------------------------------------
| Champ de formulaire
|--------------------------------------------------------------------------
*/
function Field({
  label,
  icon,
  required,
  optional,
  hint,
  children,
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
        {label}

        {required && (
          <span className="text-emerald-600 ml-0.5">*</span>
        )}

        {optional && (
          <span className="font-normal normal-case tracking-normal text-slate-400">
            {' '}
            (facultatif)
          </span>
        )}
      </label>

      <div className="relative group">
        <div className="pointer-events-none absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 group-focus-within:text-emerald-600 transition-colors">
          {icon}
        </div>

        {children}
      </div>

      {hint && (
        <p className="text-xs text-slate-400">
          {hint}
        </p>
      )}
    </div>
  )
}

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
    carte_assurance: null,
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] =
    useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  /*
  |--------------------------------------------------------------------------
  | Gestion des champs
  |--------------------------------------------------------------------------
  */
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
  }

  /*
  |--------------------------------------------------------------------------
  | Gestion de la carte d'assurance
  |--------------------------------------------------------------------------
  */
  const handleFileChange = (e) => {
    const { name, files } = e.target

    if (files && files[0]) {
      setForm({
        ...form,
        [name]: files[0],
      })
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Inscription
  |--------------------------------------------------------------------------
  */
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
      formData.append(
        'password_confirmation',
        form.password_confirmation
      )
      formData.append('telephone', form.telephone)
      formData.append('role', form.role)

      if (form.date_naissance) {
        formData.append(
          'date_naissance',
          form.date_naissance
        )
      }

      /*
       * La carte d'identité a été complètement supprimée.
       */

      /*
       * Carte d'assurance facultative.
       */
      if (form.carte_assurance) {
        formData.append(
          'carte_assurance',
          form.carte_assurance
        )
      }

      await register(formData)

      navigate('/')
    } catch (err) {
      if (err.response?.data?.errors) {
        const validationErrors = Object.values(
          err.response.data.errors
        )
          .flat()
          .join(' ')

        setError(validationErrors)
      } else {
        setError(
          getErrorMessage(
            err,
            "Une erreur est survenue lors de l'inscription."
          )
        )
      }
    } finally {
      setLoading(false)
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Styles
  |--------------------------------------------------------------------------
  */
  const inputClass =
    'w-full h-14 rounded-2xl pl-12 pr-4 text-sm bg-slate-50 border-2 border-slate-200 text-slate-900 placeholder-slate-400 font-medium outline-none transition-all duration-200 hover:border-slate-300 focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 shadow-sm'

  const fileInputClass =
    'w-full h-14 rounded-2xl pl-12 pr-4 text-sm bg-slate-50 border-2 border-slate-200 text-slate-500 font-medium outline-none transition-all duration-200 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 flex items-center cursor-pointer file:cursor-pointer'

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-100 via-[#F1F5F9] to-emerald-50/50 text-slate-800 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-['Outfit',sans-serif]">

      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap');

        .font-brand {
          font-family: 'Outfit', sans-serif;
        }
      `}</style>

      {/* Décorations d'arrière-plan */}
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />

      <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-teal-500/10 blur-[120px] pointer-events-none" />

      {/* ================= EN-TÊTE ================= */}

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-xl">

        <Link
          to="/"
          className="flex items-center justify-center gap-3 mb-6 group"
        >
          <LogoMark size={48} />

          <span className="text-2xl font-brand font-bold tracking-tight text-slate-900">
            Pharma
            <span className="text-emerald-600">
              Go
            </span>
          </span>
        </Link>

        <div className="text-center space-y-1.5">

          <h1 className="font-brand text-3xl font-bold tracking-tight text-slate-900">
            Créer un compte patient
          </h1>

          <p className="text-sm text-slate-500">
            Déjà inscrit ?{' '}

            <Link
              to="/connexion"
              className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              Se connecter
            </Link>
          </p>

        </div>
      </div>

      {/* ================= FORMULAIRE ================= */}

      <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-xl">

        <div className="bg-white/90 backdrop-blur-xl py-10 px-6 sm:px-10 shadow-2xl shadow-slate-300/60 rounded-3xl border-2 border-slate-200/80">

          {error && (
            <div className="mb-6">
              <Alert
                type="error"
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* Nom / Prénom */}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

              <Field
                label="Nom"
                required
                icon={<FiUser className="w-5 h-5" />}
              >
                <input
                  type="text"
                  name="nom"
                  value={form.nom}
                  onChange={handleChange}
                  required
                  placeholder="Votre nom"
                  className={inputClass}
                />
              </Field>

              <Field
                label="Prénom"
                required
                icon={<FiUser className="w-5 h-5" />}
              >
                <input
                  type="text"
                  name="prenom"
                  value={form.prenom}
                  onChange={handleChange}
                  required
                  placeholder="Votre prénom"
                  className={inputClass}
                />
              </Field>

            </div>

            {/* Email / Téléphone */}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

              <Field
                label="Adresse email"
                required
                icon={<FiMail className="w-5 h-5" />}
              >
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="nom@exemple.com"
                  className={inputClass}
                  autoComplete="email"
                />
              </Field>

              <Field
                label="Téléphone"
                required
                icon={<FiPhone className="w-5 h-5" />}
              >
                <input
                  type="tel"
                  name="telephone"
                  value={form.telephone}
                  onChange={handleChange}
                  required
                  placeholder="+225 ..."
                  className={inputClass}
                  autoComplete="tel"
                />
              </Field>

            </div>

            {/* Date de naissance */}

            <Field
              label="Date de naissance"
              optional
              icon={<FiCalendar className="w-5 h-5" />}
            >
              <input
                type="date"
                name="date_naissance"
                value={form.date_naissance}
                onChange={handleChange}
                className={`${inputClass} text-slate-700`}
              />
            </Field>

            {/* Mots de passe */}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

              <Field
                label="Mot de passe"
                required
                icon={<FiLock className="w-5 h-5" />}
              >
                <input
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className={`${inputClass} pr-12`}
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  tabIndex={-1}
                  aria-label={
                    showPassword
                      ? 'Masquer le mot de passe'
                      : 'Afficher le mot de passe'
                  }
                >
                  {showPassword ? (
                    <FiEyeOff className="h-5 w-5" />
                  ) : (
                    <FiEye className="h-5 w-5" />
                  )}
                </button>
              </Field>

              <Field
                label="Confirmer le mot de passe"
                required
                icon={<FiLock className="w-5 h-5" />}
              >
                <input
                  type={
                    showPasswordConfirm
                      ? 'text'
                      : 'password'
                  }
                  name="password_confirmation"
                  value={form.password_confirmation}
                  onChange={handleChange}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className={`${inputClass} pr-12`}
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                  onClick={() =>
                    setShowPasswordConfirm(
                      !showPasswordConfirm
                    )
                  }
                  tabIndex={-1}
                  aria-label={
                    showPasswordConfirm
                      ? 'Masquer la confirmation'
                      : 'Afficher la confirmation'
                  }
                >
                  {showPasswordConfirm ? (
                    <FiEyeOff className="h-5 w-5" />
                  ) : (
                    <FiEye className="h-5 w-5" />
                  )}
                </button>
              </Field>

            </div>

            {/* Carte d'assurance */}

            <Field
              label="Carte d'assurance"
              optional
              icon={<FiShield className="w-5 h-5" />}
              hint="Facultatif — vous pourrez également l'ajouter ultérieurement."
            >
              <input
                type="file"
                name="carte_assurance"
                onChange={handleFileChange}
                accept=".jpg,.jpeg,.png,.pdf"
                className={fileInputClass}
              />
            </Field>

            {/* Bouton */}

            <div className="pt-2">

              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 flex justify-center items-center gap-3 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40"
              >

                {loading ? (
                  <div className="flex items-center gap-2">

                    <Loader size="sm" />

                    <span>
                      Création en cours...
                    </span>

                  </div>
                ) : (
                  <>
                    <span>
                      S'inscrire gratuitement
                    </span>

                    <FiArrowRight className="h-5 w-5" />
                  </>
                )}

              </button>

            </div>

          </form>
        </div>

        {/* Pied de page */}

        <div className="relative z-10 mt-8 text-center text-xs text-slate-400">
          <p>
            &copy; {new Date().getFullYear()} PharmaGo.
            Tous droits réservés.
          </p>
        </div>

      </div>
    </div>
  )
}