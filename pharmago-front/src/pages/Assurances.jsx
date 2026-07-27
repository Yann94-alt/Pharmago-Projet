import { useEffect, useState } from 'react'
import api from '../api/axios'
import { getErrorMessage } from '../api/errors'
import Loader from '../components/Loader'
import Alert from '../components/Alert'

const initialForm = { compagnie: '', numero_police: '', date_expiration: '', fichier: null }

export default function Assurances() {
  const [assurances, setAssurances] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)

  const fetchAssurances = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/assurances')
      setAssurances(data)
    } catch (err) {
      setError('Impossible de charger vos assurances.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssurances()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('compagnie', form.compagnie)
      formData.append('numero_police', form.numero_police)
      if (form.date_expiration) formData.append('date_expiration', form.date_expiration)
      if (form.fichier) formData.append('fichier', form.fichier)

      await api.post('/assurances', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setSuccess('Assurance ajoutée.')
      setForm(initialForm)
      fetchAssurances()
    } catch (err) {
      setError(getErrorMessage(err, "L'ajout de l'assurance a échoué."))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette assurance ?')) return
    try {
      await api.delete(`/assurances/${id}`)
      setAssurances((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      setError(getErrorMessage(err, 'La suppression a échoué.'))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-800">Mes assurances</h1>
        <p className="text-brand-500">Ajoutez vos compagnies d'assurance pour faciliter la prise en charge.</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <Alert type="error" onClose={() => setError('')}>{error}</Alert>
        <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Compagnie</label>
            <input required className="input" value={form.compagnie} onChange={(e) => setForm({ ...form, compagnie: e.target.value })} />
          </div>
          <div>
            <label className="label">Numéro de police</label>
            <input required className="input" value={form.numero_police} onChange={(e) => setForm({ ...form, numero_police: e.target.value })} />
          </div>
          <div>
            <label className="label">Date d'expiration</label>
            <input type="date" className="input" value={form.date_expiration} onChange={(e) => setForm({ ...form, date_expiration: e.target.value })} />
          </div>
          <div>
            <label className="label">Carte d'assurance (facultatif)</label>
            <input type="file" accept=".jpg,.jpeg,.png,.pdf" className="input" onChange={(e) => setForm({ ...form, fichier: e.target.files[0] })} />
          </div>
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full sm:w-auto">
          {submitting ? 'Ajout…' : 'Ajouter l\'assurance'}
        </button>
      </form>

      {loading ? (
        <Loader label="Chargement…" />
      ) : assurances.length === 0 ? (
        <div className="card text-center text-brand-500">Aucune assurance enregistrée.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assurances.map((a) => (
            <div key={a.id} className="card">
              <div className="mb-1 flex items-start justify-between">
                <h3 className="font-semibold text-brand-800">{a.compagnie}</h3>
                <button onClick={() => handleDelete(a.id)} className="text-xs text-red-500 hover:underline">
                  Supprimer
                </button>
              </div>
              <p className="text-sm text-brand-500">Police n° {a.numero_police}</p>
              {a.date_expiration && (
                <p className="mt-1 text-xs text-brand-400">
                  Expire le {new Date(a.date_expiration).toLocaleDateString('fr-FR')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
