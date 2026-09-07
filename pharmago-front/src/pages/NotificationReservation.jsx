import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import echo from '../echo'

import {
  FiArrowLeft,
  FiPackage,
  FiLoader,
  FiCheckCircle,
  FiAlertTriangle,
  FiXCircle,
  FiClock,
} from 'react-icons/fi'

import {
  getReservation,
  confirmerReservation,
} from '../api/api.js'

export default function NotificationReservation() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [reservation, setReservation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reserving, setReserving] = useState(false)
  const [error, setError] = useState('')

  // =====================================================
  // CHARGER LA RÉSERVATION
  // =====================================================

  useEffect(() => {
    const fetchReservation = async () => {
      if (!id) {
        setError('Identifiant de réservation manquant.')
        setLoading(false)
        return
      }

      try {
        console.log('📥 Chargement réservation :', id)

        const response = await getReservation(id)

        console.log('📥 Réponse réservation :', response)

        const data =
          response?.data?.reservation ??
          response?.data?.data ??
          response?.data

        console.log('✅ Réservation récupérée :', data)

        if (!data || !data.id) {
          setError('La réservation est introuvable.')
          return
        }

        setReservation(data)
      } catch (err) {
        console.error('❌ Erreur réservation :', err)
        console.error(
          '❌ Réponse serveur :',
          err?.response?.data
        )

        setError(
          err?.response?.data?.message ||
            'Impossible de charger la réservation.'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchReservation()
  }, [id])


useEffect(() => {
  if (!reservation?.user_id) {
    console.log('⏳ Echo en attente : user_id absent')
    return
  }

  const userId = reservation.user_id

  console.log(
    '🟢 Démarrage Echo — utilisateur :',
    userId
  )

  const channelName = `notifications.${userId}`

  const channel = echo.private(channelName)

  channel.listen(
    '.reservation.status.updated',
    (event) => {
      console.log(
        '📨 MESSAGE WEBSOCKET REÇU :',
        event
      )

      const eventReservation = event?.reservation

      if (!eventReservation) {
        console.warn(
          '⚠️ Événement reçu sans réservation'
        )
        return
      }

      // Vérifier que l'événement concerne
      // bien la réservation actuellement affichée
      if (
        Number(eventReservation.id) !==
        Number(reservation.id)
      ) {
        console.log(
          'ℹ️ Événement pour une autre réservation :',
          eventReservation.id
        )
        return
      }

      const nouveauStatut =
        eventReservation.statut

      if (!nouveauStatut) {
        console.warn(
          '⚠️ Statut absent dans événement'
        )
        return
      }

      console.log(
        '⚡ STATUT MIS À JOUR :',
        reservation.statut,
        '→',
        nouveauStatut
      )

      setReservation((prev) => {
        if (!prev) return prev

        return {
          ...prev,
          statut: nouveauStatut,
        }
      })
    }
  )

  console.log(
    '👂 Écoute active sur :',
    channelName
  )

  return () => {
    console.log(
      '🧹 Arrêt écoute :',
      channelName
    )

    echo.leave(channelName)
  }

}, [reservation?.user_id, reservation?.id])

  

  // =====================================================
  // RÉSERVER / CONFIRMER
  // =====================================================

  const handleReserver = async () => {
    if (!reservation?.id || reserving) {
      return
    }

    if (reservation.statut !== 'acceptee') {
      return
    }

    setReserving(true)
    setError('')

    try {
      console.log(
        '📤 Confirmation réservation :',
        reservation.id
      )

      const response = await confirmerReservation(
        reservation.id
      )

      console.log(
        '✅ Réservation confirmée :',
        response
      )

      setReservation((prev) => {
        if (!prev) {
          return prev
        }

        return {
          ...prev,
          statut: 'confirmee',
        }
      })

      navigate('/notifications', {
        replace: true,
      })
    } catch (err) {
      console.error(
        '❌ Erreur réservation :',
        err
      )

      console.error(
        '❌ Réponse serveur :',
        err?.response?.data
      )

      setError(
        err?.response?.data?.message ||
          'Impossible de confirmer la réservation.'
      )

      setReserving(false)
    }
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <FiLoader className="w-7 h-7 text-emerald-600 animate-spin" />

          <p className="text-sm text-slate-500">
            Chargement de la proposition...
          </p>
        </div>
      </div>
    )
  }

  // =====================================================
  // ERREUR DE CHARGEMENT
  // =====================================================

  if (error && !reservation) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl border border-rose-200 shadow-sm p-6">

            <div className="flex items-start gap-4">
              <div className="w-11 h-11 shrink-0 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center">
                <FiXCircle className="w-5 h-5 text-rose-600" />
              </div>

              <div>
                <h1 className="font-bold text-slate-900">
                  Impossible de charger la réservation
                </h1>

                <p className="mt-1 text-sm text-rose-600">
                  {error}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate('/notifications')
              }
              className="mt-6 w-full px-4 py-3 rounded-2xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition"
            >
              Retour aux notifications
            </button>
          </div>
        </div>
      </div>
    )
  }

  // =====================================================
  // DONNÉES
  // =====================================================

  const medicaments =
    reservation?.medicaments || []

  const statut =
    reservation?.statut || ''

  const propositionDisponible =
    statut === 'acceptee'

  // =====================================================
  // INFORMATIONS STATUT
  // =====================================================

  const getStatutInfo = () => {
    switch (statut) {
      case 'acceptee':
        return {
          label: 'Proposition disponible',
          icon: FiPackage,
          className:
            'bg-emerald-50 text-emerald-700 border-emerald-200',
        }

      case 'confirmee':
        return {
          label: 'Réservation confirmée',
          icon: FiCheckCircle,
          className:
            'bg-emerald-50 text-emerald-700 border-emerald-200',
        }

      case 'prete':
        return {
          label: 'Commande prête',
          icon: FiPackage,
          className:
            'bg-sky-50 text-sky-700 border-sky-200',
        }

      case 'remise':
        return {
          label: 'Commande remise',
          icon: FiCheckCircle,
          className:
            'bg-slate-50 text-slate-600 border-slate-200',
        }

      case 'annulee':
        return {
          label: 'Réservation annulée',
          icon: FiXCircle,
          className:
            'bg-rose-50 text-rose-600 border-rose-200',
        }

      case 'en_attente':
        return {
          label: 'En attente de traitement',
          icon: FiClock,
          className:
            'bg-amber-50 text-amber-700 border-amber-200',
        }

      default:
        return {
          label:
            statut || 'Statut inconnu',
          icon: FiClock,
          className:
            'bg-slate-50 text-slate-600 border-slate-200',
        }
    }
  }

  const statutInfo = getStatutInfo()
  const StatutIcon = statutInfo.icon

  // =====================================================
  // MESSAGE STATUT
  // =====================================================

  const getStatusMessage = () => {
    switch (statut) {
      case 'acceptee':
        return (
          <>
            <strong>
              La pharmacie a analysé votre ordonnance.
            </strong>{' '}
            Une proposition est disponible.
          </>
        )

      case 'confirmee':
        return (
          <>
            <strong>
              Votre réservation est confirmée.
            </strong>{' '}
            La pharmacie va maintenant préparer votre commande.
          </>
        )

      case 'prete':
        return (
          <>
            <strong>
              Votre commande est prête.
            </strong>{' '}
            Vous pouvez vous rendre à la pharmacie pour récupérer vos médicaments.
          </>
        )

      case 'remise':
        return (
          <>
            <strong>
              Votre commande a été remise.
            </strong>{' '}
            Cette réservation est terminée.
          </>
        )

      case 'annulee':
        return (
          <>
            <strong>
              Cette réservation a été annulée.
            </strong>
          </>
        )

      case 'en_attente':
        return (
          <>
            Votre demande est encore en attente d'analyse par la pharmacie.
          </>
        )

      default:
        return null
    }
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

        {/* RETOUR */}

        <button
          type="button"
          onClick={() =>
            navigate('/notifications')
          }
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-600 transition"
        >
          <FiArrowLeft className="w-4 h-4" />

          Retour aux notifications
        </button>

        {/* CARTE PRINCIPALE */}

        <div className="mt-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">

            {/* HEADER */}

            <div className="flex items-start gap-4">

              <div className="w-12 h-12 shrink-0 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <FiPackage className="w-6 h-6 text-emerald-600" />
              </div>

              <div className="min-w-0">

                <h1 className="text-xl font-bold text-slate-900">
                  Proposition de la pharmacie
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Réservation #{reservation?.id}
                </p>

              </div>

            </div>

            {/* STATUT */}

            <div className="mt-5">

              <span
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${statutInfo.className}`}
              >

                <StatutIcon className="w-3.5 h-3.5" />

                {statutInfo.label}

              </span>

            </div>

            {/* MESSAGE */}

            {getStatusMessage() && (
              <div className="mt-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200">

                <div className="flex items-start gap-3">

                  <FiCheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />

                  <p className="text-sm text-emerald-700 leading-relaxed">
                    {getStatusMessage()}
                  </p>

                </div>

              </div>
            )}

            {/* MÉDICAMENTS */}

            <div className="mt-8">

              <div className="flex items-center justify-between">

                <h2 className="text-base font-bold text-slate-900">
                  Médicaments
                </h2>

                <span className="text-xs text-slate-400">
                  {medicaments.length}{' '}
                  {medicaments.length > 1
                    ? 'médicaments'
                    : 'médicament'}
                </span>

              </div>

              {medicaments.length === 0 ? (

                <div className="mt-4 p-5 rounded-2xl bg-amber-50 border border-amber-200">

                  <div className="flex items-start gap-3">

                    <FiAlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />

                    <p className="text-sm text-amber-700">
                      Aucun médicament n'a été trouvé pour cette réservation.
                    </p>

                  </div>

                </div>

              ) : (

                <div className="mt-4 space-y-3">
{medicaments.map((medicament) => {

  const pivot = medicament?.pivot || {}

  const quantite = Number(
    pivot?.quantite || 1
  )

  const prix = Number(
    pivot?.prix_unitaire || 0
  )

  const total = quantite * prix

  // IMPORTANT :
  // Laravel envoie false lorsque le médicament est en rupture.
  const disponible =
    pivot?.disponible !== false &&
    pivot?.disponible !== 0 &&
    pivot?.disponible !== '0'

  return (

    <div
      key={medicament.id}
      className={`p-4 rounded-2xl border ${
        disponible
          ? 'bg-slate-50 border-slate-200'
          : 'bg-rose-50 border-rose-200'
      }`}
    >

      <div className="flex items-start justify-between gap-4">

        {/* INFORMATIONS MÉDICAMENT */}

        <div className="min-w-0 flex-1">

          <div className="flex items-start gap-2">

            <p
              className={`font-semibold break-words ${
                disponible
                  ? 'text-slate-900'
                  : 'text-rose-800'
              }`}
            >
              {medicament?.nom || 'Médicament'}
            </p>

          </div>

          <p className="mt-1 text-xs text-slate-500">
            Quantité : {quantite}
          </p>

          {/* RUPTURE */}

          {!disponible && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-100 border border-rose-200">

              <FiAlertTriangle className="w-4 h-4 text-rose-600" />

              <span className="text-xs font-bold text-rose-700">
                Médicament en rupture
              </span>

            </div>
          )}

        </div>

        {/* PRIX */}

        <div className="text-right shrink-0">

          <p
            className={`font-bold ${
              disponible
                ? 'text-slate-900'
                : 'text-rose-700'
            }`}
          >
            {total.toLocaleString('fr-FR')}{' '}
            FCFA
          </p>

          <p className="text-xs text-slate-400">
            {prix.toLocaleString('fr-FR')}{' '}
            FCFA / unité
          </p>

        </div>

      </div>

    </div>

  )
})}


                </div>

              )}

            </div>

            {/* MONTANTS */}

            <div className="mt-7 pt-6 border-t border-slate-100 space-y-4">

              <div className="flex items-center justify-between text-sm">

                <span className="text-slate-500">
                  Montant total
                </span>

                <strong className="text-slate-900">
                  {Number(
                    reservation?.montant_total || 0
                  ).toLocaleString('fr-FR')}{' '}
                  FCFA
                </strong>

              </div>

              <div className="flex items-center justify-between text-sm">

                <span className="text-slate-500">
                  Prise en charge assurance
                </span>

                <strong className="text-emerald-600">
                  {Number(
                    reservation?.montant_assurance || 0
                  ).toLocaleString('fr-FR')}{' '}
                  FCFA
                </strong>

              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">

                <span className="font-semibold text-slate-700">
                  Reste à payer
                </span>

                <strong className="text-xl text-slate-900">
                  {Number(
                    reservation?.reste_patient || 0
                  ).toLocaleString('fr-FR')}{' '}
                  FCFA
                </strong>

              </div>

            </div>

            {/* ERREUR */}

            {error && (
              <div className="mt-6 p-4 rounded-2xl bg-rose-50 border border-rose-200">

                <div className="flex items-start gap-3">

                  <FiXCircle className="w-5 h-5 text-rose-600 shrink-0" />

                  <p className="text-sm text-rose-600">
                    {error}
                  </p>

                </div>

              </div>
            )}

            {/* BOUTON RÉSERVER */}

            {propositionDisponible && (

              <button
                type="button"
                onClick={handleReserver}
                disabled={reserving}
                className="mt-7 w-full inline-flex items-center justify-center gap-2 px-5 py-4 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >

                {reserving ? (
                  <>
                    <FiLoader className="w-5 h-5 animate-spin" />
                    Réservation en cours...
                  </>
                ) : (
                  <>
                    <FiCheckCircle className="w-5 h-5" />
                    Réserver
                  </>
                )}

              </button>

            )}

            {/* APRÈS CONFIRMATION */}

            {statut === 'confirmee' && (

              <div className="mt-7">

                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">

                  <FiCheckCircle className="w-7 h-7 text-emerald-600 mx-auto mb-2" />

                  <p className="font-bold text-emerald-800">
                    Réservation confirmée
                  </p>

                  <p className="mt-1 text-sm text-emerald-700">
                    La pharmacie va préparer votre commande.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate('/notifications')
                  }
                  className="mt-3 w-full px-5 py-3 rounded-2xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition"
                >
                  Retour aux notifications
                </button>

              </div>

            )}

            {/* AUTRES STATUTS */}

            {statut !== 'acceptee' &&
              statut !== 'confirmee' && (

                <div className="mt-7">

                  <button
                    type="button"
                    onClick={() =>
                      navigate('/notifications')
                    }
                    className="w-full px-5 py-3 rounded-2xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition"
                  >
                    Retour aux notifications
                  </button>

                </div>

              )}

          </div>
        </div>

      </div>
    </div>
  )
}
