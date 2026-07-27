import { useEffect, useState } from 'react'
import { 
  FiFileText, 
  FiUploadCloud, 
  FiFile, 
  FiCalendar, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiClock, 
  FiX 
} from 'react-icons/fi'
import api from '../api/axios'
import { getErrorMessage } from '../api/errors'
import Alert from '../components/Alert'
import StatutBadge from '../components/StatutBadge'

export default function Ordonnances() {
  const [ordonnances, setOrdonnances] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [fichier, setFichier] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchOrdonnances = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/ordonnances')
      setOrdonnances(data)
    } catch (err) {
      setError('Impossible de charger vos ordonnances.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrdonnances()
  }, [])

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!fichier) return
    setError('')
    setSuccess('')
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('fichier', fichier)
      await api.post('/ordonnances', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setSuccess('Ordonnance envoyée avec succès.')
      setFichier(null)
      e.target.reset()
      fetchOrdonnances()
    } catch (err) {
      setError(getErrorMessage(err, "L'envoi de l'ordonnance a échoué."))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* 1. Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-emerald-50/60 via-white to-slate-50/60 pt-12 pb-16 border-b border-emerald-100/40">
        <div className="absolute top-0 left-1/3 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/4 right-10 w-80 h-80 bg-teal-200/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-100/80 text-emerald-800 mb-4 border border-emerald-200/60 shadow-sm">
            <FiFileText className="w-3.5 h-3.5 text-emerald-600" />
            Espace Sécurisé
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Gestion de vos <span className="text-[#16A34A] bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600">ordonnances</span>
          </h1>
          <p className="mt-3 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            Transmettez vos ordonnances médicales en toute sécurité pour simplifier la réservation de vos traitements.
          </p>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        
        {/* Alertes de Notification */}
        {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>}

        {/* 2. Zone de Téléversement (Upload Card) */}
        <div className="bg-white rounded-[24px] shadow-xl shadow-emerald-950/5 border border-slate-200/70 p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center font-bold border border-emerald-100">
              <FiUploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Ajouter une nouvelle ordonnance</h2>
              <p className="text-xs text-slate-500">Formats acceptés : JPG, PNG, PDF, AVIF — 5 Mo max</p>
            </div>
          </div>

          <form onSubmit={handleUpload} className="space-y-4">
            <div className="relative group border-2 border-dashed border-slate-200 hover:border-[#16A34A] rounded-2xl p-6 sm:p-8 text-center transition-all duration-200 bg-slate-50/50 hover:bg-emerald-50/30">
              <input
                type="file"
                required
                accept=".jpg,.jpeg,.png,.pdf,.avif"
                onChange={(e) => setFichier(e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />

              {fichier ? (
                <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-emerald-200 shadow-sm relative z-20 max-w-md mx-auto">
                  <div className="flex items-center gap-3 truncate">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 text-[#16A34A] flex items-center justify-center shrink-0">
                      <FiFile className="w-5 h-5" />
                    </div>
                    <div className="text-left truncate">
                      <p className="text-sm font-semibold text-slate-800 truncate">{fichier.name}</p>
                      <p className="text-xs text-slate-400">{(fichier.size / (1024 * 1024)).toFixed(2)} Mo</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFichier(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-100/60 text-[#16A34A] flex items-center justify-center mx-auto transition-transform group-hover:scale-110">
                    <FiUploadCloud className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">
                    Cliquez ou glissez-déposez votre document ici
                  </p>
                  <p className="text-xs text-slate-400">Scan clair ou photo bien lisible</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submitting || !fichier}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#16A34A] hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold text-sm transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Envoi en cours...</span>
                  </>
                ) : (
                  <>
                    <FiCheckCircle className="w-4 h-4" />
                    <span>Envoyer l'ordonnance</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* 3. Liste des Ordonnances */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <FiFileText className="text-[#16A34A]" />
            <span>Historique des ordonnances ({ordonnances.length})</span>
          </h2>

          {loading ? (
            /* Skeleton Loading */
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-[24px] p-6 border border-slate-100 animate-pulse space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="h-5 bg-slate-100 rounded-md w-1/3" />
                    <div className="h-6 bg-slate-100 rounded-full w-20" />
                  </div>
                  <div className="h-4 bg-slate-100 rounded-md w-2/3" />
                  <div className="h-4 bg-slate-100 rounded-md w-1/2" />
                </div>
              ))}
            </div>
          ) : ordonnances.length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-[24px] border border-slate-200/70 p-12 text-center shadow-sm max-w-md mx-auto">
              <div className="w-16 h-16 bg-emerald-50 text-[#16A34A] rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                <FiAlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Aucune ordonnance enregistrée
              </h3>
              <p className="text-sm text-slate-500">
                Vous n'avez envoyé aucune ordonnance pour le moment.
              </p>
            </div>
          ) : (
            /* Grid Ordonnances */
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ordonnances.map((o) => (
                <div
                  key={o.id}
                  className="bg-white rounded-[24px] p-5 border border-slate-200/60 shadow-sm hover:shadow-md hover:border-[#16A34A]/40 transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    {/* Header Carte */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-900 bg-slate-50 px-3 py-1 rounded-xl border border-slate-200/60">
                        <FiFile className="w-3.5 h-3.5 text-[#16A34A]" />
                        Ordonnance #{o.id}
                      </span>
                      <StatutBadge statut={o.statut} />
                    </div>

                    {/* Dates */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs font-medium text-slate-500">
                      <div className="flex items-center gap-2">
                        <FiClock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Envoyée le {new Date(o.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                      {o.date_prescription && (
                        <div className="flex items-center gap-2">
                          <FiCalendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Prescrite le {new Date(o.date_prescription).toLocaleDateString('fr-FR')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}