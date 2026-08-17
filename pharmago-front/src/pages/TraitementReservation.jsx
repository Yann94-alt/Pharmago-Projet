import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import Loader from '../components/Loader'
import Alert from '../components/Alert'
import {
  FiArrowLeft,
  FiUser,
  FiFileText,
  FiCreditCard,
  FiEye,
  FiX,
  FiPlus,
  FiTrash2,
  FiCheck,
  FiDollarSign
} from 'react-icons/fi'

export default function TraitementReservation() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [reservation, setReservation] = useState(null)
  const [documents, setDocuments] = useState(null)

  const [loading, setLoading] = useState(true)
  const [documentLoading, setDocumentLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const [documentUrl, setDocumentUrl] = useState(null)
  const [documentType, setDocumentType] = useState(null)

  // États pour la partie Analyse
  const [medicaments, setMedicaments] = useState([
    { nom: '', quantite: 1, prix: 0, disponible: true, sur_bon: false }
  ])
  const [montantAssurance, setMontantAssurance] = useState(0)

  useEffect(() => {
    fetchReservation()
  }, [id])

  /*
  |--------------------------------------------------------------------------
  | Calculs automatiques
  |--------------------------------------------------------------------------
  */
  const montantTotal = medicaments.reduce((acc, med) => {
    const qte = parseFloat(med.quantite) || 0
    const prix = parseFloat(med.prix) || 0
    return acc + (qte * prix)
  }, 0)

  const restePatient = Math.max(0, montantTotal - (parseFloat(montantAssurance) || 0))

  /*
  |--------------------------------------------------------------------------
  | Récupérer la réservation
  |--------------------------------------------------------------------------
  */
  const fetchReservation = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await api.get(`/pharmacies/reservations/${id}`)
      const data = response.data.data || response.data
      setReservation(data)

      // Si la réservation possède déjà des médicaments (ex: ré-analyse), on les pré-remplit
      if (data.medicaments && data.medicaments.length > 0) {
        setMedicaments(
          data.medicaments.map((m) => ({
            nom: m.nom || '',
            quantite: m.quantite || 1,
            prix: m.prix || 0,
            disponible: m.disponible ?? true,
            sur_bon: m.sur_bon ?? false
          }))
        )
      }
      if (data.montant_assurance !== undefined) {
        setMontantAssurance(data.montant_assurance)
      }

      await fetchDocuments()
    } catch (err) {
      console.error('Erreur réservation :', err)
      setError(
        err.response?.data?.message ||
        'Impossible de récupérer la réservation.'
      )
    } finally {
      setLoading(false)
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Récupérer les documents
  |--------------------------------------------------------------------------
  */
  const fetchDocuments = async () => {
    try {
      const response = await api.get(`/pharmacies/reservations/${id}/documents`)
      setDocuments(response.data)
    } catch (err) {
      console.error('Erreur documents :', err)
      setError(
        err.response?.data?.message ||
        'Impossible de récupérer les documents.'
      )
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Ouvrir / Fermer un document
  |--------------------------------------------------------------------------
  */
  const ouvrirDocument = async (type) => {
    try {
      setDocumentLoading(true)
      setError(null)

      const response = await api.get(
        `/pharmacies/reservations/${id}/documents/${type}`,
        { responseType: 'blob' }
      )

      const url = URL.createObjectURL(response.data)
      setDocumentUrl(url)
      setDocumentType(type)
    } catch (err) {
      console.error('Erreur document :', err)
      setError(
        err.response?.data?.message ||
        'Impossible de charger le document.'
      )
    } finally {
      setDocumentLoading(false)
    }
  }

  const fermerDocument = () => {
    if (documentUrl) {
      URL.revokeObjectURL(documentUrl)
    }
    setDocumentUrl(null)
    setDocumentType(null)
  }

  /*
  |--------------------------------------------------------------------------
  | Gestion des médicaments
  |--------------------------------------------------------------------------
  */
  const handleMedicamentChange = (index, field, value) => {
    const updated = [...medicaments]
    updated[index][field] = value
    setMedicaments(updated)
  }

  const ajouterMedicament = () => {
    setMedicaments([
      ...medicaments,
      { nom: '', quantite: 1, prix: 0, disponible: true, sur_bon: false }
    ])
  }

  const supprimerMedicament = (index) => {
    setMedicaments(medicaments.filter((_, i) => i !== index))
  }

  /*
  |--------------------------------------------------------------------------
  | Soumission de la proposition
  |--------------------------------------------------------------------------
  */
  const handleSubmitProposition = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (medicaments.length === 0) {
      setError('Veuillez ajouter au moins un médicament.')
      return
    }

    // Validation basique des valeurs négatives
    for (const med of medicaments) {
      if (!med.nom.trim()) {
        setError('Le nom de chaque médicament est obligatoire.')
        return
      }
      if (Number(med.quantite) < 1 || Number(med.prix) < 0) {
        setError('Les quantités doivent être >= 1 et les prix >= 0.')
        return
      }
    }

    const payload = {
      medicaments: medicaments.map((m) => ({
        nom: m.nom,
        quantite: parseInt(m.quantite),
        prix: parseFloat(m.prix),
        disponible: Boolean(m.disponible),
        sur_bon: Boolean(m.sur_bon)
      })),
      montant_total: montantTotal,
      montant_assurance: parseFloat(montantAssurance) || 0,
      reste_patient: restePatient
    }

    try {
      setSubmitting(true)
      const response = await api.post(`/pharmacies/reservations/${id}/proposition`, payload)
      
      setSuccess('Proposition envoyée avec succès au patient !')
      if (response.data.data) {
        setReservation(response.data.data)
      }

      setTimeout(() => {
        navigate('/pharmacie/dashboard')
      }, 2000)
    } catch (err) {
      console.error('Erreur proposition :', err)
      const errorData = err.response?.data
      if (errorData?.errors) {
        // Concaténer les messages d'erreur de validation Laravel
        const messages = Object.values(errorData.errors).flat().join(' ')
        setError(messages)
      } else {
        setError(errorData?.message || "Une erreur est survenue lors de l'envoi de la proposition.")
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <Loader />
  }

  if (!reservation) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <Alert
          type="error"
          message={error || 'Réservation introuvable.'}
        />
      </div>
    )
  }

  const user = reservation.user
  const beneficiaire = reservation.beneficiaire

  const ordonnanceDisponible = !!documents?.ordonnance
  const assuranceDisponible = !!documents?.carte_assurance
  const identiteDisponible = !!documents?.carte_identite

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition"
              >
                <FiArrowLeft />
              </button>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900">
                  Traitement de la réservation #{reservation.id}
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Analyse de l'ordonnance et traitement de la demande
                </p>
              </div>
            </div>
            <span className="px-4 py-2 rounded-full bg-amber-100 text-amber-700 text-sm font-bold uppercase tracking-wide">
              {reservation.statut}
            </span>
          </div>
        </div>

        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}

        {/* INFORMATIONS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* PATIENT */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <FiUser />
              </div>
              <div>
                <h2 className="font-bold text-lg text-slate-900">Informations Patient</h2>
                <p className="text-sm text-slate-500">Informations du demandeur</p>
              </div>
            </div>
            <div className="space-y-3">
              <Info label="Nom" value={user?.nom} />
              <Info label="Prénom" value={user?.prenom} />
              <Info label="Email" value={user?.email} />
              <Info label="Téléphone" value={user?.telephone} />
            </div>
          </div>

          {/* BENEFICIAIRE */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="font-bold text-lg text-slate-900 mb-5">Bénéficiaire</h2>
            {beneficiaire ? (
              <div className="space-y-3">
                <Info label="Nom" value={beneficiaire.nom} />
                <Info label="Prénom" value={beneficiaire.prenom} />
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 text-slate-500 text-sm">
                Réservation pour le patient lui-même
              </div>
            )}
          </div>
        </div>

        {/* DOCUMENTS */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-900">Documents de la réservation</h2>
            <p className="text-sm text-slate-500 mt-1">
              Consultez les documents envoyés par le patient.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DocumentCard
              title="Ordonnance"
              icon={<FiFileText />}
              available={ordonnanceDisponible}
              loading={documentLoading}
              onClick={() => ouvrirDocument('ordonnance')}
            />
            <DocumentCard
              title="Carte d'assurance"
              icon={<FiCreditCard />}
              available={assuranceDisponible}
              loading={documentLoading}
              onClick={() => ouvrirDocument('assurance')}
            />
            <DocumentCard
              title="Pièce d'identité"
              icon={<FiCreditCard />}
              available={identiteDisponible}
              loading={documentLoading}
              onClick={() => ouvrirDocument('identite')}
            />
          </div>
        </div>

        {/* ANALYSE & FORMULAIRE */}
        <form onSubmit={handleSubmitProposition} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              Analyse de l'ordonnance & Proposition
            </h2>
            <p className="text-sm text-slate-500">
              Renseignez les médicaments prescrits, les prix unitaires, la disponibilité et l'application sur bon.
            </p>
          </div>

          <div className="space-y-4">
            {medicaments.map((med, index) => {
              const sousTotal = (parseFloat(med.quantite) || 0) * (parseFloat(med.prix) || 0)
              return (
                <div key={index} className="flex flex-col lg:flex-row gap-4 items-start lg:items-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Nom du médicament</label>
                    <input
                      type="text"
                      placeholder="Ex: Doliprane 1000mg"
                      value={med.nom}
                      onChange={(e) => handleMedicamentChange(index, 'nom', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div className="w-28">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Quantité</label>
                    <input
                      type="number"
                      min="1"
                      value={med.quantite}
                      onChange={(e) => handleMedicamentChange(index, 'quantite', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div className="w-36">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Prix unitaire</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={med.prix}
                      onChange={(e) => handleMedicamentChange(index, 'prix', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div className="flex flex-col justify-center">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Dispo</label>
                    <select
                      value={med.disponible ? 'true' : 'false'}
                      onChange={(e) => handleMedicamentChange(index, 'disponible', e.target.value === 'true')}
                      className={`bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold uppercase ${
                        med.disponible ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
                      }`}
                    >
                      <option value="true">Oui</option>
                      <option value="false">Non</option>
                    </select>
                  </div>

                  <div className="flex flex-col justify-center">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Sur bon</label>
                    <select
                      value={med.sur_bon ? 'true' : 'false'}
                      onChange={(e) => handleMedicamentChange(index, 'sur_bon', e.target.value === 'true')}
                      className={`bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold uppercase ${
                        med.sur_bon ? 'text-indigo-700 bg-indigo-50' : 'text-slate-600'
                      }`}
                    >
                      <option value="true">Oui</option>
                      <option value="false">Non</option>
                    </select>
                  </div>

                  <div className="w-32 text-right">
                    <span className="block text-xs font-bold text-slate-400 mb-1">Sous-total</span>
                    <span className="text-sm font-extrabold text-slate-800">{sousTotal.toLocaleString()} FCFA</span>
                  </div>

                  {medicaments.length > 1 && (
                    <button
                      type="button"
                      onClick={() => supprimerMedicament(index)}
                      className="w-9 h-9 mt-5 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition"
                      title="Supprimer"
                    >
                      <FiTrash2 />
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          <button
            type="button"
            onClick={ajouterMedicament}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition text-sm font-bold"
          >
            <FiPlus /> Ajouter un médicament
          </button>

          {/* RÉSUMÉ FINANCIER */}
          <div className="border-t border-slate-200 pt-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-slate-500 block mb-1">Montant Total</span>
              <span className="text-xl font-extrabold text-slate-900">{montantTotal.toLocaleString()} FCFA</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <label className="text-xs font-bold text-slate-500 block mb-1">Montant Assurance (FCFA)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={montantAssurance}
                onChange={(e) => setMontantAssurance(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
              <span className="text-xs font-bold text-emerald-700 block mb-1">Reste à payer Patient</span>
              <span className="text-xl font-extrabold text-emerald-900">{restePatient.toLocaleString()} FCFA</span>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition font-bold shadow-lg shadow-emerald-600/20 disabled:opacity-50"
            >
              <FiCheck />
              {submitting ? 'Envoi en cours...' : 'Envoyer la proposition au patient'}
            </button>
          </div>
        </form>

      </div>

      {/* MODAL DOCUMENT */}
      {documentUrl && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-lg">
                {documentType === 'ordonnance'
                  ? 'Ordonnance'
                  : documentType === 'assurance'
                    ? "Carte d'assurance"
                    : "Pièce d'identité"}
              </h3>
              <button
                onClick={fermerDocument}
                className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition"
              >
                <FiX />
              </button>
            </div>
            <div className="flex-1 bg-slate-100 p-4 flex items-center justify-center overflow-auto">
              {documentType === 'ordonnance' ? (
                <img
                  src={documentUrl}
                  alt="Ordonnance"
                  className="max-w-full max-h-full object-contain rounded-lg shadow"
                />
              ) : (
                <iframe
                  src={documentUrl}
                  title="Document"
                  className="w-full h-full rounded-lg bg-white"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-slate-100">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-800 text-right">{value || '-'}</span>
    </div>
  )
}

function DocumentCard({ title, icon, available, loading, onClick }) {
  return (
    <div className="border border-slate-200 rounded-2xl p-5 flex flex-col justify-between">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="font-bold text-slate-800">{title}</h3>
          <p className="text-xs text-slate-500">
            {available ? 'Document disponible' : 'Aucun document'}
          </p>
        </div>
      </div>
      {available ? (
        <button
          onClick={onClick}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition text-sm font-semibold disabled:opacity-50"
        >
          <FiEye />
          {loading ? 'Chargement...' : 'Voir le document'}
        </button>
      ) : (
        <div className="text-center text-sm text-slate-400 py-2">Non fourni</div>
      )}
    </div>
  )
}