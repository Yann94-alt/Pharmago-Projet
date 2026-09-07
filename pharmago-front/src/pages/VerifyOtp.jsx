import { useState } from 'react'
import {
  useNavigate,
  useSearchParams,
} from 'react-router-dom'

import {
  FiArrowLeft,
  FiLock,
  FiCheck,
  FiEye,
  FiEyeOff,
} from 'react-icons/fi'

import { resetPassword } from '../api/api.js'


export default function VerifyOtp() {

  const navigate = useNavigate()

  const [searchParams] =
    useSearchParams()


  const email =
    searchParams.get('email') || ''


  const [token, setToken] =
    useState('')


  const [password, setPassword] =
    useState('')


  const [passwordConfirmation, setPasswordConfirmation] =
    useState('')


  const [showPassword, setShowPassword] =
    useState(false)


  const [showConfirmation, setShowConfirmation] =
    useState(false)


  const [loading, setLoading] =
    useState(false)


  const [error, setError] =
    useState('')


  const [success, setSuccess] =
    useState('')


  const handleSubmit = async (e) => {

    e.preventDefault()

    setError('')
    setSuccess('')


    if (!email) {
      setError(
        "Adresse e-mail manquante."
      )
      return
    }


    if (!token.trim()) {
      setError(
        "Veuillez saisir le code OTP."
      )
      return
    }


    if (token.length !== 6) {
      setError(
        "Le code OTP doit contenir 6 chiffres."
      )
      return
    }


    if (!password) {
      setError(
        "Veuillez saisir votre nouveau mot de passe."
      )
      return
    }


    if (password.length < 6) {
      setError(
        "Le mot de passe doit contenir au moins 6 caractères."
      )
      return
    }


    if (
      password !==
      passwordConfirmation
    ) {
      setError(
        "La confirmation du mot de passe ne correspond pas."
      )
      return
    }


    try {

      setLoading(true)


      const response =
        await resetPassword({
          email,
          token,
          password,
          password_confirmation:
            passwordConfirmation,
        })


      console.log(
        '🔐 Reset password:',
        response.data
      )


      setSuccess(
        response.data?.message ||
        'Votre mot de passe a été modifié avec succès.'
      )


      /*
       * Retour vers la connexion
       */

      setTimeout(() => {

        navigate('/connexion', {
          replace: true,
        })

      }, 1500)


    } catch (err) {

      console.error(
        'Erreur reset password:',
        err
      )


      const message =
        err.response?.data?.message ||
        err.response?.data?.errors?.token?.[0] ||
        err.response?.data?.errors?.password?.[0] ||
        "Impossible de réinitialiser le mot de passe."


      setError(message)

    } finally {

      setLoading(false)

    }
  }


  return (

    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">

      <div className="w-full max-w-md">


        {/* Retour */}

        <button
          onClick={() => navigate('/mot-de-passe-oublie')}
          className="flex items-center gap-2 text-slate-600 hover:text-emerald-600 mb-6 text-sm font-semibold"
        >

          <FiArrowLeft />

          Retour

        </button>


        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-7">


          {/* Header */}

          <div className="text-center mb-7">

            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 flex items-center justify-center mb-4">

              <FiLock className="text-emerald-600 text-2xl" />

            </div>


            <h1 className="text-2xl font-bold text-slate-900">

              Réinitialiser le mot de passe

            </h1>


            <p className="text-sm text-slate-500 mt-2">

              Un code à 6 chiffres a été envoyé à

            </p>


            <p className="text-sm font-semibold text-emerald-600 mt-1 break-all">

              {email}

            </p>

          </div>


          {/* Erreur */}

          {error && (

            <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl px-4 py-3 text-sm">

              {error}

            </div>

          )}


          {/* Succès */}

          {success && (

            <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl px-4 py-3 text-sm flex items-center gap-2">

              <FiCheck />

              {success}

            </div>

          )}


          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >


            {/* OTP */}

            <div>

              <label className="block text-sm font-semibold text-slate-700 mb-2">

                Code OTP

              </label>


              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={token}
                onChange={(e) => {

                  const value =
                    e.target.value
                      .replace(/\D/g, '')

                  setToken(value)

                }}
                placeholder="123456"
                className="w-full text-center tracking-[0.5em] font-bold text-xl py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />

            </div>


            {/* Nouveau mot de passe */}

            <div>

              <label className="block text-sm font-semibold text-slate-700 mb-2">

                Nouveau mot de passe

              </label>


              <div className="relative">

                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />


                <input
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  value={password}
                  onChange={(e) =>
                    setPassword(
                      e.target.value
                    )
                  }
                  placeholder="Minimum 6 caractères"
                  className="w-full pl-11 pr-12 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoComplete="new-password"
                />


                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >

                  {showPassword
                    ? <FiEyeOff />
                    : <FiEye />
                  }

                </button>

              </div>

            </div>


            {/* Confirmation */}

            <div>

              <label className="block text-sm font-semibold text-slate-700 mb-2">

                Confirmer le mot de passe

              </label>


              <div className="relative">

                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />


                <input
                  type={
                    showConfirmation
                      ? 'text'
                      : 'password'
                  }
                  value={
                    passwordConfirmation
                  }
                  onChange={(e) =>
                    setPasswordConfirmation(
                      e.target.value
                    )
                  }
                  placeholder="Confirmez votre mot de passe"
                  className="w-full pl-11 pr-12 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoComplete="new-password"
                />


                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmation(
                      !showConfirmation
                    )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >

                  {showConfirmation
                    ? <FiEyeOff />
                    : <FiEye />
                  }

                </button>

              </div>

            </div>


            {/* Bouton */}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white py-3.5 rounded-2xl font-semibold transition-all active:scale-[0.98]"
            >

              {loading ? (

                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />

                  Modification...

                </>

              ) : (

                <>
                  <FiCheck />

                  Modifier le mot de passe

                </>

              )}

            </button>


          </form>


          {/* Renvoyer */}

          <div className="text-center mt-5">

            <button
              type="button"
              onClick={() =>
                navigate(
                  '/forgot-password'
                )
              }
              className="text-sm text-emerald-600 hover:text-emerald-700 font-semibold"
            >

              Renvoyer un nouveau code

            </button>

          </div>


        </div>

      </div>

    </div>
  )
}