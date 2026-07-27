import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import { getErrorMessage } from '../api/errors'
import { useAuth } from '../context/AuthContext'
import Loader from '../components/Loader'
import Alert from '../components/Alert'

const initialMed = { nom: '', description: '', prix_marche: '', categorie: '' }

export default function PharmacyDashboard() {
  const { user } = useAuth()
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [medForm, setMedForm] = useState(initialMed)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const { data } = await api.get('/reservations')
        setReservations(data.data || [])
      } catch (err) {
        setError(getErrorMessage(err, 'Impossible de charger vos réservations.'))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const counts = reservations.reduce((acc, r) => {
    acc[r.statut] = (acc[r.statut] || 0) + 1
    return acc
  }, {})

  const handleAddMedicament = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)
    try {
      await api.post('/medicaments', medForm)
      setSuccess(`"${medForm.nom}" a été ajouté au catalogue.`)
      setMedForm(initialMed)
    } catch (err) {
      setError(getErrorMessage(err, "L'ajout du médicament a échoué."))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-800">
          Tableau de bord — {user?.pharmacie?.nom || 'Mon Officine'}
        </h1>
        <p className="text-brand-500">Vue d'ensemble de votre activité.</p>
      </div>

      <Alert type="error" onClose={() => setError('')}>{error}</Alert>
      <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>

      {loading ? (
        <Loader label="Chargement des statistiques…" />
      ) : (
        <div className="grid grid-cols-5 gap-2">
          {[
            ['en_attente', 'En attente'],
            ['acceptee', 'Acceptées'],
            ['prete', 'Prêtes'],
            ['remise', 'Remises'],
            ['annulee', 'Annulées'],
          ].map(([key, label]) => (
            <div key={key} className="card text-center p-2">
              <p className="text-xl font-bold text-brand-700">{counts[key] || 0}</p>
              <p className="text-[10px] text-brand-500">{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Link to="/reservations" className="btn-outline text-sm">Voir réservations</Link>
        <Link to="/scanner" className="btn-outline text-sm">Scanner QR code</Link>
        <Link to="/mon-officine" className="btn-outline text-sm">Modifier officine</Link>
      </div>

      <div className="card space-y-3">
        <h2 className="font-display text-lg font-semibold text-brand-800">Ajouter un médicament au catalogue</h2>

        <form onSubmit={handleAddMedicament} className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Nom</label>
            <input required className="input" value={medForm.nom} onChange={(e) => setMedForm({ ...medForm, nom: e.target.value })} />
          </div>
          <div>
            <label className="label">Catégorie</label>
            <input className="input" value={medForm.categorie} onChange={(e) => setMedForm({ ...medForm, categorie: e.target.value })} />
          </div>
          <div>
            <label className="label">Prix de référence (FCFA)</label>
            <input type="number" step="0.01" min="0" className="input" value={medForm.prix_marche} onChange={(e) => setMedForm({ ...medForm, prix_marche: e.target.value })} />
          </div>
          <div>
            <label className="label">Description</label>
            <input className="input" value={medForm.description} onChange={(e) => setMedForm({ ...medForm, description: e.target.value })} />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary sm:col-span-2">
            {submitting ? 'Ajout…' : 'Ajouter au catalogue'}
          </button>
        </form>
      </div>
    </div>
  )
}