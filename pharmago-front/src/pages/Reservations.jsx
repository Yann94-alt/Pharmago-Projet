import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  FiCalendar, 
  FiClock, 
  FiPackage, 
  FiUser, 
  FiHome, 
  FiChevronRight, 
  FiAlertCircle 
} from 'react-icons/fi'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import Alert from '../components/Alert'
import StatutBadge from '../components/StatutBadge'

export default function Reservations() {
  const { isPharmacie } = useAuth()
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const { data } = await api.get('/reservations')
        setReservations(data.data || [])
      } catch (err) {
        setError('Impossible de charger les réservations.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* 1. Hero / Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-emerald-50/60 via-white to-slate-50/60 pt-12 pb-16 border-b border-emerald-100/40">
        <div className="absolute top-0 right-1/3 translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/4 left-10 w-80 h-80 bg-teal-200/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-100/80 text-emerald-800 mb-4 border border-emerald-200/60 shadow-sm">
            <FiCalendar className="w-3.5 h-3.5 text-emerald-600" />
            {isPharmacie ? 'Espace Officine' : 'Espace Patient'}
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            {isPharmacie ? (
              <>
                Réservations <span className="text-[#16A34A] bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600">reçues</span>
              </>
            ) : (
              <>
                Mes <span className="text-[#16A34A] bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600">réservations</span>
              </>
            )}
          </h1>
          <p className="mt-3 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            {isPharmacie
              ? 'Suivez, préparez et traitez les commandes et ordonnances de vos patients.'
              : 'Suivez le statut de préparation de vos commandes en officine.'}
          </p>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        
        {/* Alerte d'erreur */}
        {error && (
          <Alert type="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Etats : Loading, Empty, Liste */}
        {loading ? (
          /* Skeleton Loading */
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-[20px] p-5 border border-slate-100 shadow-sm animate-pulse flex items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="h-5 bg-slate-100 rounded-md w-1/3" />
                  <div className="h-4 bg-slate-100 rounded-md w-1/4" />
                </div>
                <div className="h-7 bg-slate-100 rounded-full w-24 shrink-0" />
              </div>
            ))}
          </div>
        ) : reservations.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-[24px] border border-slate-200/70 p-12 text-center shadow-sm max-w-md mx-auto my-8">
            <div className="w-16 h-16 bg-emerald-50 text-[#16A34A] rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
              <FiAlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Aucune réservation pour le moment.
            </h3>
            <p className="text-sm text-slate-500">
              {isPharmacie
                ? 'Les réservations envoyées par les patients apparaîtront ici.'
                : 'Effectuez une réservation depuis le catalogue de médicaments.'}
            </p>
          </div>
        ) : (
          /* Liste des Réservations */
          <div className="space-y-3.5">
            {reservations.map((r) => (
              <Link
                key={r.id}
                to={`/reservations/${r.id}`}
                className="group bg-white rounded-[20px] p-5 border border-slate-200/70 shadow-sm hover:border-[#16A34A]/50 hover:shadow-xl hover:shadow-emerald-950/5 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  {/* Icone d'en-tête */}
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#16A34A] flex items-center justify-center font-bold border border-emerald-100 shrink-0 group-hover:bg-[#16A34A] group-hover:text-white transition-colors duration-200">
                    <FiCalendar className="w-5 h-5" />
                  </div>

                  {/* Détails Réservation */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-bold text-slate-900">
                        Réservation #{r.id}
                      </span>
                      
                      {/* Entité associée (Patient ou Pharmacie) */}
                      {isPharmacie && r.user && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg border border-slate-200/60">
                          <FiUser className="w-3 h-3 text-slate-500" />
                          {r.user.prenom} {r.user.nom}
                        </span>
                      )}

                      {!isPharmacie && r.pharmacie && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg border border-slate-200/60">
                          <FiHome className="w-3 h-3 text-[#16A34A]" />
                          {r.pharmacie.nom}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs font-medium text-slate-500 flex-wrap">
                      <span className="inline-flex items-center gap-1.5">
                        <FiPackage className="w-3.5 h-3.5 text-slate-400" />
                        {r.medicaments?.length || 0} médicament(s)
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="inline-flex items-center gap-1.5">
                        <FiClock className="w-3.5 h-3.5 text-slate-400" />
                        Créée le {new Date(r.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Statut et Action Indicator */}
                <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
                  <StatutBadge statut={r.statut} />
                  <div className="w-8 h-8 rounded-xl bg-slate-50 group-hover:bg-emerald-50 text-slate-400 group-hover:text-[#16A34A] flex items-center justify-center transition-colors">
                    <FiChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}