import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FiArrowLeft, FiCheckCircle, FiEye, FiEyeOff } from 'react-icons/fi'
import api from '../api/axios'
import Alert from '../components/Alert'

const INK = '#12312E'
const PAPER = '#F3F5F1'
const CARD = '#FBFAF7'
const ACCENT = '#D64545'
const LINE = '#CBD9CF'
const MUTED = '#5C6F67'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const email = searchParams.get('email') || ''
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError('')
    setSuccess('')

    if (!email || !token) {
      setError('Les informations de réinitialisation sont incomplètes.')
      return
    }

    if (password.length < 6) {
      setError(
        'Le nouveau mot de passe doit contenir au moins 6 caractères.'
      )
      return
    }

    if (password !== passwordConfirmation) {
      setError('La confirmation du mot de passe ne correspond pas.')
      return
    }

    try {
      setLoading(true)

      await api.post('/auth/reset-password', {
        email,
        token,
        password,
        password_confirmation: passwordConfirmation,
      })

      setSuccess(
        'Votre mot de passe a été modifié avec succès.'
      )

      setTimeout(() => {
        navigate('/login')
      }, 1500)

    } catch (err) {
      console.error('Erreur reset password :', err)

      setError(
        err.response?.data?.message ||
        "Impossible de modifier le mot de passe."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-5 py-10"
      style={{ backgroundColor: PAPER }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
      `}</style>

      <div className="w-full max-w-md">

        <div className="flex justify-center mb-8">
          <div
            className="text-xl font-semibold"
            style={{
              color: INK,
              fontFamily: "'Fraunces', serif",
            }}
          >
            Pharma<span style={{ color: ACCENT }}>Go</span>
          </div>
        </div>

        <div
          className="rounded-3xl p-7 sm:p-9 shadow-xl"
          style={{
            backgroundColor: CARD,
            border: `1px solid ${LINE}`,
            fontFamily: "'Inter', sans-serif",
          }}
        >

          <button
            type="button"
            onClick={() => navigate('/verify-otp?email=' + encodeURIComponent(email))}
            className="flex items-center gap-2 text-xs font-semibold mb-8"
            style={{ color: MUTED }}
          >
            <FiArrowLeft />
            Retour au code OTP
          </button>

          <div className="space-y-3 mb-8">
            <p
              className="text-[11px] font-medium uppercase tracking-[0.2em]"
              style={{
                color: MUTED,
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            >
              Nouveau mot de passe
            </p>

            <h1
              className="text-3xl"
              style={{
                color: INK,
                fontFamily: "'Fraunces', serif",
                fontWeight: 500,
              }}
            >
              Créer un nouveau mot de passe
            </h1>

            <p
              className="text-sm"
              style={{ color: MUTED }}
            >
              Choisissez un nouveau mot de passe pour votre compte.
            </p>
          </div>

          {error && (
            <div className="mb-5">
              <Alert type="error" onClose={() => setError('')}>
                {error}
              </Alert>
            </div>
          )}

          {success && (
            <div
              className="mb-5 rounded-xl px-4 py-3 text-sm flex items-center gap-2"
              style={{
                backgroundColor: '#ECFDF3',
                border: '1px solid #BBF7D0',
                color: '#166534',
              }}
            >
              <FiCheckCircle />
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Mot de passe */}
            <div>
              <label
                htmlFor="password"
                className="block text-[11px] font-semibold uppercase tracking-wider mb-2"
                style={{ color: MUTED }}
              >
                Nouveau mot de passe
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 rounded-xl px-4 pr-12 text-sm outline-none"
                  style={{
                    backgroundColor: PAPER,
                    border: `1px solid ${LINE}`,
                    color: INK,
                  }}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  style={{ color: MUTED }}
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
              <label
                htmlFor="password_confirmation"
                className="block text-[11px] font-semibold uppercase tracking-wider mb-2"
                style={{ color: MUTED }}
              >
                Confirmer le mot de passe
              </label>

              <div className="relative">
                <input
                  id="password_confirmation"
                  type={showConfirmation ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={passwordConfirmation}
                  onChange={(e) =>
                    setPasswordConfirmation(e.target.value)
                  }
                  className="w-full h-12 rounded-xl px-4 pr-12 text-sm outline-none"
                  style={{
                    backgroundColor: PAPER,
                    border: `1px solid ${LINE}`,
                    color: INK,
                  }}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmation(!showConfirmation)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  style={{ color: MUTED }}
                >
                  {showConfirmation
                    ? <FiEyeOff />
                    : <FiEye />
                  }
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-xl text-sm font-bold text-white disabled:opacity-50"
              style={{ backgroundColor: INK }}
            >
              {loading ? (
                <>
                  <svg
                    className="h-5 w-5 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />

                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>

                  Modification...
                </>
              ) : (
                <>
                  Modifier le mot de passe
                  <FiCheckCircle />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}