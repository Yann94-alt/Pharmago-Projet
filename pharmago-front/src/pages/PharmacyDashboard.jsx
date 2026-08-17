import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { getErrorMessage } from '../api/errors'
import { useAuth } from '../context/AuthContext'
import Loader from '../components/Loader'
import Alert from '../components/Alert'
import {
  FiGrid,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiTrendingUp,
  FiRefreshCw,
  FiEye,
  FiCheck,
  FiUser
} from 'react-icons/fi'

export default function PharmacyDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const [reservations, setReservations] = useState([])

  const [stats, setStats] = useState({
    enAttente: 0,
    enCours: 0,
    terminees: 0,
    chiffreAffaires: 0
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  /*
  |--------------------------------------------------------------------------
  | Récupérer les réservations
  |--------------------------------------------------------------------------
  */

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await api.get('/pharmacies/reservations')

      const data = response.data.data || response.data

      console.log('🔥 RÉSERVATIONS PHARMACIE :', data)

      setReservations(data)

      calculateStats(data)

    } catch (err) {
      console.error('Erreur dashboard :', err)
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Calcul des statistiques
  |--------------------------------------------------------------------------
  */

  const calculateStats = (data) => {

    let enAttente = 0
    let enCours = 0
    let terminees = 0
    let chiffreAffaires = 0

    data.forEach((reservation) => {

      const statut = reservation.statut

      /*
      |--------------------------------------------------------------------------
      | À ANALYSER
      |--------------------------------------------------------------------------
      */

      if (
        statut === 'verification' ||
        statut === 'en_attente' ||
        statut === 'attente_analyse'
      ) {
        enAttente++
      }

      /*
      |--------------------------------------------------------------------------
      | EN COURS
      |--------------------------------------------------------------------------
      */

      if (
        statut === 'proposition' ||
        statut === 'attente_identite' ||
        statut === 'confirmee' ||
        statut === 'prete'
      ) {
        enCours++
      }

      /*
      |--------------------------------------------------------------------------
      | TERMINÉES
      |--------------------------------------------------------------------------
      */

      if (statut === 'remise') {
        terminees++

        chiffreAffaires += Number(
          reservation.montant_total || 0
        )
      }

    })

    setStats({
      enAttente,
      enCours,
      terminees,
      chiffreAffaires
    })

  }

  /*
  |--------------------------------------------------------------------------
  | Changer le statut
  |--------------------------------------------------------------------------
  */

  const handleUpdateStatus = async (id, newStatut) => {

    try {

      setError(null)

      await api.put(
        `/pharmacies/reservations/${id}/statut`,
        {
          statut: newStatut
        }
      )

      setSuccess(
        `Statut mis à jour : ${newStatut}`
      )

      await fetchDashboardData()

    } catch (err) {

      console.error(err)

      setError(
        getErrorMessage(err)
      )

    }

  }

  /*
  |--------------------------------------------------------------------------
  | Nom du patient
  |--------------------------------------------------------------------------
  */

  const getPatientName = (reservation) => {

    const patient = reservation.user

    if (!patient) {
      return 'Patient inconnu'
    }

    const nom = patient.nom || ''
    const prenom = patient.prenom || ''

    const fullName = `${prenom} ${nom}`.trim()

    return fullName || 'Patient inconnu'
  }

  /*
  |--------------------------------------------------------------------------
  | Chargement
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return <Loader />
  }

  return (

    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto font-sans">

      {/* HEADER */}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100 gap-4">

        <div className="flex items-center gap-4">

          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
            <FiGrid className="w-7 h-7" />
          </div>

          <div>

            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Tableau de bord Pharmacie
            </h1>

            <p className="text-sm font-medium text-slate-500 mt-0.5">

              Ravi de vous revoir,{' '}

              <span className="text-slate-800 font-bold">

                {user?.nom
                  ? `${user.prenom || ''} ${user.nom}`.trim()
                  : 'Pharmacien'}

              </span>

              {' '}👋

            </p>

          </div>

        </div>

        <button
          onClick={fetchDashboardData}
          className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-50 text-emerald-700 rounded-2xl hover:bg-emerald-100 transition-all font-bold text-sm shadow-sm active:scale-95"
        >

          <FiRefreshCw className="w-4 h-4" />

          Rafraîchir les données

        </button>

      </div>

      {/* ALERTES */}

      {error && (
        <Alert
          type="error"
          message={error}
        />
      )}

      {success && (
        <Alert
          type="success"
          message={success}
          onClose={() => setSuccess(null)}
        />
      )}

      {/* STATISTIQUES */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

        {/* À ANALYSER */}

        <StatCard
          icon={<FiClock />}
          color="amber"
          title="À analyser"
          value={stats.enAttente}
        />

        {/* EN COURS */}

        <StatCard
          icon={<FiCalendar />}
          color="sky"
          title="En cours"
          value={stats.enCours}
        />

        {/* REMISES */}

        <StatCard
          icon={<FiCheckCircle />}
          color="emerald"
          title="Remises"
          value={stats.terminees}
        />

        {/* CA */}

        <StatCard
          icon={<FiTrendingUp />}
          color="purple"
          title="Chiffre d'affaires"
          value={`${stats.chiffreAffaires.toLocaleString('fr-FR')} FCFA`}
        />

      </div>

      {/* RESERVATIONS */}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">

        <div className="p-6 sm:p-8 border-b border-slate-100">

          <h2 className="text-xl font-black text-slate-900">
            Gestion des Réservations
          </h2>

          <p className="text-sm text-slate-500 mt-0.5">
            Suivez et traitez les ordonnances de vos patients en temps réel
          </p>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full text-left border-collapse">

            <thead>

              <tr className="bg-slate-50/75 text-xs font-extrabold text-slate-400 uppercase tracking-wider">

                <th className="p-5">
                  ID
                </th>

                <th className="p-5">
                  Patient
                </th>

                <th className="p-5">
                  Date
                </th>

                <th className="p-5">
                  Statut
                </th>

                <th className="p-5">
                  Montant Total
                </th>

                <th className="p-5 text-right">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-slate-100 text-sm">

              {reservations.length === 0 ? (

                <tr>

                  <td
                    colSpan="6"
                    className="p-12 text-center text-slate-400 font-medium"
                  >
                    Aucune réservation trouvée pour le moment.
                  </td>

                </tr>

              ) : (

                reservations.map((res) => (

                  <tr
                    key={res.id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >

                    {/* ID */}

                    <td className="p-5 font-black text-slate-900">
                      #{res.id}
                    </td>

                    {/* PATIENT */}

                    <td className="p-5">

                      <div className="flex items-center gap-2.5">

                        <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">

                          <FiUser className="w-4 h-4" />

                        </div>

                        <div>

                          <p className="font-bold text-slate-700">

                            {getPatientName(res)}

                          </p>

                          {res.user?.telephone && (

                            <p className="text-xs text-slate-400">

                              {res.user.telephone}

                            </p>

                          )}

                        </div>

                      </div>

                    </td>

                    {/* DATE */}

                    <td className="p-5 font-medium text-slate-500">

                      {res.created_at
                        ? new Date(
                            res.created_at
                          ).toLocaleDateString('fr-FR')
                        : '-'}

                    </td>

                    {/* STATUT */}

                    <td className="p-5">

                      <StatusBadge
                        statut={res.statut}
                      />

                    </td>

                    {/* MONTANT */}

                    <td className="p-5 font-black text-slate-900">

                      {res.montant_total
                        ? `${Number(res.montant_total).toLocaleString('fr-FR')} FCFA`
                        : '-'}

                    </td>

                    {/* ACTIONS */}

                    <td className="p-5">

                      <div className="flex items-center justify-end gap-2">

                        {/* ANALYSER */}

                        {(res.statut === 'verification' ||
                          res.statut === 'en_attente' ||
                          res.statut === 'attente_analyse') && (

                          <button
                            onClick={() =>
                              navigate(
                                `/TraitementReservation/${res.id}`
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all text-xs font-bold shadow-md shadow-emerald-600/20"
                          >

                            <FiEye className="w-3.5 h-3.5" />

                            Analyser

                          </button>

                        )}

                        {/* VOIR */}

                        {res.statut !== 'verification' &&
                          res.statut !== 'en_attente' &&
                          res.statut !== 'attente_analyse' && (

                          <button
                            onClick={() =>
                              navigate(
                                `/TraitementReservation/${res.id}`
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all text-xs font-bold"
                          >

                            <FiEye className="w-3.5 h-3.5" />

                            Voir

                          </button>

                        )}

                        {/* PRÊTE */}

                        {res.statut === 'confirmee' && (

                          <button
                            onClick={() =>
                              handleUpdateStatus(
                                res.id,
                                'prete'
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition-all text-xs font-bold"
                          >

                            <FiCheck className="w-3.5 h-3.5" />

                            Prête

                          </button>

                        )}

                        {/* REMISE */}

                        {res.statut === 'prete' && (

                          <button
                            onClick={() =>
                              handleUpdateStatus(
                                res.id,
                                'remise'
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 text-white rounded-xl hover:bg-emerald-800 transition-all text-xs font-bold"
                          >

                            <FiCheck className="w-3.5 h-3.5" />

                            Remise

                          </button>

                        )}

                      </div>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  )
}

/*
|--------------------------------------------------------------------------
| Carte statistique
|--------------------------------------------------------------------------
*/

function StatCard({
  icon,
  color,
  title,
  value
}) {

  const colors = {

    amber: 'bg-amber-50 text-amber-600',

    sky: 'bg-sky-50 text-sky-600',

    emerald: 'bg-emerald-50 text-emerald-600',

    purple: 'bg-purple-50 text-purple-600'

  }

  return (

    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">

      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${colors[color]}`}
      >

        {icon}

      </div>

      <div>

        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">

          {title}

        </p>

        <p className="text-2xl font-black text-slate-900 mt-1">

          {value}

        </p>

      </div>

    </div>

  )
}

/*
|--------------------------------------------------------------------------
| Badge statut
|--------------------------------------------------------------------------
*/

function StatusBadge({ statut }) {

  const config = {

    verification: {
      label: 'À analyser',
      className: 'bg-amber-100 text-amber-800'
    },

    en_attente: {
      label: 'En attente',
      className: 'bg-amber-100 text-amber-800'
    },

    attente_analyse: {
      label: 'À analyser',
      className: 'bg-amber-100 text-amber-800'
    },

    proposition: {
      label: 'Proposition',
      className: 'bg-orange-100 text-orange-800'
    },

    attente_identite: {
      label: 'Attente identité',
      className: 'bg-indigo-100 text-indigo-800'
    },

    confirmee: {
      label: 'Confirmée',
      className: 'bg-blue-100 text-blue-800'
    },

    prete: {
      label: 'Prête',
      className: 'bg-sky-100 text-sky-800'
    },

    remise: {
      label: 'Remise',
      className: 'bg-emerald-100 text-emerald-800'
    }

  }

  const current = config[statut] || {
    label: statut || 'Inconnu',
    className: 'bg-slate-100 text-slate-600'
  }

  return (

    <span
      className={`inline-flex px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase ${current.className}`}
    >

      {current.label}

    </span>

  )
}