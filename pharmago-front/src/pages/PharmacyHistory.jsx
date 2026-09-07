import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { getErrorMessage } from '../api/errors'
import Loader from '../components/Loader'
import Alert from '../components/Alert'

import {
  FiArchive,
  FiCalendar,
  FiFilter,
  FiRefreshCw,
  FiEye,
  FiUser,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi'

export default function PharmacyHistory() {
  const navigate = useNavigate()

  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  /*
  |--------------------------------------------------------------------------
  | ANNÉE
  |--------------------------------------------------------------------------
  | L'utilisateur peut saisir n'importe quelle année :
  | 2026, 2027, 2028, etc.
  |--------------------------------------------------------------------------
  */

  const [annee, setAnnee] = useState(
    String(new Date().getFullYear())
  )

  const [mois, setMois] = useState('')

  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  })

  /*
  |--------------------------------------------------------------------------
  | CHARGEMENT
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    fetchHistorique()
  }, [annee, mois])

  /*
  |--------------------------------------------------------------------------
  | RÉCUPÉRER L'HISTORIQUE
  |--------------------------------------------------------------------------
  */

  const fetchHistorique = async (page = 1) => {
    try {
      setLoading(true)
      setError(null)

      const params = {
        page,
      }

      /*
      |----------------------------------------------------------------------
      | Ajouter l'année seulement si elle est renseignée
      |----------------------------------------------------------------------
      */

      if (
        annee !== '' &&
        annee !== null &&
        annee !== undefined
      ) {
        params.annee = annee
      }

      /*
      |----------------------------------------------------------------------
      | Ajouter le mois seulement s'il est renseigné
      |----------------------------------------------------------------------
      */

      if (mois !== '') {
        params.mois = mois
      }

      const response = await api.get(
        '/pharmacie/historique-reservations',
        {
          params,
        }
      )

      const result = response?.data?.data

      setReservations(
        result?.data || []
      )

      setPagination({
        current_page:
          result?.current_page || 1,

        last_page:
          result?.last_page || 1,

        total:
          result?.total || 0,
      })

    } catch (err) {
      console.error(
        'Erreur historique :',
        err
      )

      /*
      |----------------------------------------------------------------------
      | Afficher l'erreur Laravel si disponible
      |----------------------------------------------------------------------
      */

      const message =
        err?.response?.data?.message ||
        getErrorMessage(
          err,
          "Impossible de récupérer l'historique."
        )

      setError(message)

      setReservations([])

      setPagination({
        current_page: 1,
        last_page: 1,
        total: 0,
      })

    } finally {
      setLoading(false)
    }
  }

  /*
  |--------------------------------------------------------------------------
  | NOM DU PATIENT
  |--------------------------------------------------------------------------
  */

  const getPatientName = (reservation) => {
    const patient = reservation?.user

    if (!patient) {
      return 'Patient inconnu'
    }

    const nom = patient?.nom || ''
    const prenom = patient?.prenom || ''

    return (
      `${prenom} ${nom}`.trim() ||
      'Patient inconnu'
    )
  }

  /*
  |--------------------------------------------------------------------------
  | FORMAT DATE
  |--------------------------------------------------------------------------
  */

  const formatDate = (date) => {
    if (!date) {
      return '-'
    }

    const parsedDate = new Date(date)

    if (Number.isNaN(parsedDate.getTime())) {
      return '-'
    }

    return parsedDate.toLocaleDateString(
      'fr-FR',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }
    )
  }

  /*
  |--------------------------------------------------------------------------
  | FORMAT MONTANT
  |--------------------------------------------------------------------------
  */

  const formatAmount = (amount) => {
    if (
      amount === null ||
      amount === undefined ||
      amount === ''
    ) {
      return '-'
    }

    return `${Number(amount).toLocaleString(
      'fr-FR'
    )} FCFA`
  }

  /*
  |--------------------------------------------------------------------------
  | PAGINATION
  |--------------------------------------------------------------------------
  */

  const handlePreviousPage = () => {
    if (
      pagination.current_page > 1
    ) {
      fetchHistorique(
        pagination.current_page - 1
      )
    }
  }

  const handleNextPage = () => {
    if (
      pagination.current_page <
      pagination.last_page
    ) {
      fetchHistorique(
        pagination.current_page + 1
      )
    }
  }

  /*
  |--------------------------------------------------------------------------
  | ANNÉE MODIFIÉE
  |--------------------------------------------------------------------------
  */

  const handleYearChange = (e) => {
    const value = e.target.value

    /*
    |----------------------------------------------------------------------
    | Autoriser uniquement les chiffres
    |----------------------------------------------------------------------
    */

    if (
      value === '' ||
      /^\d{0,4}$/.test(value)
    ) {
      setAnnee(value)
    }
  }

  /*
  |--------------------------------------------------------------------------
  | MOIS MODIFIÉ
  |--------------------------------------------------------------------------
  */

  const handleMonthChange = (e) => {
    setMois(e.target.value)
  }

  /*
  |--------------------------------------------------------------------------
  | RESET FILTRES
  |--------------------------------------------------------------------------
  */

  const resetFilters = () => {
    setAnnee('')
    setMois('')
  }

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (
    loading &&
    reservations.length === 0
  ) {
    return <Loader />
  }

  /*
  |--------------------------------------------------------------------------
  | PAGE
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto font-sans">

      {/* =========================================================
          HEADER
      ========================================================= */}

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 mb-6">

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

          <div className="flex items-center gap-4">

            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">

              <FiArchive className="w-7 h-7" />

            </div>

            <div>

              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Historique des réservations
              </h1>

              <p className="text-sm text-slate-500 mt-1">
                Consultez les réservations passées de votre pharmacie.
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={() => fetchHistorique()}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-50 text-emerald-700 rounded-2xl hover:bg-emerald-100 transition-all font-bold text-sm active:scale-95"
          >

            <FiRefreshCw
              className={`w-4 h-4 ${
                loading
                  ? 'animate-spin'
                  : ''
              }`}
            />

            Actualiser

          </button>

        </div>

      </div>

      {/* =========================================================
          ERREUR
      ========================================================= */}

      {error && (
        <div className="mb-6">

          <Alert
            type="error"
            message={error}
            onClose={() => setError(null)}
          />

        </div>
      )}

      {/* =========================================================
          FILTRES
      ========================================================= */}

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 mb-6">

        <div className="flex items-center gap-2 mb-5">

          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">

            <FiFilter className="w-4 h-4" />

          </div>

          <div>

            <h2 className="font-black text-slate-900">
              Filtrer l'historique
            </h2>

            <p className="text-xs text-slate-400">
              Sélectionnez ou saisissez une période
            </p>

          </div>

        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          {/* =====================================================
              ANNÉE
          ===================================================== */}

          <div>

            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Année
            </label>

            <div className="relative">

              <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />

              <input
                type="number"
                value={annee}
                onChange={handleYearChange}
                placeholder="Ex : 2027"
                min="2000"
                max="2100"
                className="w-full h-12 pl-11 pr-4 rounded-2xl border-2 border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />

            </div>

            <p className="text-xs text-slate-400 mt-2">
              Exemple : 2027
            </p>

          </div>

          {/* =====================================================
              MOIS
          ===================================================== */}

          <div>

            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Mois
            </label>

            <select
              value={mois}
              onChange={handleMonthChange}
              className="w-full h-12 px-4 rounded-2xl border-2 border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition-all"
            >

              <option value="">
                Tous les mois
              </option>

              <option value="1">
                Janvier
              </option>

              <option value="2">
                Février
              </option>

              <option value="3">
                Mars
              </option>

              <option value="4">
                Avril
              </option>

              <option value="5">
                Mai
              </option>

              <option value="6">
                Juin
              </option>

              <option value="7">
                Juillet
              </option>

              <option value="8">
                Août
              </option>

              <option value="9">
                Septembre
              </option>

              <option value="10">
                Octobre
              </option>

              <option value="11">
                Novembre
              </option>

              <option value="12">
                Décembre
              </option>

            </select>

          </div>

          {/* =====================================================
              RÉSULTATS
          ===================================================== */}

          <div className="flex items-end gap-2">

            <div className="flex-1 h-12 rounded-2xl bg-slate-50 border-2 border-slate-100 flex items-center px-4">

              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Résultats
              </span>

              <span className="ml-auto text-lg font-black text-slate-900">
                {pagination.total}
              </span>

            </div>

            <button
              type="button"
              onClick={resetFilters}
              className="h-12 px-4 rounded-2xl bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-bold transition-all"
            >
              Réinitialiser
            </button>

          </div>

        </div>

      </div>

      {/* =========================================================
          TABLEAU
      ========================================================= */}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">

        <div className="p-6 border-b border-slate-100">

          <h2 className="text-lg font-black text-slate-900">
            Réservations
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Liste des réservations correspondant aux filtres.
          </p>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full text-left">

            <thead>

              <tr className="bg-slate-50 text-xs font-extrabold text-slate-400 uppercase tracking-wider">

                <th className="p-5">
                  ID
                </th>

                <th className="p-5">
                  Patient
                </th>

                <th className="p-5">
                  Date de création
                </th>

                <th className="p-5">
                  Statut
                </th>

                <th className="p-5">
                  Montant
                </th>

                <th className="p-5 text-right">
                  Action
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-slate-100">

              {reservations.length === 0 ? (

                <tr>

                  <td
                    colSpan="6"
                    className="p-14 text-center"
                  >

                    <div className="flex flex-col items-center">

                      <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-4">

                        <FiArchive className="w-6 h-6" />

                      </div>

                      <p className="font-bold text-slate-600">
                        Aucune réservation trouvée
                      </p>

                      <p className="text-sm text-slate-400 mt-1">
                        Essayez une autre période.
                      </p>

                    </div>

                  </td>

                </tr>

              ) : (

                reservations.map((res) => (

                  <tr
                    key={res.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >

                    {/* =================================================
                        ID
                    ================================================= */}

                    <td className="p-5">

                      <span className="font-black text-slate-900">
                        #{res.id}
                      </span>

                    </td>

                    {/* =================================================
                        PATIENT
                    ================================================= */}

                    <td className="p-5">

                      <div className="flex items-center gap-3">

                        <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">

                          <FiUser className="w-4 h-4" />

                        </div>

                        <div>

                          <p className="font-bold text-slate-700">
                            {getPatientName(res)}
                          </p>

                          {res?.user?.telephone && (

                            <p className="text-xs text-slate-400">
                              {res.user.telephone}
                            </p>

                          )}

                        </div>

                      </div>

                    </td>

                    {/* =================================================
                        DATE
                    ================================================= */}

                    <td className="p-5">

                      <span className="font-medium text-slate-500">
                        {formatDate(
                          res?.created_at
                        )}
                      </span>

                    </td>

                    {/* =================================================
                        STATUT
                    ================================================= */}

                    <td className="p-5">

                      <StatusBadge
                        statut={res?.statut}
                      />

                    </td>

                    {/* =================================================
                        MONTANT
                    ================================================= */}

                    <td className="p-5">

                      <span className="font-black text-slate-900">
                        {formatAmount(
                          res?.montant_total
                        )}
                      </span>

                    </td>

                    {/* =================================================
                        ACTION
                    ================================================= */}

                    <td className="p-5">

                      <div className="flex justify-end">

                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/TraitementReservation/${res.id}`
                            )
                          }
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all text-xs font-bold"
                        >

                          <FiEye className="w-4 h-4" />

                          Voir

                        </button>

                      </div>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

        {/* =========================================================
            PAGINATION
        ========================================================= */}

        {pagination.last_page > 1 && (

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 border-t border-slate-100">

            <p className="text-sm text-slate-500">

              Page{' '}

              <span className="font-bold text-slate-700">
                {pagination.current_page}
              </span>

              {' '}sur{' '}

              <span className="font-bold text-slate-700">
                {pagination.last_page}
              </span>

            </p>

            <div className="flex items-center gap-2">

              <button
                type="button"
                disabled={
                  pagination.current_page === 1
                }
                onClick={handlePreviousPage}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >

                <FiChevronLeft />

              </button>

              <button
                type="button"
                disabled={
                  pagination.current_page ===
                  pagination.last_page
                }
                onClick={handleNextPage}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >

                <FiChevronRight />

              </button>

            </div>

          </div>

        )}

      </div>

    </div>
  )
}

/*
|--------------------------------------------------------------------------
| STATUT
|--------------------------------------------------------------------------
*/

function StatusBadge({ statut }) {

  const config = {

    en_attente: {
      label: 'À analyser',
      className:
        'bg-amber-100 text-amber-800'
    },

    acceptee: {
      label: 'Proposition disponible',
      className:
        'bg-orange-100 text-orange-800'
    },

    confirmee: {
      label: 'Réservation confirmée',
      className:
        'bg-blue-100 text-blue-800'
    },

    prete: {
      label: 'Prête',
      className:
        'bg-emerald-100 text-emerald-800'
    },

    annulee: {
      label: 'Annulée',
      className:
        'bg-rose-100 text-rose-800'
    },

  }

  const current =
    config[statut] || {
      label: statut || 'Inconnu',
      className:
        'bg-slate-100 text-slate-600'
    }

  return (
    <span
      className={`inline-flex px-3 py-1.5 rounded-full text-xs font-black tracking-wide uppercase ${current.className}`}
    >
      {current.label}
    </span>
  )
}