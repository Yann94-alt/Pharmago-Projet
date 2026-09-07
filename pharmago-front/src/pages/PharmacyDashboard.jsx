import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { getErrorMessage } from '../api/errors'
import { useAuth } from '../context/AuthContext'
import Loader from '../components/Loader'
import Alert from '../components/Alert'
import echo from '../echo'

import {
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiEye,
  FiCheck,
  FiUser,
  FiAward,
  FiWifi,
  FiWifiOff,
  FiRefreshCw,
  FiArrowRight,
} from 'react-icons/fi'

export default function PharmacyDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false)
  const [reservations, setReservations] = useState([])

  const [stats, setStats] = useState({
    enAttente: 0,
    enCours: 0,
    terminees: 0,
    tauxTraitement: 0,
  })

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const monthName = now.toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  useEffect(() => {
    if (!user?.id || !echo) return

    const channel = echo.private(`notifications.${user.id}`)
    setIsRealtimeConnected(true)

    channel.listen('.notification.created', (event) => {
      if (!event?.notification) return

      let data = event.notification.data
      try {
        if (typeof data === 'string') {
          data = JSON.parse(data)
        }
      } catch (err) {
        console.warn('Impossible de lire les données de notification :', err)
        data = null
      }

      if (!data?.reservation_id) return

      fetchDashboardData(true)
      setSuccess('Nouvelle réservation reçue.')
    })

    return () => {
      setIsRealtimeConnected(false)
      echo.leave(`notifications.${user.id}`)
    }
  }, [user?.id])

  const fetchDashboardData = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      setError(null)

      const response = await api.get('/pharmacies/reservations', {
        params: { annee: currentYear, mois: currentMonth },
      })

      const data = response?.data?.data || response?.data || []

      const monthlyReservations = Array.isArray(data)
        ? data.filter((reservation) => {
            if (!reservation?.created_at) return false
            const date = new Date(reservation.created_at)
            return (
              date.getFullYear() === currentYear &&
              date.getMonth() + 1 === currentMonth
            )
          })
        : []

      setReservations(monthlyReservations)
      calculateStats(monthlyReservations)
    } catch (err) {
      setError(getErrorMessage(err, 'Impossible de récupérer les réservations.'))
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const calculateStats = (data) => {
    let enAttente = 0
    let enCours = 0
    let terminees = 0
    let totalTraite = 0

    data.forEach((reservation) => {
      const statut = reservation?.statut

      if (statut === 'en_attente') enAttente++
      if (statut === 'acceptee' || statut === 'confirmee') enCours++
      if (statut === 'prete') {
        terminees++
        totalTraite++
      }
    })

    const totalReservations = data.length
    const tauxTraitement =
      totalReservations > 0 ? Math.round((totalTraite / totalReservations) * 100) : 0

    setStats({ enAttente, enCours, terminees, tauxTraitement })
  }

  const handleUpdateStatus = async (id, newStatut) => {
    try {
      setError(null)
      setSuccess(null)

      await api.put(`/pharmacies/reservations/${id}/statut`, { statut: newStatut })

      if (newStatut === 'prete') {
        setSuccess('La réservation est maintenant prête. Le patient a été notifié.')
      } else {
        setSuccess(`Statut mis à jour : ${newStatut}`)
      }

      await fetchDashboardData(true)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const getPatientName = (reservation) => {
    const patient = reservation?.user
    if (!patient) return 'Patient inconnu'

    const fullName = `${patient?.prenom || ''} ${patient?.nom || ''}`.trim()
    return fullName || 'Patient inconnu'
  }

  const formatDate = (date) => {
    if (!date) return '-'
    const parsedDate = new Date(date)
    if (Number.isNaN(parsedDate.getTime())) return '-'

    return parsedDate.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  if (loading) return <Loader />

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="w-full max-w-7xl mx-auto px-3 sm:px-5 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="space-y-5 sm:space-y-6 lg:space-y-8">
          
          {/* HEADER */}
          <section className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="hidden sm:flex w-11 h-11 lg:w-12 lg:h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 items-center justify-center shrink-0">
                      <FiCalendar className="w-5 h-5 lg:w-6 lg:h-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-emerald-600 mb-1">
                        Espace professionnel
                      </p>
                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                        Tableau de bord
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Ravi de vous revoir,{' '}
                        <span className="font-bold text-slate-800">
                          {user?.nom ? `${user?.prenom || ''} ${user?.nom}`.trim() : 'Pharmacien'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* CONNEXION TEMPS RÉEL */}
                <div className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-100 rounded-2xl px-3.5 py-3 sm:px-4">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isRealtimeConnected ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                      {isRealtimeConnected ? <FiWifi className="w-4 h-4" /> : <FiWifiOff className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">Temps réel</p>
                      <p className="text-[11px] text-slate-400">
                        {isRealtimeConnected ? 'Connecté' : 'Déconnecté'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => fetchDashboardData()}
                    className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 flex items-center justify-center transition"
                    title="Actualiser"
                  >
                    <FiRefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* PÉRIODE */}
          <section className="bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 text-white shadow-lg shadow-emerald-600/10">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                <FiCalendar className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-emerald-100">
                  Période actuelle
                </p>
                <p className="text-sm sm:text-base lg:text-lg font-black capitalize truncate">
                  Réservations de {monthName}
                </p>
              </div>
            </div>
          </section>

          {/* ALERTES */}
          {error && <Alert type="error" message={error} />}
          {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

          {/* STATISTIQUES */}
          <section>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
              <StatCard icon={<FiClock />} color="amber" title="À analyser" value={stats.enAttente} />
              <StatCard icon={<FiCalendar />} color="sky" title="En cours" value={stats.enCours} />
              <StatCard icon={<FiCheckCircle />} color="emerald" title="Prêtes" value={stats.terminees} />
              <StatCard icon={<FiAward />} color="purple" title="Taux de traitement" value={`${stats.tauxTraitement}%`} />
            </div>
          </section>

          {/* RÉSERVATIONS */}
          <section className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 lg:p-8 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-slate-900">
                    Gestion des réservations
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Suivez et traitez les réservations du mois.
                  </p>
                </div>
                <div className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">Total</span>
                  <span className="font-black text-slate-900">{reservations.length}</span>
                </div>
              </div>
            </div>

            {/* MOBILE : CARTES */}
            <div className="block lg:hidden p-3 sm:p-5">
              {reservations.length === 0 ? (
                <EmptyReservations />
              ) : (
                <div className="space-y-3">
                  {reservations.map((res) => (
                    <ReservationCard
                      key={res.id}
                      reservation={res}
                      navigate={navigate}
                      getPatientName={getPatientName}
                      formatDate={formatDate}
                      handleUpdateStatus={handleUpdateStatus}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* DESKTOP : TABLEAU */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-4">Patient</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Statut</th>
                    <th className="px-6 py-4">Montant</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reservations.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-14 text-center">
                        <EmptyReservations />
                      </td>
                    </tr>
                  ) : (
                    reservations.map((res) => (
                      <tr key={res.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                              <FiUser className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-700 truncate max-w-[190px]">
                                {getPatientName(res)}
                              </p>
                              {res?.user?.telephone && (
                                <p className="text-xs text-slate-400 mt-0.5">{res.user.telephone}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-sm font-medium text-slate-500">{formatDate(res?.created_at)}</span>
                        </td>
                        <td className="px-6 py-5">
                          <StatusBadge statut={res?.statut} />
                        </td>
                        <td className="px-6 py-5">
                          <span className="font-black text-slate-900 whitespace-nowrap">
                            {res?.montant_total != null
                              ? `${Number(res.montant_total).toLocaleString('fr-FR')} FCFA`
                              : '-'}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <ReservationActions
                            reservation={res}
                            navigate={navigate}
                            handleUpdateStatus={handleUpdateStatus}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

function ReservationCard({ reservation, navigate, getPatientName, formatDate, handleUpdateStatus }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <FiUser className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-800 truncate">{getPatientName(reservation)}</p>
            {reservation?.user?.telephone && (
              <p className="text-xs text-slate-400 mt-0.5">{reservation.user.telephone}</p>
            )}
          </div>
        </div>
        <StatusBadge statut={reservation?.statut} />
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="bg-slate-50 rounded-xl p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Date</p>
          <p className="text-xs sm:text-sm font-bold text-slate-700 mt-1">{formatDate(reservation?.created_at)}</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Montant</p>
          <p className="text-xs sm:text-sm font-black text-slate-900 mt-1">
            {reservation?.montant_total != null
              ? `${Number(reservation.montant_total).toLocaleString('fr-FR')} FCFA`
              : '-'}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100">
        <ReservationActions
          reservation={reservation}
          navigate={navigate}
          handleUpdateStatus={handleUpdateStatus}
          mobile
        />
      </div>
    </div>
  )
}

function ReservationActions({ reservation, navigate, handleUpdateStatus, mobile = false }) {
  return (
    <div className={`flex ${mobile ? 'flex-col' : 'items-center justify-end'} gap-2`}>
      <button
        type="button"
        onClick={() => navigate(`/TraitementReservation/${reservation.id}`)}
        className={`inline-flex items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all ${
          mobile ? 'w-full px-4 py-2.5' : 'px-3.5 py-2'
        } ${
          reservation?.statut === 'en_attente'
            ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
        }`}
      >
        <FiEye className="w-3.5 h-3.5" />
        {reservation?.statut === 'en_attente' ? 'Analyser' : 'Voir'}
        <FiArrowRight className="w-3.5 h-3.5 ml-auto" />
      </button>

      {reservation?.statut === 'confirmee' && (
        <button
          type="button"
          onClick={() => handleUpdateStatus(reservation.id, 'prete')}
          className={`inline-flex items-center justify-center gap-1.5 rounded-xl bg-sky-600 text-white hover:bg-sky-700 transition-all text-xs font-bold shadow-sm shadow-sky-600/20 ${
            mobile ? 'w-full px-4 py-2.5' : 'px-3.5 py-2'
          }`}
        >
          <FiCheck className="w-3.5 h-3.5" />
          Marquer prête
        </button>
      )}

      {reservation?.statut === 'prete' && (
        <span className={`inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold ${
          mobile ? 'w-full px-4 py-2.5' : 'px-3.5 py-2'
        }`}>
          <FiCheckCircle className="w-3.5 h-3.5" />
          Commande prête
        </span>
      )}

      {reservation?.statut === 'annulee' && (
        <span className={`inline-flex items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold ${
          mobile ? 'w-full px-4 py-2.5' : 'px-3.5 py-2'
        }`}>
          Annulée
        </span>
      )}
    </div>
  )
}

function StatCard({ icon, color, title, value }) {
  const colors = {
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    sky: 'bg-sky-50 text-sky-600 border-sky-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  }

  return (
    <div className="bg-white p-3.5 sm:p-5 lg:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl border flex items-center justify-center shrink-0 ${colors[color]}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[9px] sm:text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">
            {title}
          </p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 mt-0.5 sm:mt-1">
            {value}
          </p>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ statut }) {
  const config = {
    en_attente: { label: 'À analyser', className: 'bg-amber-100 text-amber-800 border-amber-200' },
    acceptee: { label: 'Proposition disponible', className: 'bg-orange-100 text-orange-800 border-orange-200' },
    confirmee: { label: 'Réservation confirmée', className: 'bg-blue-100 text-blue-800 border-blue-200' },
    prete: { label: 'Prête', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    annulee: { label: 'Annulée', className: 'bg-rose-100 text-rose-800 border-rose-200' },
  }

  const current = config[statut] || {
    label: statut || 'Inconnu',
    className: 'bg-slate-100 text-slate-600 border-slate-200',
  }

  return (
    <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-black tracking-wide uppercase border whitespace-nowrap ${current.className}`}>
      {current.label}
    </span>
  )
}

function EmptyReservations() {
  return (
    <div className="flex flex-col items-center justify-center py-8 sm:py-10">
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center mb-4">
        <FiCalendar className="w-6 h-6 sm:w-7 sm:h-7" />
      </div>
      <p className="font-bold text-slate-600 text-sm sm:text-base text-center">
        Aucune réservation ce mois-ci
      </p>
      <p className="text-xs sm:text-sm text-slate-400 mt-1 text-center max-w-sm">
        Les nouvelles réservations apparaîtront automatiquement ici.
      </p>
    </div>
  )
}