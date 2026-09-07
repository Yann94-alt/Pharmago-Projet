import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import Loader from '../components/Loader'
import Alert from '../components/Alert'
import { getMedicaments } from '../api/api.js'
import { getMedicamentsPharmacie } from '../api/api.js'

import {
  FiArrowLeft,
  FiUser,
  FiFileText,
  FiCreditCard,
  FiEye,
  FiX,
  FiPlus,
  FiTrash2,
  FiSearch,
  FiChevronDown,
  FiClipboard,
  FiAlertTriangle,
  FiCheckCircle,
  FiSend
} from 'react-icons/fi'

/*
|--------------------------------------------------------------------------
| DESIGN TOKENS
|--------------------------------------------------------------------------
*/

const INK = 'text-[#0B4F4A]'
const INK_BG = 'bg-[#0B4F4A]'
const INK_SOFT_BG = 'bg-[#E9F2F1]'
const RING = 'focus:ring-2 focus:ring-[#0B4F4A]/40 focus:border-[#0B4F4A]'

/*
|--------------------------------------------------------------------------
| STATUTS (Alignés strictement avec l'ENUM MySQL de la table reservations)
|--------------------------------------------------------------------------
*/
const STATUTS = {
  en_attente: {
    label: 'En attente',
    dot: 'bg-slate-400',
    classes: 'bg-slate-100 text-slate-700'
  },

  verification: {
    label: 'À vérifier',
    dot: 'bg-amber-500',
    classes: 'bg-amber-100 text-amber-700'
  },

  attente_confirmation: {
    label: 'En attente de confirmation',
    dot: 'bg-sky-500',
    classes: 'bg-sky-100 text-sky-700'
  },

  confirmee: {
    label: 'Confirmée',
    dot: 'bg-emerald-500',
    classes: 'bg-emerald-100 text-emerald-700'
  },

  prete: {
    label: 'Prête',
    dot: 'bg-sky-500',
    classes: 'bg-sky-100 text-sky-700'
  },

  remise: {
    label: 'Remise',
    dot: 'bg-slate-400',
    classes: 'bg-slate-200 text-slate-600'
  },

  annulee: {
    label: 'Annulée',
    dot: 'bg-rose-500',
    classes: 'bg-rose-100 text-rose-700'
  }
}

function statutInfo(statut) {
  return STATUTS[statut] || { label: statut, dot: 'bg-slate-400', classes: 'bg-slate-100 text-slate-700' }
}

/*
|--------------------------------------------------------------------------
| SOUS-COMPOSANTS UTILES
|--------------------------------------------------------------------------
*/
function SectionEyebrow({ icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl ${INK_SOFT_BG} ${INK} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div>
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="py-2.5 flex justify-between text-sm">
      <span className="text-slate-500 font-medium">{label}</span>
      <span className="text-slate-900 font-semibold text-right">{value || 'N/A'}</span>
    </div>
  )
}

function DocumentChip({ title, subtitle, icon, available, loading, accent, onClick }) {
  return (
    <button
      type="button"
      disabled={!available || loading}
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border border-slate-200 bg-white transition flex items-center justify-between border-l-4 ${accent} ${
        available ? 'hover:bg-slate-50 cursor-pointer' : 'opacity-50 cursor-not-allowed'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="text-slate-600">{icon}</div>
        <div>
          <p className="text-sm font-bold text-slate-900">{title}</p>
          <p className="text-xs text-slate-500">{available ? subtitle : 'Non fourni'}</p>
        </div>
      </div>
      <FiEye className={`text-slate-400 ${available ? 'opacity-100' : 'opacity-0'}`} />
    </button>
  )
}

function ToggleChip({ checked, onChange, labelOn, labelOff, colorOn, colorOff }) {
  return (
    <div className="flex rounded-xl overflow-hidden border border-slate-200 p-0.5 bg-slate-100">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
          checked ? `${colorOn} shadow-sm` : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        {labelOn}
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
          !checked ? `${colorOff} shadow-sm` : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        {labelOff}
      </button>
    </div>
  )
}

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
  const [documentMimeType, setDocumentMimeType] = useState(null)

  const [listeMedicaments, setListeMedicaments] = useState([])
  const [chargementMedicaments, setChargementMedicaments] = useState(false)

  const [medicaments, setMedicaments] = useState([
    {
      medicament_id: null,
      nom: '',
      quantite: 1,
      prix: 0,
      disponible: true,
      sur_bon: false,
      recherche: '',
      afficherListe: false
    }
  ])

  const [montantAssurance, setMontantAssurance] = useState(0)

  useEffect(() => {
    fetchReservation()
    fetchMedicaments()
  }, [id])

  const fetchReservation = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await api.get(`/pharmacies/reservations/${id}`)
      const data = response.data.data || response.data

      setReservation(data)

      if (data.medicaments && Array.isArray(data.medicaments) && data.medicaments.length > 0) {
        setMedicaments(
          data.medicaments.map((m) => ({
            medicament_id: m.id || m.medicament_id || m.pivot?.medicament_id || null,
            nom: m.nom || '',
            quantite: m.pivot?.quantite || m.quantite || 1,
            prix: m.pivot?.prix_unitaire ?? m.prix ?? m.prix_marche ?? 0,
            disponible: m.pivot?.disponible !== undefined ? Boolean(m.pivot.disponible) : true,
            sur_bon: m.pivot?.sur_bon !== undefined ? Boolean(m.pivot.sur_bon) : false,
            recherche: m.nom || '',
            afficherListe: false
          }))
        )
      }

      if (data.montant_assurance !== undefined) {
        setMontantAssurance(data.montant_assurance || 0)
      }

    } catch (err) {
      console.error('Erreur réservation :', err)
      setError(err.response?.data?.message || 'Impossible de récupérer la réservation.')
    } finally {
      setLoading(false)
    }

    try {
      await fetchDocuments()
    } catch (e) {
      console.error('Erreur non bloquante sur les documents', e)
    }
  }

  const fetchMedicaments = async () => {
  try {
    setChargementMedicaments(true)

    const response = await getMedicamentsPharmacie()

    const data = response.data?.data || []

    setListeMedicaments(
      Array.isArray(data) ? data : []
    )

  } catch (err) {
    console.error('Erreur chargement médicaments :', err)

    setError(
      err.response?.data?.message ||
      'Impossible de charger la liste des médicaments.'
    )
  } finally {
    setChargementMedicaments(false)
  }
}

  const fetchDocuments = async () => {
    try {
      const response = await api.get(`/pharmacies/reservations/${id}/documents`)
      setDocuments(response.data)
    } catch (err) {
      console.error('Erreur documents :', err)
      setError(err.response?.data?.message || 'Impossible de récupérer les documents.')
    }
  }

  const ouvrirDocument = async (type) => {
    try {
      setDocumentLoading(true)
      setError(null)

      const response = await api.get(`/pharmacies/reservations/${id}/documents/${type}`, {
        responseType: 'blob'
      })

      const mimeType = response.data.type
      setDocumentMimeType(mimeType)

      const url = URL.createObjectURL(response.data)
      setDocumentUrl(url)
      setDocumentType(type)
    } catch (err) {
      console.error('Erreur document :', err)
      setError(err.response?.data?.message || 'Impossible de charger le document.')
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
    setDocumentMimeType(null)
  }

  const montantTotal = useMemo(() => {
  return medicaments.reduce((acc, med) => {
    // Un médicament indisponible ne compte pas dans le montant
    if (!med.disponible) {
      return acc
    }

    const qte = parseFloat(med.quantite) || 0
    const prix = parseFloat(med.prix) || 0

    return acc + qte * prix
  }, 0)
}, [medicaments])


  const assurance = parseFloat(montantAssurance) || 0

  const restePatient = useMemo(() => {
    return Math.max(0, montantTotal - assurance)
  }, [montantTotal, assurance])

  const medicamentsSurBon = useMemo(
    () => medicaments.filter((m) => m.sur_bon).length,
    [medicaments]
  )

  const handleMedicamentChange = (index, field, value) => {
    setMedicaments((prev) =>
      prev.map((med, i) => (i === index ? { ...med, [field]: value } : med))
    )
  }

  const rechercherMedicament = (index, value) => {
    setMedicaments((prev) =>
      prev.map((med, i) => {
        if (i !== index) return med
        return {
          ...med,
          recherche: value,
          nom: value,
          medicament_id: null,
          afficherListe: true
        }
      })
    )
  }

  const getMedicamentsFiltres = (recherche) => {
    const texte = (recherche || '').trim().toLowerCase()
    if (!texte) return listeMedicaments

    return listeMedicaments.filter((med) => {
      const nom = (med.nom || '').toLowerCase()
      const description = (med.description || '').toLowerCase()
      const categorie = (med.categorie || '').toLowerCase()
      return nom.includes(texte) || description.includes(texte) || categorie.includes(texte)
    })
  }

  const selectionnerMedicament = (index, medicament) => {
    setMedicaments((prev) =>
      prev.map((med, i) => {
        if (i !== index) return med
        return {
          ...med,
          medicament_id: medicament.id,
          nom: medicament.nom || '',
          recherche: medicament.nom || '',
          prix: medicament.prix_marche ?? 0,
          afficherListe: false
        }
      })
    )
  }

  const ouvrirListe = (index) => {
    setMedicaments((prev) =>
      prev.map((med, i) =>
        i === index ? { ...med, afficherListe: true } : { ...med, afficherListe: false }
      )
    )
  }

  const fermerToutesLesListes = () => {
    setMedicaments((prev) =>
      prev.map((med) => ({
        ...med,
        afficherListe: false
      }))
    )
  }

  const ajouterMedicament = () => {
    setMedicaments((prev) => [
      ...prev,
      {
        medicament_id: null,
        nom: '',
        quantite: 1,
        prix: 0,
        disponible: true,
        sur_bon: false,
        recherche: '',
        afficherListe: false
      }
    ])
  }

  const supprimerMedicament = (index) => {
    setMedicaments((prev) => prev.filter((_, i) => i !== index))
  }

  const validerFormulaire = () => {
    if (medicaments.length === 0) {
      setError('Veuillez ajouter au moins un médicament.')
      return false
    }

    for (let i = 0; i < medicaments.length; i++) {
      const med = medicaments[i]

      if (!med.medicament_id) {
        setError(`Veuillez sélectionner un médicament valide dans la base pour la ligne n°${i + 1}.`)
        return false
      }

      if (!med.nom?.trim()) {
        setError(`Le nom du médicament n°${i + 1} est obligatoire.`)
        return false
      }

      if (Number(med.quantite) < 1) {
        setError(`La quantité du médicament n°${i + 1} doit être supérieure ou égale à 1.`)
        return false
      }

      if (Number(med.prix) < 0) {
        setError(`Le prix du médicament n°${i + 1} ne peut pas être négatif.`)
        return false
      }
    }

    if (assurance > montantTotal) {
      setError("Le montant de l'assurance ne peut pas dépasser le montant total.")
      return false
    }

    if (medicamentsSurBon > 0 && !documents?.bon) {
      setError(
        "Au moins un médicament est marqué « sur bon » mais le patient n'a fourni aucune photo du bon. Vérifiez avant d'envoyer la proposition."
      )
      return false
    }

    return true
  }

  const handleSubmitProposition = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    fermerToutesLesListes()

    if (!validerFormulaire()) {
      return
    }

    const payload = {
      medicaments: medicaments.map((m) => ({
        medicament_id: Number(m.medicament_id),
        quantite: parseInt(m.quantite, 10),
        prix_unitaire: parseFloat(m.prix),
        disponible: Boolean(m.disponible),
        sur_bon: Boolean(m.sur_bon)
      })),
      montant_total: Number(montantTotal.toFixed(2)),
      montant_assurance: Number(assurance.toFixed(2)),
      reste_patient: Number(restePatient.toFixed(2))
    }

    try {
      setSubmitting(true)
      const response = await api.post(`/pharmacies/reservations/${id}/proposition`, payload)

      setSuccess(response.data?.message || 'Analyse envoyée avec succès au patient !')

      if (response.data?.data) {
        setReservation(response.data.data)
      }

      setTimeout(() => {
        navigate('/pharmacie/dashboard')
      }, 2000)
    } catch (err) {
  console.error('ERREUR COMPLETE :', err.response?.data)
  console.error('ERREUR AXIOS :', err)

  const errorData = err.response?.data

  if (errorData?.errors) {
    const messages = Object.values(errorData.errors)
      .flat()
      .join(' ')

    setError(messages)
  } else {
    setError(
      errorData?.error ||
      errorData?.message ||
      "Une erreur est survenue lors de l'analyse de la réservation."
    )
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
        <Alert type="error" message={error || 'Réservation introuvable.'} />
      </div>
    )
  }

  const user = reservation.user
  const beneficiaire = reservation.beneficiaire
  const ordonnanceDisponible = !!documents?.ordonnance
  const assuranceDisponible = !!documents?.carte_assurance
  const bonDisponible = !!documents?.bon

  // Vérification basée sur le statut réel de la base de données
 const peutModifier =
  reservation.statut === 'en_attente' ||
  reservation.statut === 'verification'
  const badge = statutInfo(reservation.statut)

  return (
    <div className="min-h-screen bg-[#F7F5F1] p-4 sm:p-6" onClick={fermerToutesLesListes}>
      <div className="max-w-6xl mx-auto space-y-5">
        {/* EN-TÊTE */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="w-10 h-10 shrink-0 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition"
                aria-label="Retour"
              >
                <FiArrowLeft />
              </button>
              <div>
                <p className={`text-[11px] font-bold uppercase tracking-wider ${INK} opacity-70`}>
                  Réservation #{reservation.id}
                </p>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                  Traitement de l'ordonnance
                </h1>
              </div>
            </div>

            <span
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide shrink-0 ${badge.classes}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
              {badge.label}
            </span>
          </div>
        </div>

        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}

        {!peutModifier && (
          <div className="flex items-start gap-3 bg-sky-50 border border-sky-200 text-sky-900 rounded-2xl p-4 text-sm">
            <FiAlertTriangle className="mt-0.5 shrink-0" />
            <span>
              Cette réservation n'est plus en attente (statut actuel : « {badge.label} »). Le formulaire
              ci-dessous est affiché en lecture seule.
            </span>
          </div>
        )}

        {/* PATIENT / BÉNÉFICIAIRE */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 sm:p-6">
            <SectionEyebrow icon={<FiUser />} title="Patient" subtitle="Demandeur de la réservation" />
            <dl className="mt-4 divide-y divide-slate-100">
              <InfoRow label="Nom" value={user?.nom} />
              <InfoRow label="Prénom" value={user?.prenom} />
              <InfoRow label="Email" value={user?.email} />
              <InfoRow label="Téléphone" value={user?.telephone} />
            </dl>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 sm:p-6">
            <SectionEyebrow icon={<FiUser />} title="Bénéficiaire" subtitle="Personne concernée par l'ordonnance" />
            {beneficiaire ? (
              <dl className="mt-4 divide-y divide-slate-100">
                <InfoRow label="Nom" value={beneficiaire.nom} />
                <InfoRow label="Prénom" value={beneficiaire.prenom} />
              </dl>
            ) : (
              <div className="mt-4 p-4 rounded-xl bg-slate-50 text-slate-500 text-sm">
                Réservation pour le patient lui-même.
              </div>
            )}
          </div>
        </div>

        {/* NOTE DU PATIENT */}
        {reservation.note && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 sm:p-6">
            <SectionEyebrow icon={<FiClipboard />} title="Note du patient" subtitle="Message laissé à la réservation" />
            <p className="mt-4 text-sm text-slate-700 bg-amber-50 border border-amber-100 rounded-xl p-4 whitespace-pre-wrap leading-relaxed">
              {reservation.note}
            </p>
          </div>
        )}

        {/* DOCUMENTS */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 sm:p-6">
          <SectionEyebrow
            icon={<FiFileText />}
            title="Documents fournis"
            subtitle="Consultez les pièces envoyées par le patient"
          />
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <DocumentChip
              title="Ordonnance"
              subtitle="Obligatoire"
              icon={<FiFileText />}
              available={ordonnanceDisponible}
              loading={documentLoading}
              accent="border-l-[#0B4F4A]"
              onClick={() => ouvrirDocument('ordonnance')}
            />
            <DocumentChip
              title="Assurance / CMU"
              subtitle="Facultatif"
              icon={<FiCreditCard />}
              available={assuranceDisponible}
              loading={documentLoading}
              accent="border-l-sky-500"
              onClick={() => ouvrirDocument('assurance')}
            />
            <DocumentChip
              title="Photo du bon"
              subtitle="Facultatif"
              icon={<FiFileText />}
              available={bonDisponible}
              loading={documentLoading}
              accent="border-l-amber-500"
              onClick={() => ouvrirDocument('bon')}
            />
          </div>
        </div>

        {/* FORMULAIRE D'ANALYSE */}
        <form
          onSubmit={handleSubmitProposition}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 sm:p-6 space-y-6"
        >
          <SectionEyebrow
            icon={<FiCheckCircle />}
            title="Analyse de l'ordonnance"
            subtitle="Sélectionnez les médicaments dans la base, leur disponibilité et s'ils sont pris sur bon"
          />

          <fieldset disabled={!peutModifier || submitting} className="space-y-4 disabled:opacity-60">
            <div className="space-y-3">
              {medicaments.map((med, index) => {
                const medicamentsFiltres = getMedicamentsFiltres(med.recherche)

                return (
                  <div
                    key={index}
                    className="bg-[#FAF9F6] p-4 rounded-2xl border border-slate-200"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
                      <div className="lg:col-span-4 relative">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                          Médicament
                        </label>
                        <div className="relative">
                          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            value={med.recherche}
                            onFocus={() => ouvrirListe(index)}
                            onChange={(e) => rechercherMedicament(index, e.target.value)}
                            placeholder="Rechercher dans la base..."
                            className={`w-full bg-white border rounded-xl pl-10 pr-10 py-2.5 text-sm outline-none transition ${RING} ${
                              med.medicament_id ? 'border-emerald-400' : 'border-rose-300'
                            }`}
                          />
                          <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>

                        {med.medicament_id ? (
                          <div className="mt-1 text-xs text-emerald-600 font-semibold">
                            ✓ Validé dans la base
                          </div>
                        ) : (
                          <div className="mt-1 text-xs text-rose-500 font-semibold">
                            Sélection obligatoire
                          </div>
                        )}

                        {med.afficherListe && (
                          <div
                            className="absolute z-40 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-80 overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {chargementMedicaments ? (
                              <div className="p-4 text-sm text-slate-500 text-center">
                                Chargement...
                              </div>
                            ) : medicamentsFiltres.length > 0 ? (
                              medicamentsFiltres.map((item) => (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => selectionnerMedicament(index, item)}
                                  className="w-full text-left px-4 py-3 hover:bg-[#E9F2F1] border-b border-slate-100 last:border-0 transition"
                                >
                                  <div className="font-semibold text-sm text-slate-800">{item.nom}</div>
                                  <div className="flex flex-wrap gap-2 mt-1 text-xs text-slate-500">
                                    {item.categorie && <span>{item.categorie}</span>}
                                    {item.unite && <span>• {item.unite}</span>}
                                    {item.prix_marche !== null && item.prix_marche !== undefined && (
                                      <span className="font-semibold text-emerald-600 tabular-nums">
                                        • {Number(item.prix_marche).toLocaleString()} FCFA
                                      </span>
                                    )}
                                  </div>
                                </button>
                              ))
                            ) : (
                              <div className="p-4">
                                <p className="text-sm text-slate-500">Aucun médicament trouvé.</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="lg:col-span-1">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                          Qté
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={med.quantite}
                          onChange={(e) => handleMedicamentChange(index, 'quantite', e.target.value)}
                          className={`w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm tabular-nums outline-none transition ${RING}`}
                          required
                        />
                      </div>

                      <div className="lg:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                          Prix unitaire
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={med.prix}
                          onChange={(e) => handleMedicamentChange(index, 'prix', e.target.value)}
                          className={`w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm tabular-nums outline-none transition ${RING}`}
                          required
                        />
                      </div>

                      <div className="lg:col-span-2 flex flex-col gap-1">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                          Disponibilité
                        </label>
                        <ToggleChip
                          checked={med.disponible}
                          onChange={(val) => handleMedicamentChange(index, 'disponible', val)}
                          labelOn="Disponible"
                          labelOff="Rupture"
                          colorOn="bg-emerald-50 text-emerald-700 border-emerald-300"
                          colorOff="bg-rose-50 text-rose-700 border-rose-300"
                        />
                      </div>

                      <div className="lg:col-span-2 flex flex-col gap-1">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                          Sur bon
                        </label>
                        <ToggleChip
                          checked={med.sur_bon}
                          onChange={(val) => handleMedicamentChange(index, 'sur_bon', val)}
                          labelOn="Sur bon"
                          labelOff="Non"
                          colorOn="bg-sky-50 text-sky-700 border-sky-300"
                          colorOff="bg-slate-100 text-slate-600 border-slate-300"
                        />
                      </div>

                      <div className="lg:col-span-1 flex items-center justify-end">
                        {peutModifier && medicaments.length > 1 && (
                          <button
                            type="button"
                            onClick={() => supprimerMedicament(index)}
                            className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition"
                            title="Supprimer cette ligne"
                          >
                            <FiTrash2 />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {peutModifier && (
              <button
                type="button"
                onClick={ajouterMedicament}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-300 text-slate-700 hover:border-[#0B4F4A] hover:text-[#0B4F4A] hover:bg-[#E9F2F1]/30 text-sm font-bold transition"
              >
                <FiPlus /> Ajouter un médicament
              </button>
            )}

            {/* SECTION FINANCIÈRE */}
            <div className="bg-[#FAF9F6] p-5 rounded-2xl border border-slate-200 space-y-4 mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Montant pris en charge par l'Assurance (FCFA)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={montantAssurance}
                    onChange={(e) => setMontantAssurance(e.target.value)}
                    className={`w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm tabular-nums outline-none transition ${RING}`}
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <div className="text-right space-y-1">
                    <div className="text-sm text-slate-500">
                      Montant total : <strong className="text-slate-900 tabular-nums">{montantTotal.toLocaleString()} FCFA</strong>
                    </div>
                    <div className="text-sm text-slate-500">
                      Reste à charge patient : <strong className={`${INK} tabular-nums text-base`}>{restePatient.toLocaleString()} FCFA</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </fieldset>

          {peutModifier && (
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={submitting}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl ${INK_BG} text-white font-bold text-sm shadow-sm hover:opacity-90 transition disabled:opacity-50`}
              >
                {submitting ? (
                  <>Chargement...</>
                ) : (
                  <>
                    <FiSend /> Envoyer la proposition au patient
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* VISIONNEUSE DE DOCUMENT MODAL */}
      {documentUrl && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 capitalize">
                Document : {documentType}
              </h3>
              <button
                type="button"
                onClick={fermerDocument}
                className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition"
              >
                <FiX />
              </button>
            </div>
            <div className="flex-1 bg-slate-900 flex items-center justify-center overflow-auto p-4">
              {documentMimeType?.includes('pdf') ? (
                <iframe
                  src={documentUrl}
                  title="Aperçu document PDF"
                  className="w-full h-full rounded-xl border border-slate-700"
                />
              ) : (
                <img
                  src={documentUrl}
                  alt="Aperçu document image"
                  className="max-h-full max-w-full object-contain rounded-xl"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}