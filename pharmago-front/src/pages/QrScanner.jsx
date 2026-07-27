import { useState } from 'react'
import api from '../api/axios'
import { getErrorMessage } from '../api/errors'
import Alert from '../components/Alert'

export default function QrScanner() {
  const [code, setCode] = useState('')
  const [reservation, setReservation] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(false)

  const handleScan = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setReservation(null)
    setLoading(true)
    try {
      const { data } = await api.post('/qrcodes/scanner', { code })
      setReservation(data.reservation)
    } catch (err) {
      setError(getErrorMessage(err, 'QR code invalide ou expiré.'))
    } finally {
      setLoading(false)
    }
  }

  const handleValider = async () => {
    setValidating(true)
    setError('')
    setSuccess('')
    try {
      await api.put(`/qrcodes/${code}/utiliser`)
      setSuccess('Retrait confirmé avec succès.')
      setReservation(null)
      setCode('')
    } catch (err) {
      setError(getErrorMessage(err, 'La validation a échoué.'))
    } finally {
      setValidating(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-800">Scanner un QR code</h1>
        <p className="text-brand-500">Saisissez ou collez le code présenté par le patient pour valider le retrait.</p>
      </div>

      <form onSubmit={handleScan} className="card space-y-3">
        <Alert type="error" onClose={() => setError('')}>{error}</Alert>
        <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>

        <label className="label">Code QR</label>
        <div className="flex gap-2">
          <input
            required
            className="input flex-1 font-mono"
            placeholder="ex: 3f2a1c9b-..."
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Vérification…' : 'Vérifier'}
          </button>
        </div>
      </form>

      {reservation && (
        <div className="card space-y-3">
          <h2 className="font-display text-lg font-semibold text-brand-800">Réservation #{reservation.id}</h2>
          {reservation.user && (
            <p className="text-sm text-brand-700">
              Patient : <span className="font-medium">{reservation.user.prenom} {reservation.user.nom}</span>
            </p>
          )}
          {reservation.medicaments?.length > 0 && (
            <div className="divide-y divide-brand-100 text-sm">
              {reservation.medicaments.map((m) => (
                <div key={m.id} className="flex justify-between py-1.5">
                  <span>{m.nom}</span>
                  <span className="text-brand-500">x{m.pivot?.quantite ?? 1}</span>
                </div>
              ))}
            </div>
          )}
          {reservation.facture && (
            <p className="text-sm text-brand-700">
              Montant à percevoir : <span className="font-semibold">{reservation.facture.montant_patient} FCFA</span>
            </p>
          )}
          <button onClick={handleValider} disabled={validating} className="btn-primary w-full">
            {validating ? 'Validation…' : '✅ Confirmer le retrait'}
          </button>
        </div>
      )}
    </div>
  )
}
