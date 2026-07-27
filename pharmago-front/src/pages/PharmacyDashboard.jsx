import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import { getErrorMessage } from '../api/errors'
import { useAuth } from '../context/AuthContext'
import Loader from '../components/Loader'
import Alert from '../components/Alert'

export default function PharmacyDashboard() {
  console.log("🔥 PharmacyDashboard chargé");
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  
  // États des données du dashboard
  const [reservations, setReservations] = useState([])
  const [stats, setStats] = useState({
    enAttente: 0,
    enCours: 0,
    terminees: 0,
    chiffreAffaires: 0
  })

  // Modal ou vue détaillée pour analyser une réservation
  const [selectedReservation, setSelectedReservation] = useState(null)
  const [analysisForm, setAnalysisForm] = useState({
    medicaments: [],
    montant_total: '',
    montant_assurance: '',
    reste_patient: ''
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/pharmacies/reservations')
      const data = response.data.data || response.data
      setReservations(data)
      calculateStats(data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (data) => {
    let enAttente = 0
    let enCours = 0
    let terminees = 0
    let ca = 0

    data.forEach((res) => {
      if (res.statut === 'en_attente' || res.statut === 'attente_analyse') enAttente++
      if (['proposition', 'attente_identite', 'confirmee', 'prete'].includes(res.statut)) enCours++
      if (res.statut === 'remise') {
        terminees++
        ca += parseFloat(res.montant_total || 0)
      }
    })

    setStats({ enAttente, enCours, terminees, chiffreAffaires: ca })
  }

  const handleOpenAnalysis = (reservation) => {
    setSelectedReservation(reservation)
    // Pré-remplir le formulaire avec les médicaments de l'ordonnance ou vides
    setAnalysisForm({
      medicaments: reservation.ordonnance?.medicaments || [{ nom: '', quantite: 1, prix: 0, disponible: true }],
      montant_total: reservation.montant_total || '',
      montant_assurance: reservation.montant_assurance || '',
      reste_patient: reservation.reste_patient || ''
    })
  }

  const handleMedicamentChange = (index, field, value) => {
    const updatedMedicaments = [...analysisForm.medicaments]
    updatedMedicaments[index][field] = value
    setAnalysisForm({ ...analysisForm, medicaments: updatedMedicaments })
  }

  const addMedicamentRow = () => {
    setAnalysisForm({
      ...analysisForm,
      medicaments: [...analysisForm.medicaments, { nom: '', quantite: 1, prix: 0, disponible: true }]
    })
  }

  const removeMedicamentRow = (index) => {
    const updatedMedicaments = analysisForm.medicaments.filter((_, i) => i !== index)
    setAnalysisForm({ ...analysisForm, medicaments: updatedMedicaments })
  }

  const submitAnalysis = async (e) => {
    e.preventDefault()
    try {
      setError(null)
      await api.post(`/pharmacies/reservations/${selectedReservation.id}/proposition`, analysisForm)
      setSuccess('Proposition envoyée avec succès au patient.')
      setSelectedReservation(null)
      fetchDashboardData()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const handleUpdateStatus = async (id, newStatut) => {
    try {
      setError(null)
      await api.put(`/reservations/${id}/statut`, { statut: newStatut })
      setSuccess(`Statut mis à jour : ${newStatut}`)
      fetchDashboardData()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  if (loading) return <Loader />

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tableau de bord Pharmacie</h1>
          <p className="text-sm text-gray-500">Bienvenue, {user?.name || 'Pharmacien'}</p>
        </div>
        <button 
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition text-sm font-medium"
        >
          Rafraîchir
        </button>
      </div>

      {/* Alertes */}
      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

      {/* Statistiques Rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">À analyser / En attente</p>
          <p className="text-3xl font-bold text-amber-600 mt-2">{stats.enAttente}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">En cours de traitement</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{stats.enCours}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Ordonnances remises</p>
          <p className="text-3xl font-bold text-emerald-600 mt-2">{stats.terminees}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Chiffre d'affaires encaissé</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{stats.chiffreAffaires} FCFA</p>
        </div>
      </div>

      {/* Liste des Réservations */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Gestion des Réservations & Ordonnances</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="p-4">ID</th>
                <th className="p-4">Patient</th>
                <th className="p-4">Date</th>
                <th className="p-4">Statut</th>
                <th className="p-4">Montant Total</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {reservations.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-gray-400">
                    Aucune réservation trouvée pour le moment.
                  </td>
                </tr>
              ) : (
                reservations.map((res) => (
                  <tr key={res.id} className="hover:bg-gray-50/50 transition">
                    <td className="p-4 font-medium text-gray-900">#{res.id}</td>
                    <td className="p-4 text-gray-700">{res.user?.name || 'Patient inconnu'}</td>
                    <td className="p-4 text-gray-500">{new Date(res.created_at).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold 
                        ${res.statut === 'remise' ? 'bg-emerald-100 text-emerald-700' : 
                          res.statut === 'prete' ? 'bg-blue-100 text-blue-700' : 
                          res.statut === 'confirmee' ? 'bg-indigo-100 text-indigo-700' : 
                          res.statut === 'proposition' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                        {res.statut}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-gray-900">{res.montant_total ? `${res.montant_total} FCFA` : '-'}</td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenAnalysis(res)}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-xs font-medium"
                      >
                        Analyser / Proposer
                      </button>
                      {res.statut === 'confirmee' && (
                        <button
                          onClick={() => handleUpdateStatus(res.id, 'prete')}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-xs font-medium"
                        >
                          Marquer Prête
                        </button>
                      )}
                      {res.statut === 'prete' && (
                        <button
                          onClick={() => handleUpdateStatus(res.id, 'remise')}
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-xs font-medium"
                        >
                          Marquer Remise
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal d'analyse et proposition de devis */}
      {selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-6 my-8">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="text-xl font-bold text-gray-800">Analyser la réservation #{selectedReservation.id}</h3>
              <button 
                onClick={() => setSelectedReservation(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={submitAnalysis} className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Détails des médicaments</h4>
                {analysisForm.medicaments.map((med, index) => (
                  <div key={index} className="flex gap-2 items-center mb-2">
                    <input
                      type="text"
                      placeholder="Nom du médicament"
                      value={med.nom}
                      onChange={(e) => handleMedicamentChange(index, 'nom', e.target.value)}
                      className="border rounded-lg px-3 py-2 flex-1 text-sm"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Qté"
                      min="1"
                      value={med.quantite}
                      onChange={(e) => handleMedicamentChange(index, 'quantite', e.target.value)}
                      className="border rounded-lg px-3 py-2 w-20 text-sm"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Prix"
                      min="0"
                      step="0.01"
                      value={med.prix}
                      onChange={(e) => handleMedicamentChange(index, 'prix', e.target.value)}
                      className="border rounded-lg px-3 py-2 w-28 text-sm"
                      required
                    />
                    <label className="flex items-center text-xs gap-1">
                      <input
                        type="checkbox"
                        checked={med.disponible}
                        onChange={(e) => handleMedicamentChange(index, 'disponible', e.target.checked)}
                      />
                      Dispo
                    </label>
                    <button
                      type="button"
                      onClick={() => removeMedicamentRow(index)}
                      className="text-red-500 hover:text-red-700 font-bold px-2"
                    >
                      🗑
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addMedicamentRow}
                  className="mt-2 text-sm text-indigo-600 font-medium hover:underline"
                >
                  + Ajouter un médicament
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Montant Total</label>
                  <input
                    type="number"
                    step="0.01"
                    value={analysisForm.montant_total}
                    onChange={(e) => setAnalysisForm({ ...analysisForm, montant_total: e.target.value })}
                    className="border rounded-lg px-3 py-2 w-full text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Montant Assurance</label>
                  <input
                    type="number"
                    step="0.01"
                    value={analysisForm.montant_assurance}
                    onChange={(e) => setAnalysisForm({ ...analysisForm, montant_assurance: e.target.value })}
                    className="border rounded-lg px-3 py-2 w-full text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Reste Patient</label>
                  <input
                    type="number"
                    step="0.01"
                    value={analysisForm.reste_patient}
                    onChange={(e) => setAnalysisForm({ ...analysisForm, reste_patient: e.target.value })}
                    className="border rounded-lg px-3 py-2 w-full text-sm"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setSelectedReservation(null)}
                  className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 text-sm font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                >
                  Envoyer la proposition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}