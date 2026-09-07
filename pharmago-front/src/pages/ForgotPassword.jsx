import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiArrowLeft,
  FiMail,
  FiArrowRight,
  FiShield,
} from 'react-icons/fi'

import { forgotPassword } from '../api/api.js'

export default function ForgotPassword() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError('')
    setSuccess('')

    const cleanEmail = email.trim().toLowerCase()

    // =========================================================
    // VALIDATION FRONTEND
    // =========================================================

    if (!cleanEmail) {
      setError("L'adresse e-mail est obligatoire.")
      return
    }

    // Vérification simple du format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailRegex.test(cleanEmail)) {
      setError("Veuillez entrer une adresse e-mail valide.")
      return
    }

    try {
      setLoading(true)

      // =======================================================
      // APPEL API
      // =======================================================

      const response = await forgotPassword(cleanEmail)

      console.log(
        'Forgot password:',
        response.data
      )

      // =======================================================
      // VÉRIFICATION DE LA RÉPONSE DU SERVEUR
      // =======================================================

      if (response.data?.status !== 'success') {
        setError(
          response.data?.message ||
          "Impossible d'envoyer le code OTP."
        )

        return
      }

      // =======================================================
      // SUCCÈS
      // =======================================================

      setSuccess(
        response.data?.message ||
        'Un code OTP a été envoyé à votre adresse e-mail.'
      )

      // =======================================================
      // REDIRECTION VERS LA PAGE OTP
      // =======================================================

      setTimeout(() => {
        navigate(
          `/verification-otp?email=${encodeURIComponent(
            cleanEmail
          )}`
        )
      }, 800)

    } catch (err) {
      console.error(
        'Erreur forgot password:',
        err
      )

      // =======================================================
      // RÉCUPÉRATION DU MESSAGE BACKEND
      // =======================================================

      const backendMessage =
        err.response?.data?.message

      const validationMessage =
        err.response?.data?.errors?.email?.[0]

      const message =
        backendMessage ||
        validationMessage ||
        "Une erreur est survenue. Veuillez réessayer."

      setError(message)

      // Important :
      // aucune navigation vers la page OTP ici.
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f9f8] flex items-center justify-center px-4 py-8">

      {/* Décoration arrière-plan */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">

        <div className="absolute -top-40 -left-40 w-[450px] h-[450px] rounded-full bg-emerald-200/30 blur-[120px]" />

        <div className="absolute -bottom-40 -right-40 w-[450px] h-[450px] rounded-full bg-teal-200/20 blur-[120px]" />

      </div>

      <div className="relative w-full max-w-[460px]">

        {/* =====================================================
            RETOUR
        ====================================================== */}

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="
            group
            flex
            items-center
            gap-2
            mb-6
            text-sm
            font-semibold
            text-slate-500
            hover:text-emerald-600
            transition-colors
          "
        >
          <FiArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />

          Retour
        </button>

        {/* =====================================================
            CARTE
        ====================================================== */}

        <div className="
          bg-white
          rounded-[28px]
          border
          border-slate-100
          shadow-[0_25px_70px_-25px_rgba(15,23,42,0.20)]
          p-7
          sm:p-9
        ">

          {/* ===================================================
              HEADER
          ==================================================== */}

          <div className="text-center mb-8">

            <div className="
              w-14
              h-14
              mx-auto
              rounded-2xl
              bg-emerald-50
              border
              border-emerald-100
              flex
              items-center
              justify-center
              mb-5
            ">
              <FiMail className="w-6 h-6 text-emerald-600" />
            </div>

            <h1 className="
              text-2xl
              sm:text-3xl
              font-bold
              tracking-tight
              text-slate-900
            ">
              Réinitialiser le mot de passe
            </h1>

            <p className="
              text-sm
              leading-6
              text-slate-500
              mt-3
              max-w-sm
              mx-auto
            ">
              Entrez l'adresse e-mail associée à votre
              compte PharmaGo pour recevoir un code de
              vérification.
            </p>

          </div>

          {/* ===================================================
              ERREUR
          ==================================================== */}

          {error && (
            <div className="
              mb-5
              rounded-2xl
              border
              border-rose-200
              bg-rose-50
              px-4
              py-3.5
            ">

              <div className="flex items-start gap-3">

                <div className="
                  w-6
                  h-6
                  shrink-0
                  rounded-full
                  bg-rose-100
                  flex
                  items-center
                  justify-center
                  text-rose-600
                  text-xs
                  font-bold
                ">
                  !
                </div>

                <p className="
                  text-sm
                  leading-5
                  font-medium
                  text-rose-700
                ">
                  {error}
                </p>

              </div>

            </div>
          )}

          {/* ===================================================
              SUCCÈS
          ==================================================== */}

          {success && (
            <div className="
              mb-5
              rounded-2xl
              border
              border-emerald-200
              bg-emerald-50
              px-4
              py-3.5
            ">

              <div className="flex items-start gap-3">

                <div className="
                  w-6
                  h-6
                  shrink-0
                  rounded-full
                  bg-emerald-100
                  flex
                  items-center
                  justify-center
                  text-emerald-600
                  text-xs
                  font-bold
                ">
                  ✓
                </div>

                <p className="
                  text-sm
                  leading-5
                  font-medium
                  text-emerald-700
                ">
                  {success}
                </p>

              </div>

            </div>
          )}

          {/* ===================================================
              FORMULAIRE
          ==================================================== */}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* EMAIL */}

            <div>

              <label
                htmlFor="email"
                className="
                  block
                  text-xs
                  font-bold
                  uppercase
                  tracking-wider
                  text-slate-600
                  mb-2.5
                "
              >
                Adresse e-mail
              </label>

              <div className="relative group">

                <div className="
                  absolute
                  inset-y-0
                  left-0
                  flex
                  items-center
                  pl-4
                  pointer-events-none
                ">
                  <FiMail className="
                    w-[18px]
                    h-[18px]
                    text-slate-400
                    group-focus-within:text-emerald-600
                    transition-colors
                  " />
                </div>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)

                    // Effacer l'erreur quand l'utilisateur
                    // recommence à modifier l'adresse.
                    if (error) {
                      setError('')
                    }
                  }}
                  placeholder="nom@exemple.com"
                  autoComplete="email"
                  disabled={loading}
                  className="
                    w-full
                    h-14
                    pl-11
                    pr-4
                    rounded-2xl
                    bg-slate-50
                    border
                    border-slate-200
                    text-sm
                    text-slate-900
                    placeholder:text-slate-400
                    outline-none
                    transition-all
                    duration-200
                    hover:border-slate-300
                    focus:bg-white
                    focus:border-emerald-500
                    focus:ring-4
                    focus:ring-emerald-500/10
                    disabled:opacity-60
                    disabled:cursor-not-allowed
                  "
                />

              </div>

            </div>

            {/* BOUTON */}

            <button
              type="submit"
              disabled={loading}
              className="
                group
                w-full
                h-14
                flex
                items-center
                justify-center
                gap-3
                rounded-2xl
                bg-emerald-600
                hover:bg-emerald-700
                text-white
                text-sm
                font-bold
                shadow-lg
                shadow-emerald-600/20
                hover:shadow-emerald-600/30
                active:scale-[0.99]
                disabled:opacity-60
                disabled:cursor-not-allowed
                transition-all
                duration-200
              "
            >

              {loading ? (
                <>
                  <span className="
                    w-5
                    h-5
                    border-2
                    border-white/30
                    border-t-white
                    rounded-full
                    animate-spin
                  " />

                  Vérification en cours...
                </>
              ) : (
                <>
                  Envoyer le code

                  <FiArrowRight className="
                    w-4
                    h-4
                    group-hover:translate-x-1
                    transition-transform
                  " />
                </>
              )}

            </button>

          </form>

          {/* ===================================================
              SÉCURITÉ
          ==================================================== */}

          <div className="
            flex
            items-center
            justify-center
            gap-2
            mt-7
            pt-6
            border-t
            border-slate-100
            text-[11px]
            text-slate-400
          ">

            <FiShield className="w-3.5 h-3.5 text-emerald-500" />

            <span>
              Vos données sont protégées et sécurisées
            </span>

          </div>

        </div>

        {/* =====================================================
            FOOTER
        ====================================================== */}

        <p className="
          text-center
          text-[11px]
          text-slate-400
          mt-6
        ">
          © {new Date().getFullYear()} PharmaGo
        </p>

      </div>

    </div>
  )
}