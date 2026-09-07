import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import echo from '../echo'

import {
  FiBell,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiPackage,
  FiLoader,
  FiArrowRight,
  FiXCircle,
  FiTrash2,
  FiCheckSquare,
  FiSquare,
} from 'react-icons/fi'

import {
  getNotifications,
  marquerNotificationLue,
  marquerToutesLues,
  supprimerNotification,
} from '../api/api.js'

import Alert from '../components/Alert'

const playNotificationSound = async () => {
  try {
    const AudioContext =
      window.AudioContext ||
      window.webkitAudioContext

    if (!AudioContext) {
      return
    }

    const ctx = new AudioContext()

    if (ctx.state === 'suspended') {
      await ctx.resume()
    }

    const oscillator =
      ctx.createOscillator()

    const gainNode =
      ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.type = 'sine'

    oscillator.frequency.setValueAtTime(
      880,
      ctx.currentTime
    )

    oscillator.frequency.setValueAtTime(
      1108,
      ctx.currentTime + 0.1
    )

    gainNode.gain.setValueAtTime(
      0.15,
      ctx.currentTime
    )

    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + 0.35
    )

    oscillator.start()

    oscillator.stop(
      ctx.currentTime + 0.35
    )

    oscillator.onended = () => {
      ctx.close()
    }

  } catch (err) {
    console.warn(
      'Impossible de jouer le son de notification :',
      err
    )
  }
}


const STATUT_INFO = {
  en_attente: {
    label: 'En attente',
    icon: FiClock,
    tone: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  acceptee: {
    label: 'Proposition disponible',
    icon: FiPackage,
    tone: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  prete: {
    label: 'Commande prête',
    icon: FiPackage,
    tone: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  remise: {
    label: 'Commande remise',
    icon: FiCheckCircle,
    tone: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  annulee: {
    label: 'Réservation annulée',
    icon: FiXCircle,
    tone: 'bg-rose-50 text-rose-600 border-rose-200',
  },
}

export default function Notifications() {
  const navigate = useNavigate()

  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const [markingAll, setMarkingAll] = useState(false)
  const [markingId, setMarkingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const [selectedIds, setSelectedIds] = useState([])
  const [batchActionLoading, setBatchActionLoading] = useState(false)

  const [error, setError] = useState('')

  const fetchNotifications = async (silent = false) => {
    if (!silent) {
      setLoading(true)
      setError('')
    }

    try {
      const response = await getNotifications()
      const data =
        response?.data?.notifications ??
        response?.data?.data?.notifications ??
        response?.data?.data ??
        response?.data ??
        []

      if (Array.isArray(data)) {
        setNotifications(data)
      } else if (!silent) {
        setNotifications([])
      }
    } catch (err) {
      console.error('Erreur chargement notifications :', err)
      if (!silent) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            'Impossible de charger les notifications.'
        )
        setNotifications([])
      }
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  useEffect(() => {
  const user = JSON.parse(localStorage.getItem('pharmago_user'))

  if (!user?.id || !echo) {
    return
  }

  console.log('👂 Écoute notifications utilisateur :', user.id)

  const channel = echo.private(`notifications.${user.id}`)

  // =====================================================
  // NOUVELLE NOTIFICATION
  // =====================================================

  channel.listen('.notification.created', (event) => {
    console.log('🔔 Nouvelle notification reçue :', event)

    if (!event?.notification) {
      return
    }

    setNotifications((prev) => {
      const exists = prev.some(
        (notification) =>
          notification.id === event.notification.id
      )

      if (exists) {
        return prev
      }

      return [
        event.notification,
        ...prev,
      ]
    })

    playNotificationSound()
  })

  // =====================================================
  // CHANGEMENT DE STATUT D'UNE RÉSERVATION
  // =====================================================

  channel.listen('.reservation.status.updated', (event) => {
    console.log(
      '🔄 Statut réservation reçu :',
      event
    )

    const reservation =
      event?.reservation

    if (
      !reservation?.id ||
      !reservation?.statut
    ) {
      return
    }

    const reservationId =
      String(reservation.id)

    const nouveauStatut =
      reservation.statut

    setNotifications((prev) =>
      prev.map((notification) => {
        const notificationReservationId =
          getReservationId(notification)

        if (
          notificationReservationId !==
          reservationId
        ) {
          return notification
        }

        return {
          ...notification,

          data: {
            ...(normaliserData(notification.data) || {}),
            reservation_id: reservation.id,
            statut: nouveauStatut,
          },

          statut: nouveauStatut,
        }
      })
    )

    playNotificationSound()
  })

  return () => {
    console.log(
      '🧹 Arrêt écoute notifications utilisateur :',
      user.id
    )

    echo.leave(
      `notifications.${user.id}`
    )
  }
}, [])

  const handleSelectAllToggle = () => {
    if (selectedIds.length === notifications.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(notifications.map((n) => n.id).filter(Boolean))
    }
  }

  const handleSelectOne = (id, event) => {
    event.stopPropagation()
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleBatchMarkAsRead = async () => {
    if (selectedIds.length === 0 || batchActionLoading) return
    setBatchActionLoading(true)
    try {
      await Promise.all(selectedIds.map((id) => marquerNotificationLue(id)))
      const now = new Date().toISOString()
      setNotifications((prev) =>
        prev.map((item) =>
          selectedIds.includes(item.id)
            ? { ...item, read_at: item.read_at || now, lue: true, lu: true, read: true }
            : item
        )
      )
      setSelectedIds([])
    } catch (err) {
      console.error('Erreur action groupée (lecture) :', err)
      setError('Impossible de marquer les éléments sélectionnés comme lus.')
    } finally {
      setBatchActionLoading(false)
    }
  }

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0 || batchActionLoading) return
    setBatchActionLoading(true)
    setError('')
    try {
      await Promise.all(selectedIds.map((id) => supprimerNotification(id)))
      setNotifications((prev) => prev.filter((item) => !selectedIds.includes(item.id)))
      setSelectedIds([])
    } catch (err) {
      console.error('Erreur action groupée (suppression) :', err)
      setError('Impossible de supprimer les notifications sélectionnées.')
    } finally {
      setBatchActionLoading(false)
    }
  }

  const isNotificationRead = (notification) => {
    return Boolean(
      notification?.read_at ||
        notification?.lue === true ||
        notification?.lu === true ||
        notification?.read === true
    )
  }

  const handleMarkAsRead = async (notification) => {
    if (!notification?.id || isNotificationRead(notification)) return

    setMarkingId(notification.id)

    try {
      await marquerNotificationLue(notification.id)
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id
            ? {
                ...item,
                read_at: item.read_at || new Date().toISOString(),
                lue: true,
                lu: true,
                read: true,
              }
            : item
        )
      )
    } catch (err) {
      console.error('Erreur marquage notification :', err)
    } finally {
      setMarkingId(null)
    }
  }

  const handleDeleteNotification = async (notificationId, event) => {
    event.stopPropagation()
    if (!notificationId) return

    setDeletingId(notificationId)
    setError('')

    try {
      await supprimerNotification(notificationId)
      setNotifications((prev) => prev.filter((item) => item.id !== notificationId))
    } catch (err) {
      console.error('Erreur suppression notification :', err)
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Impossible de supprimer la notification.'
      )
    } finally {
      setDeletingId(null)
    }
  }

  const handleMarkAllAsRead = async () => {
    if (markingAll) return

    setMarkingAll(true)
    setError('')

    try {
      await marquerToutesLues()
      const now = new Date().toISOString()
      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          read_at: notification.read_at || now,
          lue: true,
          lu: true,
          read: true,
        }))
      )
    } catch (err) {
      console.error('Erreur marquage toutes notifications :', err)
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Impossible de marquer toutes les notifications comme lues.'
      )
    } finally {
      setMarkingAll(false)
    }
  }

  const getNotificationTitle = (notification) => {
    return (
      notification?.titre ||
      notification?.title ||
      notification?.data?.title ||
      notification?.data?.titre ||
      'Nouvelle notification'
    )
  }

 const getNotificationMessage = (notification) => {
  const statut = getNotificationStatus(notification)

  switch (statut) {
    case 'acceptee':
      return 'Analyse terminée. La pharmacie a préparé votre proposition. Vous pouvez réserver.'

    case 'confirmee':
      return 'Votre réservation est confirmée. La pharmacie va maintenant préparer votre commande.'

    case 'prete':
      return 'Votre commande est prête. Vous pouvez passer à la pharmacie pour récupérer vos médicaments.'

    case 'remise':
      return 'Votre commande a été remise. Cette réservation est terminée.'

    case 'annulee':
      return 'Cette réservation a été annulée.'

    default:
      return (
        notification?.message ||
        notification?.body ||
        notification?.data?.message ||
        notification?.data?.body ||
        'Vous avez reçu une nouvelle notification.'
      )
  }
}


  const normaliserData = (rawData) => {
    let data = rawData
    if (!data) return null
    if (typeof data === 'object') return data
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data)
      } catch {
        return null
      }
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data)
        } catch {
          return null
        }
      }
    }
    return data
  }

  const getReservationId = (notification) => {
    const data = normaliserData(notification?.data)
    const reservationId =
      notification?.reservation_id ??
      notification?.reservationId ??
      notification?.reservation?.id ??
      data?.reservation_id ??
      data?.reservationId ??
      data?.reservation?.id ??
      notification?.notifiable_id ??
      notification?.notifiable?.id

    if (
      reservationId === undefined ||
      reservationId === null ||
      reservationId === '' ||
      reservationId === 'undefined' ||
      reservationId === 'null'
    ) {
      return null
    }

    return String(reservationId)
  }

  const getNotificationStatus = (notification) => {
    const data = normaliserData(notification?.data)

    return (
      notification?.statut ||
      notification?.status ||
      notification?.reservation?.statut ||
      notification?.reservation?.status ||
      data?.statut ||
      data?.status ||
      data?.reservation?.statut ||
      data?.reservation?.status ||
      null
    )
  }

  const isProposalNotification = (notification) => {
    const statut = getNotificationStatus(notification)
    const title = getNotificationTitle(notification).toLowerCase()
    const message = getNotificationMessage(notification).toLowerCase()

    return (
      statut === 'acceptee' ||
      statut === 'proposition_disponible' ||
      statut === 'attente_confirmation' ||
      title.includes('analys') ||
      title.includes('proposition') ||
      message.includes('analys') ||
      message.includes('proposition')
    )
  }

  const formatDate = (date) => {
    if (!date) return ''
    try {
      const parsedDate = new Date(date)
      if (Number.isNaN(parsedDate.getTime())) return ''
      return parsedDate.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return ''
    }
  }

  const handleNotificationClick = async (notification) => {
    const reservationId = getReservationId(notification)
    if (!isNotificationRead(notification)) {
      await handleMarkAsRead(notification)
    }
    if (!reservationId) return
    navigate(`/notifications/${reservationId}`)
  }

  const unreadCount = notifications.filter(
    (notification) => !isNotificationRead(notification)
  ).length

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <FiLoader className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-sm font-medium text-slate-500">
            Chargement de vos notifications...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pb-24">
      <div className="bg-white border-b border-slate-100 pt-8 pb-8 sticky top-0 z-20 backdrop-blur-md bg-white/80">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100/80 flex items-center justify-center text-emerald-600 shadow-sm">
                <FiBell className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Notifications
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Gérez vos alertes et suivez l'état de vos réservations en temps réel.
                </p>
              </div>
            </div>

            {notifications.length > 0 && (
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={handleSelectAllToggle}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-semibold hover:bg-slate-50 hover:text-slate-900 transition shadow-sm"
                >
                  {selectedIds.length === notifications.length
                    ? 'Tout désélectionner'
                    : 'Tout sélectionner'}
                </button>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    disabled={markingAll}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition shadow-sm shadow-emerald-600/20 disabled:opacity-60"
                  >
                    {markingAll ? (
                      <FiLoader className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FiCheck className="w-3.5 h-3.5" />
                    )}
                    Tout lire
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-6">
        {error && (
          <div className="mb-6">
            <Alert type="error" message={error} />
          </div>
        )}

        {notifications.length === 0 && !error ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-sm mt-8">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <FiBell className="w-7 h-7" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Aucune notification
            </h2>
            <p className="mt-1.5 text-sm text-slate-500 max-w-sm mx-auto">
              Vous êtes à jour ! Vos prochaines alertes apparaîtront ici.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {notifications.map((notification) => {
              const read = isNotificationRead(notification)
              const reservationId = getReservationId(notification)
              const statut = getNotificationStatus(notification)
              const statusInfo = STATUT_INFO[statut]
              const StatusIcon = statusInfo?.icon || FiBell
              const isProposal = isProposalNotification(notification)
              const isSelected = selectedIds.includes(notification.id)

              return (
                <div
                  key={notification.id || `${reservationId}-${notification.created_at}`}
                  onClick={(e) => handleSelectOne(notification.id, e)}
                  className={`group relative bg-white rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden ${
                    isSelected
                      ? 'border-emerald-500 ring-1 ring-emerald-500/30 bg-emerald-50/10'
                      : read
                      ? 'border-slate-200/80 hover:border-slate-300 shadow-sm'
                      : 'border-emerald-200 bg-white shadow-md shadow-emerald-500/5'
                  }`}
                >
                  {!read && (
                    <div className="absolute top-4 left-4 w-2 h-2 rounded-full bg-emerald-500 z-10" />
                  )}

                  <div className="p-4 sm:p-5 flex items-start gap-4">
                    <div className="pt-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleSelectOne(notification.id, e)}
                        className="text-slate-400 hover:text-emerald-600 transition"
                      >
                        {isSelected ? (
                          <FiCheckSquare className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <FiSquare className="w-5 h-5 text-slate-300 group-hover:text-slate-400" />
                        )}
                      </button>
                    </div>

                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        read
                          ? 'bg-slate-50 border-slate-100 text-slate-500'
                          : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                      }`}
                    >
                      <StatusIcon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0 pr-12">
                      <div className="flex items-center justify-between gap-2">
                        <h2
                          className={`text-sm sm:text-base break-words tracking-tight ${
                            read ? 'font-medium text-slate-800' : 'font-bold text-slate-900'
                          }`}
                        >
                          {getNotificationTitle(notification)}
                        </h2>
                      </div>

                      <p className="mt-1 text-xs sm:text-sm text-slate-500 leading-relaxed break-words">
                        {getNotificationMessage(notification)}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {isProposal ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200">
                            <FiPackage className="w-3 h-3" />
                            Proposition disponible
                          </span>
                        ) : statusInfo ? (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusInfo.tone}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {statusInfo.label}
                          </span>
                        ) : null}

                        <span className="text-[11px] text-slate-400 ml-auto">
                          {formatDate(
                            notification.created_at ||
                              notification.date ||
                              notification.createdAt
                          )}
                        </span>
                      </div>

                      {reservationId && (
                        <div className="mt-3.5 pt-3 border-t border-slate-100/80 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleNotificationClick(notification)
                            }}
                            className={`inline-flex items-center gap-1.5 text-xs font-bold transition-colors ${
                              isProposal
                                ? 'text-emerald-600 hover:text-emerald-700'
                                : 'text-slate-700 hover:text-emerald-600'
                            }`}
                          >
                            {isProposal ? 'Voir les médicaments et réserver' : 'Voir la réservation'}
                            <FiArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    className="absolute right-3.5 top-3.5 flex items-center gap-1.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {!read && (
                      <button
                        type="button"
                        title="Marquer comme lu"
                        onClick={() => handleMarkAsRead(notification)}
                        disabled={markingId === notification.id}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 flex items-center justify-center transition shadow-xs disabled:opacity-50"
                      >
                        {markingId === notification.id ? (
                          <FiLoader className="w-3 h-3 animate-spin" />
                        ) : (
                          <FiCheck className="w-3 h-3" />
                        )}
                      </button>
                    )}

                    <button
                      type="button"
                      title="Supprimer"
                      onClick={(e) => handleDeleteNotification(notification.id, e)}
                      disabled={deletingId === notification.id}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 flex items-center justify-center transition shadow-xs disabled:opacity-50"
                    >
                      {deletingId === notification.id ? (
                        <FiLoader className="w-3 h-3 animate-spin text-rose-600" />
                      ) : (
                        <FiTrash2 className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-md px-4">
          <div className="bg-slate-900/95 backdrop-blur-md text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center justify-between border border-slate-800">
            <span className="text-xs font-semibold text-slate-300">
              <strong className="text-white font-bold">{selectedIds.length}</strong>{' '}
              {selectedIds.length > 1 ? 'sélectionnées' : 'sélectionnée'}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBatchMarkAsRead}
                disabled={batchActionLoading}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition flex items-center gap-1.5 border border-slate-700 disabled:opacity-50"
              >
                <FiCheck className="w-3.5 h-3.5 text-emerald-400" />
                Marquer lu
              </button>

              <button
                type="button"
                onClick={handleBatchDelete}
                disabled={batchActionLoading}
                className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-medium transition flex items-center gap-1.5 border border-rose-500/30 disabled:opacity-50"
              >
                {batchActionLoading ? (
                  <FiLoader className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FiTrash2 className="w-3.5 h-3.5" />
                )}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}