import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/axios'
import { getErrorMessage } from '../api/errors'
import { useAuth } from '../context/AuthContext'
import Loader from '../components/Loader'
import Alert from '../components/Alert'
import StatutBadge from '../components/StatutBadge'

const STATUTS_SUIVANTS = {
  en_attente: ['acceptee', 'annulee'],
  acceptee: ['prete', 'annulee'],
  prete: ['remise', 'annulee'],
  remise: [],
  annulee: [],
}

export default function ReservationDetail() {
  const { id } = useParams()
  const { isPharmacie } = useAuth()

  const [reservation, setReservation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [updating, setUpdating] = useState(false)

  const [showFactureForm, setShowFactureForm] = useState(false)
  const [montantTotal, setMontantTotal] = useState('')
  const [avecBon, setAvecBon] = useState(false)
  const [montantPrisEnCharge, setMontantPrisEnCharge] = useState('')
  const [facturing, setFacturing] = useState(false)

  const fetchReservation = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get(`/reservations/${id}`)
      setReservation(data.data)
    } catch (err) {
      setError('Impossible de charger cette réservation.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReservation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleStatut = async (statut) => {
    setUpdating(true)
    setError('')
    setSuccess('')
    try {
      await api.put(`/reservations/${id}/statut`, { statut })
      setSuccess('Statut mis à jour.')
      fetchReservation()
    } catch (err) {
      setError(getErrorMessage(err, 'La mise à jour a échoué.'))
    } finally {
      setUpdating(false)
    }
  }

  const handleFacture = async (e) => {
    e.preventDefault()
    setFacturing(true)
    setError('')
    setSuccess('')
    try {
      await api.post('/factures', {
        reservation_id: id,
        montant_total: montantTotal,
        avec_bon: avecBon,
        ...(avecBon ? { montant_pris_en_charge: montantPrisEnCharge } : {}),
      })
      setSuccess('Facture et QR code générés.')
      setShowFactureForm(false)
      fetchReservation()
    } catch (err) {
      setError(getErrorMessage(err, 'La génération de la facture a échoué.'))
    } finally {
      setFacturing(false)
    }
  }

  if (loading) return <Loader label="Chargement de la réservation…" />
  if (!reservation) return <Alert type="error">{error || 'Réservation introuvable.'}</Alert>

  const suivants = STATUTS_SUIVANTS[reservation.statut] || []
  const facture = reservation.facture
  const qrCode = reservation.qr_code || reservation.qrCode

  return (
    <div className="space-y-6">
      <Link to="/reservations" className="text-sm text-brand-600 hover:underline">← Retour aux réservations</Link>

      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-brand-800">Réservation #{reservation.id}</h1>
            <p className="text-sm text-brand-500">
              Créée le {new Date(reservation.created_at).toLocaleString('fr-FR')}
            </p>
          </div>
          <StatutBadge statut={reservation.statut} />
        </div>

        <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          {reservation.pharmacie && (
            <div>
              <p className="text-xs font-semibold uppercase text-brand-400">Pharmacie</p>
              <p className="text-brand-800">{reservation.pharmacie.nom}</p>
              <p className="text-brand-500">{reservation.pharmacie.adresse}</p>
            </div>
          )}
          {reservation.user && (
            <div>
              <p className="text-xs font-semibold uppercase text-brand-400">Patient</p>
              <p className="text-brand-800">{reservation.user.prenom} {reservation.user.nom}</p>
              <p className="text-brand-500">{reservation.user.telephone}</p>
            </div>
          )}
          {reservation.note && (
            <div className="sm:col-span-2">
              <p className="text-xs font-semibold uppercase text-brand-400">Note</p>
              <p className="text-brand-700">{reservation.note}</p>
            </div>
          )}
        </div>
      </div>

      <Alert type="error" onClose={() => setError('')}>{error}</Alert>
      <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>

      <div className="card">
        <h2 className="mb-3 font-display text-lg font-semibold text-brand-800">Médicaments</h2>
        {reservation.medicaments?.length ? (
          <div className="divide-y divide-brand-100">
            {reservation.medicaments.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-brand-800">{m.nom}</span>
                <span className="text-brand-500">x{m.pivot?.quantite ?? 1}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-brand-500">Aucun médicament associé.</p>
        )}
      </div>

      {isPharmacie && suivants.length > 0 && (
        <div className="card">
          <h2 className="mb-3 font-display text-lg font-semibold text-brand-800">Changer le statut</h2>
          <div className="flex flex-wrap gap-2">
            {suivants.map((s) => (
              <button key={s} disabled={updating} onClick={() => handleStatut(s)} className="btn-outline">
                Marquer <StatutBadge statut={s} />
              </button>
            ))}
          </div>
        </div>
      )}

      {isPharmacie && !facture && reservation.statut !== 'annulee' && (
        <div className="card">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-brand-800">Facturation</h2>
            <button className="btn-ghost" onClick={() => setShowFactureForm((v) => !v)}>
              {showFactureForm ? 'Annuler' : 'Générer une facture'}
            </button>
          </div>

          {showFactureForm && (
            <form onSubmit={handleFacture} className="mt-4 space-y-4">
              <div>
                <label className="label">Montant total (FCFA)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className="input"
                  value={montantTotal}
                  onChange={(e) => setMontantTotal(e.target.value)}
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-brand-700">
                <input type="checkbox" checked={avecBon} onChange={(e) => setAvecBon(e.target.checked)} className="h-4 w-4 accent-brand-600" />
                Utiliser un bon d'assurance
              </label>

              {avecBon && (
                <div>
                  <label className="label">Montant pris en charge (FCFA)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className="input"
                    value={montantPrisEnCharge}
                    onChange={(e) => setMontantPrisEnCharge(e.target.value)}
                  />
                </div>
              )}

              <button type="submit" disabled={facturing} className="btn-primary w-full">
                {facturing ? 'Génération…' : 'Générer la facture et le QR code'}
              </button>
            </form>
          )}
        </div>
      )}

      {facture && (
        <div className="card">
          <h2 className="mb-3 font-display text-lg font-semibold text-brand-800">Facture {facture.numero_facture}</h2>
          <div className="grid gap-2 text-sm sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase text-brand-400">Total</p>
              <p className="text-brand-800">{facture.montant_total} FCFA</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-brand-400">Pris en charge</p>
              <p className="text-brand-800">{facture.montant_assurance} FCFA</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-brand-400">À votre charge</p>
              <p className="text-brand-800">{facture.montant_patient} FCFA</p>
            </div>
          </div>

          {qrCode?.code && (
            <div className="mt-5 flex flex-col items-center gap-2 border-t border-brand-100 pt-5">
              <p className="text-sm text-brand-600">Présentez ce QR code au retrait de vos médicaments</p>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCode.code)}`}
                alt="QR code de retrait"
                className="rounded-xl border border-brand-200 p-2"
              />
              <p className="font-mono text-xs text-brand-400">{qrCode.code}</p>
              {qrCode.utilise && <span className="badge bg-brand-600 text-white">Déjà utilisé</span>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
