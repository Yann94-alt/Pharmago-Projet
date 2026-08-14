import { useSearchParams, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { useEffect, useState, useRef } from 'react'
import { FiArrowLeft, FiNavigation, FiPhone, FiMapPin, FiCrosshair } from 'react-icons/fi'
import L from 'leaflet'
import api from '../api/axios'
import { getNearbyPartnerPharmacies } from '../api/api.js'
import { captureLocation } from '../utils/geolocation'
import 'leaflet/dist/leaflet.css'

import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

const pharmaIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

const userIcon = L.divIcon({
  className: 'custom-user-marker',
  html: `<div class="relative flex items-center justify-center w-8 h-8">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-6 w-6 bg-emerald-600 border-2 border-white shadow-lg"></span>
         </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

function CenterOnce({ center, zoom }) {
  const map = useMap()
  const hasCentered = useRef(false)

  useEffect(() => {
    if (
      !hasCentered.current &&
      center &&
      Number.isFinite(center[0]) &&
      Number.isFinite(center[1])
    ) {
      map.setView(center, zoom)
      hasCentered.current = true
    }
  }, [center, zoom, map])

  return null
}

export default function CartePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // Paramètres d'URL (considérés comme la position initiale du patient si mode=nearby)
  const urlLat = parseFloat(searchParams.get('lat'))
  const urlLng = parseFloat(searchParams.get('lng'))
  const pharmacyId = searchParams.get('id')
  const isNearbyMode = searchParams.get('mode') === 'nearby'

  const hasValidUrlLocation = Number.isFinite(urlLat) && Number.isFinite(urlLng)

  // 1. Source de vérité unique pour la position du patient
  const [currentCoords, setCurrentCoords] = useState(() => {
    if (isNearbyMode && hasValidUrlLocation) {
      console.log('📍 Position URL patient :', { lat: urlLat, lng: urlLng })
      return { lat: urlLat, lng: urlLng }
    }
    return null
  })

  const [pharmacies, setPharmacies] = useState([])
  const [selectedPharmacie, setSelectedPharmacie] = useState(null)
  const [loading, setLoading] = useState(false)
  const [locationError, setLocationError] = useState(null)

  // 2. Gestion de la géolocalisation si aucune coordonnée valide n'est présente dans l'URL
  useEffect(() => {
    if (!isNearbyMode) return
    if (hasValidUrlLocation) return // Priorité absolue aux coordonnées URL

    let cancelled = false

    async function loadLocation() {
      try {
        setLoading(true)
        setLocationError(null)

        const loc = await captureLocation()

        if (cancelled) return

        if (loc && Number.isFinite(Number(loc.lat)) && Number.isFinite(Number(loc.lng))) {
          const position = { lat: Number(loc.lat), lng: Number(loc.lng) }
          console.log('📍 Position GPS navigateur utilisée :', position)
          setCurrentCoords(position)
        } else {
          throw new Error('Position GPS invalide')
        }
      } catch (error) {
        console.error("Erreur géolocalisation :", error)
        if (!cancelled) {
          setLocationError("Impossible de déterminer votre position. Veuillez autoriser la géolocalisation.")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadLocation()

    return () => {
      cancelled = true
    }
  }, [isNearbyMode, hasValidUrlLocation])

  // Fonction manuelle pour forcer l'utilisation du GPS du navigateur
  const handleUseCurrentLocation = async () => {
    try {
      setLoading(true)
      setLocationError(null)
      const loc = await captureLocation()
      if (loc && Number.isFinite(Number(loc.lat)) && Number.isFinite(Number(loc.lng))) {
        const position = { lat: Number(loc.lat), lng: Number(loc.lng) }
        console.log('📍 Position GPS manuelle utilisateur :', position)
        setCurrentCoords(position)
      }
    } catch (error) {
      setLocationError("Impossible de récupérer votre position actuelle.")
    } finally {
      setLoading(false)
    }
  }

  // Coordonnées géographiques formatées pour Leaflet
  const userCoords =
    currentCoords && Number.isFinite(currentCoords.lat) && Number.isFinite(currentCoords.lng)
      ? [currentCoords.lat, currentCoords.lng]
      : null

  // 3. Appel API lorsque les coordonnées du patient sont prêtes
  useEffect(() => {
    if (
      !isNearbyMode ||
      !currentCoords ||
      !Number.isFinite(currentCoords.lat) ||
      !Number.isFinite(currentCoords.lng)
    ) {
      return
    }

    async function loadNearby() {
      try {
        setLoading(true)
        console.log('🔎 Recherche pharmacies autour de :', currentCoords)

        const response = await getNearbyPartnerPharmacies({
          lat: currentCoords.lat,
          lng: currentCoords.lng,
          rayon: 20
        })

        const resultats = Array.isArray(response.data)
          ? response.data
          : (response.data?.pharmacies || response.data?.data || [])

        console.log('🏥 PHARMACIES RETOURNÉES :', resultats)
        setPharmacies(resultats)

        if (pharmacyId) {
          const found = resultats.find(p => String(p.id) === String(pharmacyId))
          if (found) {
            setSelectedPharmacie(found)
          }
        }
      } catch (error) {
        console.error('Erreur pharmacies proches :', error)
        setPharmacies([])
      } finally {
        setLoading(false)
      }
    }

    loadNearby()
  }, [isNearbyMode, currentCoords?.lat, currentCoords?.lng, pharmacyId])

  // Chargement pharmacie unique hors mode nearby
  useEffect(() => {
    if (pharmacyId && !isNearbyMode) {
      api.get(`/pharmacies/${pharmacyId}`)
        .then(({ data }) => setSelectedPharmacie(data))
        .catch((err) => console.error("Erreur détail pharmacie:", err))
    }
  }, [pharmacyId, isNearbyMode])

  const handleOpenGPS = (p) => {
    const targetLat = p?.latitude || urlLat
    const targetLng = p?.longitude || urlLng
    if (targetLat && targetLng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${targetLat},${targetLng}`, '_blank')
    }
  }

  // Si aucune position n'est encore définie, on ne rend pas la carte avec un faux centre fixe pour éviter l'effet de saut, 
  // ou on attend un premier rendu propre. S'il y a un userCoords, on l'utilise.
  const mapCenter = userCoords || (hasValidUrlLocation ? [urlLat, urlLng] : null)

  return (
    <div className="h-screen w-full relative flex flex-col bg-slate-100">
      
      {/* Header & Boutons de contrôle */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-wrap items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-full shadow-lg border border-slate-200 text-slate-800 font-semibold hover:bg-white transition-all active:scale-95"
        >
          <FiArrowLeft className="w-5 h-5 text-emerald-600" />
          <span>Retour</span>
        </button>

        {isNearbyMode && (
          <button
            onClick={handleUseCurrentLocation}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-full shadow-lg text-xs font-semibold transition-all active:scale-95"
          >
            <FiCrosshair className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Utiliser ma position actuelle</span>
          </button>
        )}
      </div>

      {/* Message d'erreur */}
      {locationError && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2.5 rounded-2xl shadow-md text-xs font-medium">
          {locationError}
        </div>
      )}

      {/* Affichage de la carte uniquement si un centre initial est disponible */}
      {mapCenter ? (
        <MapContainer
          center={mapCenter}
          zoom={14}
          className="h-full w-full z-0"
          zoomControl={false}
        >
          <CenterOnce center={mapCenter} zoom={14} />

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Marqueur de la position du patient */}
          {userCoords && (
            <Marker position={userCoords} icon={userIcon}>
              <Popup>
                <div className="font-bold text-slate-800 text-xs text-center p-1">
                  Votre position actuelle
                </div>
              </Popup>
            </Marker>
          )}

          {/* Marqueurs des pharmacies partenaires proches */}
          {isNearbyMode && pharmacies.map((p) => {
            if (!p.latitude || !p.longitude) return null
            return (
              <Marker
                key={p.id}
                position={[Number(p.latitude), Number(p.longitude)]}
                icon={pharmaIcon}
                eventHandlers={{
                  click: () => setSelectedPharmacie(p),
                }}
              >
                <Popup>
                  <div className="p-1">
                    <h4 className="font-bold text-slate-900 text-sm">{p.nom}</h4>
                    <p className="text-xs text-slate-500 mt-1">{p.ville}</p>
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
      ) : (
        <div className="h-full w-full flex items-center justify-center text-sm text-slate-500">
          Chargement de la carte et de la position...
        </div>
      )}

      {/* Message liste vide */}
      {isNearbyMode && !loading && pharmacies.length === 0 && !locationError && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] bg-white px-4 py-2 rounded-xl shadow-md border text-xs font-medium text-slate-600">
          Aucune pharmacie partenaire à proximité
        </div>
      )}

      {/* Fiche de détails de la pharmacie sélectionnée */}
      {selectedPharmacie && (
        <div className="absolute bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-[1000] bg-white/95 backdrop-blur-md p-5 rounded-3xl shadow-2xl border border-slate-200/80 space-y-3 transition-all animate-in slide-in-from-bottom-5">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold tracking-wider text-emerald-600 uppercase bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                Pharmacie Partenaire
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-2 line-clamp-1">{selectedPharmacie.nom}</h3>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                <FiMapPin className="text-emerald-600 shrink-0" />
                <span>{selectedPharmacie.ville} {selectedPharmacie.adresse ? `— ${selectedPharmacie.adresse}` : ''}</span>
              </p>
            </div>
            
            {selectedPharmacie.distance !== undefined && selectedPharmacie.distance !== null && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-lg shrink-0">
                {Number(selectedPharmacie.distance).toFixed(1)} km
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            {selectedPharmacie.telephone && (
              <a
                href={`tel:${selectedPharmacie.telephone}`}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-semibold transition-colors"
              >
                <FiPhone className="text-emerald-600" />
                Appeler
              </a>
            )}
            
            <button
              onClick={() => handleOpenGPS(selectedPharmacie)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#16A34A] hover:bg-emerald-700 text-white rounded-2xl text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all active:scale-95"
            >
              <FiNavigation />
              Itinéraire
            </button>
          </div>
        </div>
      )}
    </div>
  )
}