import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  FiSearch, 
  FiMapPin, 
  FiPhone, 
  FiNavigation, 
  FiMap, 
  FiAlertCircle, 
  FiCompass,
  FiShoppingBag,
  FiX,
  FiUpload
} from 'react-icons/fi'
import { getPharmacies, getNearbyPharmacies, createReservation } from '../api/api'
import Alert from '../components/Alert'
import { usePharmacy } from "../context/PharmacyContext"
import { captureLocation } from '../utils/geolocation'

export default function Pharmacies() {
  const navigate = useNavigate()

  const {
    search,
    setSearch,
    coords,
    setCoords,
    pharmacies,
    setPharmacies
  } = usePharmacy()

  // État local pour le filtre actif : 'all' (Toutes les pharmacies) ou 'proches' (Pharmacies de garde proches)
  const [activeTab, setActiveTab] = useState('all') 
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState('')

  // États pour la gestion de la modale de réservation (pharmacie_id, ordonnance [file], note)
  const [selectedPharmacyForBooking, setSelectedPharmacyForBooking] = useState(null)
  const [bookingNote, setBookingNote] = useState('')
  const [bookingFile, setBookingFile] = useState(null)
  const [submittingBooking, setSubmittingBooking] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState('')

  // Redirection vers la carte interactive
  const handleOpenLocalMap = (e, pharmacie) => {
    e.preventDefault()
    e.stopPropagation()

    if (pharmacie.latitude && pharmacie.longitude) {
      const userParam = coords?.lat && coords?.lng ? `&userLat=${coords.lat}&userLng=${coords.lng}` : ''
      navigate(`/carte?lat=${pharmacie.latitude}&lng=${pharmacie.longitude}&id=${pharmacie.id}&mode=nearby${userParam}`)
    } else {
      navigate(`/pharmacies/${pharmacie.id}`)
    }
  }

  // Ouvrir la modale de réservation pour une pharmacie spécifique
  const handleOpenBookingModal = (e, pharmacie) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedPharmacyForBooking(pharmacie)
    setBookingNote('')
    setBookingFile(null)
    setBookingSuccess('')
    setError('')
  }

  // Soumettre la réservation avec FormData (car on envoie un fichier)
  const handleSubmiReservation = async (e) => {
    e.preventDefault()
    if (!selectedPharmacyForBooking) return

    setSubmittingBooking(true)
    setError('')
    setBookingSuccess('')

    try {
      const formData = new FormData()
      formData.append('pharmacie_id', selectedPharmacyForBooking.id)
      if (bookingFile) formData.append('ordonnance', bookingFile)
      if (bookingNote) formData.append('note', bookingNote)

      await createReservation(formData)

      setBookingSuccess('Votre ordonnance a bien été envoyée.')
      setTimeout(() => {
        setSelectedPharmacyForBooking(null)
      }, 2000)
    } catch (err) {
      console.error("Erreur lors de la réservation :", err)
      setError(err.response?.data?.message || 'Une erreur est survenue lors de l\'envoi de l\'ordonnance.')
    } finally {
      setSubmittingBooking(false)
    }
  }

  // Activer la géolocalisation utilisateur
  const requestLocation = useCallback(async () => {
    setLocating(true)
    setError('')
    try {
      const loc = await captureLocation()
      setCoords(loc)
      return loc
    } catch (err) {
      console.error("Erreur Géolocalisation:", err)
      setError("Impossible d'accéder à votre position GPS. Veuillez vérifier vos autorisations.")
      return null
    } finally {
      setLocating(false)
    }
  }, [setCoords])

  // Chargement des pharmacies selon l'onglet actif
  const fetchPharmacies = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      if (activeTab === 'proches') {
        let currentCoords = coords
        
        if (!currentCoords?.lat || !currentCoords?.lng) {
          currentCoords = await requestLocation()
        }

        if (currentCoords?.lat && currentCoords?.lng) {
          const { data } = await getNearbyPharmacies({
            lat: currentCoords.lat,
            lng: currentCoords.lng,
            rayon: 50
          })

          let resultats = Array.isArray(data) ? data : (data.pharmacies || data.data || [])
          resultats = resultats.filter(p => p.distance !== undefined && p.distance !== null && Number(p.distance) <= 50)
          resultats.sort((a, b) => Number(a.distance) - Number(b.distance))
          
          setPharmacies(resultats)
        } else {
          setPharmacies([])
          setError("Impossible de déterminer votre position pour afficher les pharmacies de garde proches.")
        }
      } else {
        const { data } = await getPharmacies()
        const resultats = Array.isArray(data) ? data : (data.pharmacies || data.data || [])
        setPharmacies(resultats)
      }
    } catch (err) {
      console.error("Erreur de chargement:", err)
      setError('Impossible de charger la liste des pharmacies pour le moment.')
    } finally {
      setLoading(false)
    }
  }, [activeTab, coords, requestLocation, setPharmacies])

  useEffect(() => {
    fetchPharmacies()
  }, [fetchPharmacies])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    if (tab === 'proches' && (!coords?.lat || !coords?.lng)) {
      requestLocation()
    }
  }

  const safePharmacies = Array.isArray(pharmacies) ? pharmacies : []
  const filtered = safePharmacies.filter((p) => {
    const query = (search || '').toLowerCase().trim()
    if (!query) return true
    return (
      p.nom?.toLowerCase().includes(query) ||
      p.adresse?.toLowerCase().includes(query) ||
      p.ville?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="min-h-screen bg-slate-50/80 pb-20">
      <div className="relative overflow-hidden bg-gradient-to-b from-emerald-500/10 via-emerald-50/30 to-slate-50/80 pt-12 pb-16 border-b border-slate-200/60">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none overflow-hidden">
          <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl" />
          <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 bg-teal-300/20 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 mb-4 border border-emerald-200 shadow-sm">
              <FiCompass className="w-3.5 h-3.5 text-emerald-600" />
              Réseau Officiel PharmaGo
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
              Trouvez votre <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">Pharmacie</span>
            </h1>
            <p className="mt-3 text-sm sm:text-base text-slate-600 font-medium">
              Consultez les pharmacies inscrites ou localisez les officines de garde à proximité.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="relative bg-white rounded-2xl shadow-lg shadow-emerald-950/5 border border-slate-200/80 p-2 transition-all focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10">
              <div className="relative flex items-center">
                <FiSearch className="absolute left-4 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  className="w-full pl-12 pr-4 py-3.5 bg-transparent text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none"
                  placeholder="Rechercher par nom de pharmacie, quartier ou ville..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {error && (
          <div className="mb-6">
            <Alert type="error" onClose={() => setError('')}>
              {error}
            </Alert>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => handleTabChange('all')}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'all'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-transparent text-slate-600 hover:bg-slate-100/80'
              }`}
            >
              <span>Pharmacies</span>
            </button>

            <button
              onClick={() => handleTabChange('proches')}
              disabled={locating}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'proches'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-transparent text-slate-600 hover:bg-slate-100/80'
              }`}
            >
              <FiNavigation className={`w-4 h-4 ${locating ? 'animate-spin' : ''}`} />
              <span>{locating ? 'Localisation...' : 'Pharmacies proches'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-100/80 px-3.5 py-2 rounded-xl w-full sm:w-auto justify-center">
            <FiMapPin className="text-emerald-600 w-4 h-4" />
            <span>
              {activeTab === 'proches' ? 'Pharmacies de garde à proximité' : 'Liste générale des pharmacies'}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm animate-pulse space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-xl bg-slate-100" />
                  <div className="w-24 h-6 rounded-full bg-slate-100" />
                </div>
                <div className="space-y-2">
                  <div className="h-5 bg-slate-100 rounded-md w-3/4" />
                  <div className="h-4 bg-slate-100 rounded-md w-full" />
                </div>
                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                  <div className="h-4 bg-slate-100 rounded-md w-1/3" />
                  <div className="h-8 bg-slate-100 rounded-xl w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-sm max-w-md mx-auto my-12">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100">
              <FiAlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Aucune pharmacie trouvée
            </h3>
            <p className="text-sm text-slate-500">
              {search 
                ? `Aucun résultat ne correspond à "${search}".` 
                : activeTab === 'proches' 
                  ? "Aucune pharmacie de garde n'a été trouvée dans votre périmètre." 
                  : "Aucune pharmacie enregistrée pour le moment."}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="group relative bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:shadow-emerald-950/5 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xl shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                      <FiMap className="w-6 h-6" />
                    </div>

                    {p.distance !== undefined && p.distance !== null && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-xs">
                        <FiNavigation className="w-3 h-3 text-emerald-600" />
                        {Number(p.distance).toFixed(1)} km
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-1 mb-2">
                    {p.nom}
                  </h3>

                  <div className="flex items-start gap-2 text-sm text-slate-500 mb-4 line-clamp-2">
                    <FiMapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      {p.ville ? <strong className="text-slate-700 font-semibold">{p.ville}</strong> : null}
                      {p.ville && p.adresse ? ' — ' : ''}
                      {p.adresse || 'Adresse non communiquée'}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                    <FiPhone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{p.telephone || 'Non renseigné'}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => handleOpenLocalMap(e, p)}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all active:scale-95 shrink-0"
                      title="Voir l'emplacement sur la carte interactive"
                    >
                      <FiMap className="w-3.5 h-3.5 text-slate-600" />
                      <span>Carte</span>
                    </button>

                    {activeTab === 'all' && (
                      <button
                        type="button"
                        onClick={(e) => handleOpenBookingModal(e, p)}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all active:scale-95 shrink-0"
                        title="Envoyer une ordonnance à cette pharmacie"
                      >
                        <FiShoppingBag className="w-3.5 h-3.5" />
                        <span>Réserver</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modale de Réservation (Ordonnance fichier + note) */}
      {selectedPharmacyForBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Réservation</span>
                <h3 className="text-lg font-black text-slate-900">{selectedPharmacyForBooking.nom}</h3>
              </div>
              <button
                onClick={() => setSelectedPharmacyForBooking(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            {bookingSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <FiShoppingBag className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-emerald-700">{bookingSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmiReservation} className="space-y-4">
                {error && (
                  <Alert type="error" onClose={() => setError('')}>
                    {error}
                  </Alert>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <FiUpload className="w-3.5 h-3.5 text-emerald-600" />
                    Ordonnance (JPG, PNG, PDF - Max 5Mo) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    required
                    accept="image/jpeg,image/png,image/jpg,application/pdf"
                    onChange={(e) => setBookingFile(e.target.files[0])}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Note ou instructions (optionnel)</label>
                  <textarea
                    rows="3"
                    value={bookingNote}
                    onChange={(e) => setBookingNote(e.target.value)}
                    placeholder="Précisez vos besoins ou instructions..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium resize-none"
                  ></textarea>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedPharmacyForBooking(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submittingBooking}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
                  >
                    {submittingBooking ? 'Envoi en cours...' : 'Envoyer l\'ordonnance'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}