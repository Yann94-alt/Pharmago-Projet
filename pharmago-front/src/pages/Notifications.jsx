import { useEffect, useState } from 'react'
import { 
  FiBell, 
  FiPackage, 
  FiFileText, 
  FiMaximize, 
  FiCheckCircle, 
  FiClock, 
  FiCheck, 
  FiAlertCircle 
} from 'react-icons/fi'
import api from '../api/axios'
import Alert from '../components/Alert'

const getIconForType = (type) => {
  switch (type) {
    case 'reservation':
      return <FiPackage className="w-5 h-5 text-emerald-600" />
    case 'facture':
      return <FiFileText className="w-5 h-5 text-teal-600" />
    case 'qr_code':
      return <FiMaximize className="w-5 h-5 text-indigo-600" />
    case 'systeme':
    default:
      return <FiBell className="w-5 h-5 text-[#16A34A]" />
  }
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchNotifications = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/notifications')
      setNotifications(data)
    } catch (err) {
      setError('Impossible de charger vos notifications.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const marquerLue = async (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, lu: true } : n)))
    try {
      await api.put(`/notifications/${id}/lu`)
    } catch (err) {
      fetchNotifications()
    }
  }

  const marquerToutLu = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })))
    try {
      await api.put('/notifications/lire-tout')
    } catch (err) {
      fetchNotifications()
    }
  }

  const nbNonLues = notifications.filter((n) => !n.lu).length

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* 1. Hero / Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-emerald-50/60 via-white to-slate-50/60 pt-12 pb-16 border-b border-emerald-100/40">
        <div className="absolute top-0 right-1/4 translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-10 w-80 h-80 bg-teal-200/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-100/80 text-emerald-800 mb-4 border border-emerald-200/60 shadow-sm">
                <FiBell className="w-3.5 h-3.5 text-emerald-600" />
                Centre de notifications
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Vos <span className="text-[#16A34A] bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600">notifications</span>
              </h1>
              <p className="mt-2 text-base text-slate-600">
                {nbNonLues > 0
                  ? `Vous avez ${nbNonLues} notification(s) non lue(s)`
                  : 'Vous êtes entièrement à jour !'}
              </p>
            </div>

            {nbNonLues > 0 && (
              <button
                onClick={marquerToutLu}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-emerald-50 hover:text-[#16A34A] hover:border-emerald-200 active:scale-[0.98] font-semibold text-sm transition-all shadow-sm"
              >
                <FiCheck className="w-4 h-4 text-[#16A34A]" />
                <span>Tout marquer comme lu</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        
        {/* Alert Erreur */}
        {error && (
          <Alert type="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Etats : Loading, Empty, Liste */}
        {loading ? (
          /* Skeleton Loading */
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-[20px] p-5 border border-slate-100 shadow-sm animate-pulse flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-2xl bg-slate-100 shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-100 rounded-md w-1/3" />
                  <div className="h-3 bg-slate-100 rounded-md w-2/3" />
                  <div className="h-3 bg-slate-100 rounded-md w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-[24px] border border-slate-200/70 p-12 text-center shadow-sm max-w-md mx-auto my-8">
            <div className="w-16 h-16 bg-emerald-50 text-[#16A34A] rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
              <FiCheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Aucune notification
            </h3>
            <p className="text-sm text-slate-500">
              Vous n'avez aucune notification pour le moment.
            </p>
          </div>
        ) : (
          /* Liste des Notifications */
          <div className="space-y-3">
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => !n.lu && marquerLue(n.id)}
                className={`w-full text-left rounded-[20px] p-5 transition-all duration-200 border flex items-start gap-4 shadow-sm ${
                  !n.lu
                    ? 'bg-white border-[#16A34A]/40 ring-1 ring-[#16A34A]/20 hover:border-[#16A34A]'
                    : 'bg-slate-50/50 border-slate-200/60 opacity-80 hover:bg-white hover:opacity-100'
                }`}
              >
                {/* Icône par type */}
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border transition-colors ${
                    !n.lu
                      ? 'bg-emerald-50 border-emerald-100'
                      : 'bg-slate-100 border-slate-200/60'
                  }`}
                >
                  {getIconForType(n.type)}
                </div>

                {/* Contenu */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 truncate">
                      <p
                        className={`text-sm font-bold truncate ${
                          !n.lu ? 'text-slate-900' : 'text-slate-700'
                        }`}
                      >
                        {n.titre}
                      </p>
                      {!n.lu && (
                        <span className="h-2 w-2 rounded-full bg-[#16A34A] shrink-0" />
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed mb-2">
                    {n.message}
                  </p>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                    <FiClock className="w-3.5 h-3.5" />
                    <span>{new Date(n.created_at).toLocaleString('fr-FR')}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}