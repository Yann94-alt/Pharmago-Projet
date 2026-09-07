import { useEffect, useState, useCallback, useRef } from 'react'
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
  FiUser,
  FiUsers,
  FiArrowLeft
} from 'react-icons/fi'

import {
  getPharmacies,
  getNearbyPharmacies,
  createReservation,
  createBeneficiaire
} from '../api/api'

import Alert from '../components/Alert'
import Loader from '../components/Loader'
import { usePharmacy } from '../context/PharmacyContext'
import { useAuth } from '../context/AuthContext'
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

  const {
    isAuthenticated,
    isPatient
  } = useAuth()

  // =========================================================
  // ÉTATS
  // =========================================================

  const [activeTab, setActiveTab] = useState('all')
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState('')

  const loadingRef = useRef(false)
  const initializedRef = useRef(false)

  // =========================================================
  // MODALE RÉSERVATION
  // =========================================================

  const [selectedPharmacyForBooking, setSelectedPharmacyForBooking] =
    useState(null)

  const [bookingStep, setBookingStep] = useState('who')

  const [bookingNote, setBookingNote] = useState('')
  const [bookingFile, setBookingFile] = useState(null)
  const [bookingInsuranceFile, setBookingInsuranceFile] = useState(null)
  const [bookingBonFile, setBookingBonFile] = useState(null)

  const [beneficiaryNom, setBeneficiaryNom] = useState('')
  const [beneficiaryPrenom, setBeneficiaryPrenom] = useState('')

  const [submittingBooking, setSubmittingBooking] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState('')

  // =========================================================
  // FERMER MODALE
  // =========================================================

  const closeBookingModal = () => {
    setSelectedPharmacyForBooking(null)
    setBookingStep('who')

    setBookingFile(null)
    setBookingInsuranceFile(null)
    setBookingBonFile(null)

    setBookingNote('')

    setBeneficiaryNom('')
    setBeneficiaryPrenom('')

    setBookingSuccess('')
    setError('')
  }

  // =========================================================
  // CARTE
  // =========================================================

  const handleOpenLocalMap = (e, pharmacie) => {
    e.preventDefault()
    e.stopPropagation()

    if (pharmacie.latitude && pharmacie.longitude) {
      const userParam =
        coords?.lat && coords?.lng
          ? `&userLat=${coords.lat}&userLng=${coords.lng}`
          : ''

      const source =
        activeTab === 'proches'
          ? 'garde'
          : 'partner'

      navigate(
        `/carte?lat=${pharmacie.latitude}&lng=${pharmacie.longitude}&id=${pharmacie.id}&mode=nearby&source=${source}${userParam}`
      )
    } else {
      navigate(`/pharmacies/${pharmacie.id}`)
    }
  }

  // =========================================================
  // OUVRIR MODALE RÉSERVATION
  // =========================================================

  const handleOpenBookingModal = (e, pharmacie) => {
  e.preventDefault()
  e.stopPropagation()

  if (!isAuthenticated) {
    navigate('/connexion')
    return
  }

  setSelectedPharmacyForBooking(pharmacie)

  setBookingStep('who')

  setBookingFile(null)
  setBookingInsuranceFile(null)
  setBookingBonFile(null)

  setBookingNote('')

  setBeneficiaryNom('')
  setBeneficiaryPrenom('')

  setBookingSuccess('')
  setError('')
}

  // =========================================================
  // RÉSERVATION
  // =========================================================

  const handleSubmitReservation = async (e) => {
    e.preventDefault()

    /*
    |--------------------------------------------------------------------------
    | DOUBLE SÉCURITÉ
    |--------------------------------------------------------------------------
    | Même si la modale est déjà ouverte, on vérifie encore
    | que l'utilisateur est connecté avant d'envoyer.
    |--------------------------------------------------------------------------
    */

    if (!isAuthenticated) {
      closeBookingModal()
      navigate('/connexion')
      return
    }

    if (!isPatient) {
      setError(
        'Seul un compte patient peut effectuer une réservation.'
      )
      return
    }

    if (!selectedPharmacyForBooking) {
      return
    }

    if (bookingStep === 'patient') {
      if (!bookingFile) {
        setError('Veuillez joindre une ordonnance.')
        return
      }
    }

    if (bookingStep === 'beneficiary') {
      if (
        !beneficiaryNom.trim() ||
        !beneficiaryPrenom.trim()
      ) {
        setError(
          'Veuillez renseigner le nom et le prénom du bénéficiaire.'
        )
        return
      }

      if (!bookingFile) {
        setError('Veuillez joindre une ordonnance.')
        return
      }
    }

    setSubmittingBooking(true)
    setError('')
    setBookingSuccess('')

    try {
      if (bookingStep === 'patient') {
        const formData = new FormData()

        formData.append(
          'pharmacie_id',
          selectedPharmacyForBooking.id
        )

        formData.append(
          'ordonnance',
          bookingFile
        )

        if (bookingBonFile) {
          formData.append(
            'bon',
            bookingBonFile
          )
        }

        if (bookingNote.trim()) {
          formData.append(
            'note',
            bookingNote.trim()
          )
        }

        await createReservation(formData)

      } else if (bookingStep === 'beneficiary') {
        const resBeneficiaire =
          await createBeneficiaire({
            nom: beneficiaryNom.trim(),
            prenom: beneficiaryPrenom.trim()
          })

        const beneficiaryId =
          resBeneficiaire.data?.data?.id

        if (!beneficiaryId) {
          throw new Error(
            "Impossible de récupérer l'identifiant du bénéficiaire créé."
          )
        }

        const formData = new FormData()

        formData.append(
          'pharmacie_id',
          selectedPharmacyForBooking.id
        )

        formData.append(
          'beneficiaire_id',
          beneficiaryId
        )

        formData.append(
          'ordonnance',
          bookingFile
        )

        if (bookingInsuranceFile) {
          formData.append(
            'carte_assurance',
            bookingInsuranceFile
          )
        }

        if (bookingBonFile) {
          formData.append(
            'bon',
            bookingBonFile
          )
        }

        if (bookingNote.trim()) {
          formData.append(
            'note',
            bookingNote.trim()
          )
        }

        await createReservation(formData)
      }

      setBookingSuccess(
        'Votre ordonnance a bien été envoyée à la pharmacie.'
      )

      setTimeout(() => {
        closeBookingModal()
      }, 2000)

    } catch (err) {
      if (err.response?.data?.errors) {
        const errorMessages =
          Object.values(
            err.response.data.errors
          )
            .flat()
            .join(' ')

        setError(errorMessages)
      } else {
        setError(
          err.response?.data?.message ||
          err.message ||
          'Une erreur est survenue lors de la réservation.'
        )
      }
    } finally {
      setSubmittingBooking(false)
    }
  }

  // =========================================================
  // GÉOLOCALISATION
  // =========================================================

  const requestLocation = useCallback(async () => {
    if (coords?.lat && coords?.lng) {
      return coords
    }

    if (locating) {
      return null
    }

    setLocating(true)
    setError('')

    try {
      const loc = await captureLocation()

      if (loc?.lat && loc?.lng) {
        setCoords(loc)
        return loc
      }

      return null
    } catch (err) {
      setError(
        "Impossible d'accéder à votre position GPS. Veuillez vérifier vos autorisations."
      )
      return null
    } finally {
      setLocating(false)
    }
  }, [
    coords,
    locating,
    setCoords
  ])

  // =========================================================
  // CHARGER LES PHARMACIES
  // =========================================================

  const fetchPharmacies = useCallback(
    async (tab = activeTab, currentCoords = coords) => {
      if (loadingRef.current) {
        return
      }

      loadingRef.current = true
      setLoading(true)
      setError('')

      try {
        if (tab === 'proches') {
          let location = currentCoords

          if (
            !location?.lat ||
            !location?.lng
          ) {
            location = await requestLocation()
          }

          if (
            location?.lat &&
            location?.lng
          ) {
            const { data } =
              await getNearbyPharmacies({
                lat: location.lat,
                lng: location.lng,
                rayon: 50
              })

            let resultats = Array.isArray(data)
              ? data
              : (
                  data?.pharmacies ||
                  data?.data ||
                  []
                )

            resultats = resultats.filter(
              (p) =>
                p.distance !== undefined &&
                p.distance !== null &&
                Number(p.distance) <= 50
            )

            resultats.sort(
              (a, b) =>
                Number(a.distance) -
                Number(b.distance)
            )

            setPharmacies(resultats)
          } else {
            setPharmacies([])
            setError(
              "Impossible de déterminer votre position pour afficher les pharmacies de garde proches."
            )
          }

        } else {
          const { data } =
            await getPharmacies()

          const resultats = Array.isArray(data)
            ? data
            : (
                data?.pharmacies ||
                data?.data ||
                []
              )

          setPharmacies(resultats)
        }

      } catch (err) {
        setError(
          'Impossible de charger la liste des pharmacies pour le moment.'
        )
      } finally {
        setLoading(false)
        loadingRef.current = false
      }
    },
    [
      activeTab,
      coords,
      requestLocation,
      setPharmacies
    ]
  )

  // =========================================================
  // CHARGEMENT INITIAL
  // =========================================================

  useEffect(() => {
    if (initializedRef.current) {
      return
    }

    initializedRef.current = true
    fetchPharmacies('all')
  }, [fetchPharmacies])

  // =========================================================
  // CHANGEMENT D'ONGLET
  // =========================================================

  const handleTabChange = async (tab) => {
    if (tab === activeTab) {
      return
    }

    setActiveTab(tab)
    setError('')

    if (tab === 'all') {
      await fetchPharmacies('all')
      return
    }

    let currentCoords = coords

    if (
      !currentCoords?.lat ||
      !currentCoords?.lng
    ) {
      currentCoords = await requestLocation()
    }

    if (
      currentCoords?.lat &&
      currentCoords?.lng
    ) {
      await fetchPharmacies(
        'proches',
        currentCoords
      )
    }
  }

  const safePharmacies =
    Array.isArray(pharmacies)
      ? pharmacies
      : []

  const filtered =
    safePharmacies.filter((p) => {
      const query =
        (search || '')
          .toLowerCase()
          .trim()

      if (!query) {
        return true
      }

      return (
        p.nom
          ?.toLowerCase()
          .includes(query) ||
        p.adresse
          ?.toLowerCase()
          .includes(query) ||
        p.ville
          ?.toLowerCase()
          .includes(query)
      )
    })

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-100 via-[#F8FAFC] to-emerald-50/40 text-slate-800 pb-20 font-['Outfit',sans-serif]">

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap');
        .font-brand { font-family: 'Outfit', sans-serif; }
      `}</style>

      {/* HALOS */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] rounded-full bg-teal-500/10 blur-[140px] pointer-events-none" />

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl pt-12 pb-16 border-b-2 border-slate-200/80 shadow-sm">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          <div className="text-center max-w-2xl mx-auto mb-8">

            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 mb-4 border border-emerald-200/80 shadow-xs">
              <FiCompass className="w-3.5 h-3.5 text-emerald-600" />
              Réseau Officiel PharmaGo
            </span>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
              Trouvez votre{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                Pharmacie
              </span>
            </h1>

            <p className="mt-3 text-sm sm:text-base text-slate-600 font-medium">
              Consultez les pharmacies inscrites ou localisez les officines de garde à proximité.
            </p>

          </div>

          {/* RECHERCHE */}

          <div className="max-w-2xl mx-auto">

            <div className="relative bg-white rounded-2xl shadow-xl shadow-slate-300/50 border-2 border-slate-200/80 p-2 transition-all focus-within:border-emerald-600 focus-within:ring-4 focus-within:ring-emerald-600/10">

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

      {/* =====================================================
          CONTENU
      ===================================================== */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 relative z-10">

        {error &&
          activeTab !== 'proches' &&
          !selectedPharmacyForBooking && (
            <div className="mb-6">
              <Alert type="error" onClose={() => setError('')}>
                {error}
              </Alert>
            </div>
          )}

        {/* ONGLETS */}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-white/90 backdrop-blur-xl p-3 rounded-2xl border-2 border-slate-200/80 shadow-lg shadow-slate-300/30">

          <div className="flex items-center gap-2 w-full sm:w-auto">

            <button
              type="button"
              onClick={() => handleTabChange('all')}
              className={`flex-1 sm:flex-none px-6 py-3 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-transparent text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>Nos Pharmacies</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('proches')}
              disabled={locating}
              className={`flex-1 sm:flex-none px-6 py-3 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'proches'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-transparent text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FiNavigation className={`w-4 h-4 ${locating ? 'animate-spin' : ''}`} />

              <span>
                {locating
                  ? 'Localisation...'
                  : 'Pharmacies proches'}
              </span>

            </button>

          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 px-4 py-3 rounded-xl w-full sm:w-auto justify-center border border-slate-200/60">

            <FiMapPin className="text-emerald-600 w-4 h-4" />

            <span>
              {activeTab === 'proches'
                ? 'Pharmacies de garde à proximité'
                : 'Liste générale des pharmacies'}
            </span>

          </div>

        </div>

        {/* LOADING */}

        {loading ? (

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

            {[1, 2, 3, 4, 5, 6].map((i) => (

              <div
                key={i}
                className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 border-2 border-slate-200/80 shadow-xl shadow-slate-300/30 animate-pulse space-y-4"
              >

                <div className="flex justify-between items-start">

                  <div className="w-12 h-12 rounded-2xl bg-slate-100" />

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

          <div className="bg-white/90 backdrop-blur-xl rounded-3xl border-2 border-slate-200/80 p-12 text-center shadow-xl shadow-slate-300/40 max-w-md mx-auto my-12">

            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-inner">

              <FiAlertCircle className="w-8 h-8" />

            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Aucune pharmacie trouvée
            </h3>

            <p className="text-sm text-slate-500 font-medium">

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
                className="group relative bg-white/90 backdrop-blur-xl rounded-3xl p-6 border-2 border-slate-200/80 shadow-xl shadow-slate-300/30 hover:shadow-2xl hover:shadow-emerald-950/10 hover:border-emerald-600/40 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >

                <div>

                  <div className="flex items-center justify-between gap-3 mb-4">

                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xl shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300 shadow-sm">

                      <FiMap className="w-6 h-6" />

                    </div>

                    {p.distance !== undefined &&
                      p.distance !== null && (

                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs">

                          <FiNavigation className="w-3 h-3 text-emerald-600" />

                          {Number(p.distance).toFixed(1)} km

                        </span>
                      )}

                  </div>

                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-1 mb-2">
                    {p.nom}
                  </h3>

                  <div className="flex items-start gap-2 text-sm text-slate-500 mb-4 line-clamp-2 font-medium">

                    <FiMapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />

                    <span>

                      {p.ville ? (
                        <strong className="text-slate-700 font-semibold">
                          {p.ville}
                        </strong>
                      ) : null}

                      {p.ville && p.adresse ? ' — ' : ''}

                      {p.adresse || 'Adresse non communiquée'}

                    </span>

                  </div>

                </div>

                {/* BAS CARTE */}

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">

                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">

                    <FiPhone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />

                    <span className="truncate">
                      {p.telephone || 'Non renseigné'}
                    </span>

                  </div>

                  <div className="flex items-center gap-2">

                    <button
                      type="button"
                      onClick={(e) => handleOpenLocalMap(e, p)}
                      className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all active:scale-95 shrink-0 cursor-pointer border border-slate-200"
                      title="Voir l'emplacement sur la carte interactive"
                    >

                      <FiMap className="w-3.5 h-3.5 text-slate-600" />

                      <span>Carte</span>

                    </button>

                    {activeTab === 'all' && (

                      <button
                        type="button"
                        onClick={(e) => handleOpenBookingModal(e, p)}
                        className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all active:scale-95 shrink-0 cursor-pointer"
                        title={
                          isAuthenticated
                            ? "Envoyer une ordonnance à cette pharmacie"
                            : "Connectez-vous pour réserver"
                        }
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

      {/* =====================================================
          MODALE RÉSERVATION
      ===================================================== */}

      {selectedPharmacyForBooking && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">

          <div className="bg-white rounded-3xl shadow-2xl shadow-slate-900/20 max-w-md w-full p-6 sm:p-8 border-2 border-slate-200 animate-in fade-in zoom-in duration-200 my-auto">

            {/* HEADER */}

            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">

              <div>

                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                  Réservation
                </span>

                <h3 className="text-lg font-extrabold text-slate-900">
                  {selectedPharmacyForBooking.nom}
                </h3>

              </div>

              <button
                type="button"
                onClick={closeBookingModal}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >

                <FiX className="w-5 h-5" />

              </button>

            </div>

            {/* SUCCÈS */}

            {bookingSuccess ? (

              <div className="py-8 text-center space-y-3">

                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">

                  <FiShoppingBag className="w-6 h-6" />

                </div>

                <p className="text-sm font-bold text-emerald-700">
                  {bookingSuccess}
                </p>

              </div>

            ) : bookingStep === 'who' ? (

              <div className="space-y-4 py-2">

                <p className="text-sm font-bold text-slate-800 text-center mb-6">
                  Pour qui souhaitez-vous réserver ?
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setBookingStep('patient')
                    setError('')
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-200/80 hover:border-emerald-600 bg-slate-50/50 hover:bg-emerald-50/30 transition-all group text-left cursor-pointer shadow-sm"
                >

                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0 shadow-xs">

                    <FiUser className="w-6 h-6" />

                  </div>

                  <div>

                    <h4 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                      Pour moi
                    </h4>

                    <p className="text-xs text-slate-500 font-medium">
                      Utiliser mon profil personnel
                    </p>

                  </div>

                </button>

                <button
                  type="button"
                  onClick={() => {
                    setBookingStep('beneficiary')
                    setError('')
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-200/80 hover:border-emerald-600 bg-slate-50/50 hover:bg-emerald-50/30 transition-all group text-left cursor-pointer shadow-sm"
                >

                  <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors shrink-0 shadow-xs">

                    <FiUsers className="w-6 h-6" />

                  </div>

                  <div>

                    <h4 className="font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
                      Pour une autre personne
                    </h4>

                    <p className="text-xs text-slate-500 font-medium">
                      Ajouter un bénéficiaire
                    </p>

                  </div>

                </button>

              </div>

            ) : (

              <form
                onSubmit={handleSubmitReservation}
                className="space-y-4"
              >

                <button
                  type="button"
                  onClick={() => {
                    setBookingStep('who')
                    setError('')
                  }}
                  className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 mb-2 cursor-pointer"
                >

                  <FiArrowLeft className="w-4 h-4" />

                  <span>
                    Retour au choix de la personne
                  </span>

                </button>

                {error && (

                  <Alert
                    type="error"
                    onClose={() => setError('')}
                  >
                    {error}
                  </Alert>

                )}

                {bookingStep === 'beneficiary' && (

                  <div className="grid grid-cols-2 gap-3">

                    <div className="space-y-1">

                      <label className="block text-xs font-bold text-slate-600 uppercase">
                        Nom <span className="text-emerald-600">*</span>
                      </label>

                      <input
                        type="text"
                        placeholder="Nom"
                        value={beneficiaryNom}
                        onChange={(e) =>
                          setBeneficiaryNom(e.target.value)
                        }
                        required
                        className="w-full h-12 rounded-xl px-4 text-sm bg-slate-50 border-2 border-slate-200 text-slate-900 font-medium outline-none focus:border-emerald-600 focus:bg-white transition-all"
                      />

                    </div>

                    <div className="space-y-1">

                      <label className="block text-xs font-bold text-slate-600 uppercase">
                        Prénom <span className="text-emerald-600">*</span>
                      </label>

                      <input
                        type="text"
                        placeholder="Prénom"
                        value={beneficiaryPrenom}
                        onChange={(e) =>
                          setBeneficiaryPrenom(e.target.value)
                        }
                        required
                        className="w-full h-12 rounded-xl px-4 text-sm bg-slate-50 border-2 border-slate-200 text-slate-900 font-medium outline-none focus:border-emerald-600 focus:bg-white transition-all"
                      />

                    </div>

                  </div>

                )}

                <div className="space-y-1">

                  <label className="block text-xs font-bold text-slate-600 uppercase">
                    Ordonnance <span className="text-emerald-600">*</span>
                  </label>

                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) =>
                      setBookingFile(e.target.files[0])
                    }
                    required
                    className="w-full h-12 rounded-xl px-4 text-xs bg-slate-50 border-2 border-slate-200 text-slate-500 font-medium outline-none file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 flex items-center cursor-pointer"
                  />

                </div>

                <div className="space-y-1">

                  <label className="block text-xs font-bold text-slate-600 uppercase">
                    Bon de prise en charge (Facultatif)
                  </label>

                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) =>
                      setBookingBonFile(e.target.files[0])
                    }
                    className="w-full h-12 rounded-xl px-4 text-xs bg-slate-50 border-2 border-slate-200 text-slate-500 font-medium outline-none file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 flex items-center cursor-pointer"
                  />

                </div>

                {bookingStep === 'beneficiary' && (

                  <div className="space-y-1">

                    <label className="block text-xs font-bold text-slate-600 uppercase">
                      Carte d'assurance (Facultatif)
                    </label>

                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) =>
                        setBookingInsuranceFile(e.target.files[0])
                      }
                      className="w-full h-12 rounded-xl px-4 text-xs bg-slate-50 border-2 border-slate-200 text-slate-500 font-medium outline-none file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 flex items-center cursor-pointer"
                    />

                  </div>

                )}

                <div className="space-y-1">

                  <label className="block text-xs font-bold text-slate-600 uppercase">
                    Note complémentaire (Facultatif)
                  </label>

                  <textarea
                    placeholder="Précisions pour la pharmacie..."
                    value={bookingNote}
                    onChange={(e) =>
                      setBookingNote(e.target.value)
                    }
                    rows={2}
                    className="w-full rounded-xl p-3 text-sm bg-slate-50 border-2 border-slate-200 text-slate-900 font-medium outline-none focus:border-emerald-600 focus:bg-white transition-all resize-none"
                  />

                </div>

                <div className="pt-2">

                  <button
                    type="submit"
                    disabled={submittingBooking}
                    className="w-full h-12 flex justify-center items-center gap-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
                  >

                    {submittingBooking ? (

                      <>
                        <Loader size="sm" />
                        <span>Envoi en cours...</span>
                      </>

                    ) : (

                      <span>
                        Envoyer la réservation
                      </span>

                    )}

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
