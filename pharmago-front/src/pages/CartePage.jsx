import { useSearchParams, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { useEffect, useState, useCallback } from 'react'
import { FiArrowLeft, FiNavigation, FiPhone, FiMapPin, FiCrosshair } from 'react-icons/fi'
import L from 'leaflet'
import api from '../api/axios'
import { captureLocation } from '../utils/geolocation'
import 'leaflet/dist/leaflet.css'

// Correction du bug d'icônes par défaut avec Leaflet & Bundlers
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

// Icône personnalisée pour les pharmacies
const pharmaIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

// Icône personnalisée pour la position GPS de l'utilisateur
const userIcon = L.divIcon({
  className: 'custom-user-marker',
  html: `<div class="relative flex items-center justify-center w-8 h-8">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-6 w-6 bg-emerald-600 border-2 border-white shadow-lg"></span>
         </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

// Utilitaire de centrage dynamique de carte
function RecenterMap({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom)
    }
  }, [center, zoom, map])
  return null
}

export default function CartePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // Paramètres d'URL pour pharmacie unique
  const lat = parseFloat(searchParams.get('lat'))
  const lng = parseFloat(searchParams.get('lng'))
  const id = searchParams.get('id')

  // Paramètres d'URL pour mode géolocalisé
  const urlUserLat = parseFloat(searchParams.get('userLat'))
  const urlUserLng = parseFloat(searchParams.get('userLng'))
  const isNearbyMode = searchParams.get('mode') === 'nearby' || (!isNaN(urlUserLat) && !isNaN(urlUserLng))

  // États locaux pour gérer la position GPS réelle et précise
  const [currentCoords, setCurrentCoords] = useState(
    (!isNaN(urlUserLat) && !isNaN(urlUserLng)) ? { lat: urlUserLat, lng: urlUserLng } : null
  )
  const [pharmacies, setPharmacies] = useState([])
  const [selectedPharmacie, setSelectedPharmacie] = useState(null)
  const [loading, setLoading] = useState(false)

  // 1. Si aucun paramètre utilisateur précis n'est dans l'URL, on force la géolocalisation HTML5 haute précision
  useEffect(() => {
    if (!currentCoords && isNearbyMode) {
      captureLocation()
        .then((loc) => {
          if (loc?.lat && loc?.lng) {
            setCurrentCoords(loc)
          }
        })
        .catch((err) => {
          console.error("Erreur de géolocalisation sur la carte :", err)
        })
    }
  }, [currentCoords, isNearbyMode])

  // Coordonnées & Zoom dynamiques
  const userCoords = currentCoords?.lat && currentCoords?.lng ? [currentCoords.lat, currentCoords.lng] : null
  const center = isNearbyMode
  ? userCoords || [5.3484, -4.0305]
  : [5.3484, -4.0305]
  const zoomLevel = isNearbyMode ? 14 : 16

  // 2. Chargement d'une pharmacie spécifique
  useEffect(() => {
    if (id && !isNearbyMode) {
      api.get(`/pharmacies/${id}`)
        .then(({ data }) => setSelectedPharmacie(data))
        .catch((err) => console.error("Erreur détail pharmacie:", err))
    }
  }, [id, isNearbyMode])

  // 3. Chargement des pharmacies proches avec les coordonnées exactes
  useEffect(() => {
    if (isNearbyMode && currentCoords?.lat && currentCoords?.lng) {
      setLoading(true)
      api.get('/pharmacies/nearby', {
        params: { 
          lat: currentCoords.lat, 
          lng: currentCoords.lng, 
          rayon: 50 
        }
      })
      .then(({ data }) => {
        const resultats = Array.isArray(data) ? data : (data.pharmacies || data.data || [])
        setPharmacies(resultats)
        
        // Si une pharmacie spécifique est demandée en mode nearby, on la sélectionne
        if (id) {
          const found = resultats.find(p => String(p.id) === String(id))
          if (found) setSelectedPharmacie(found)
        }
      })
      .catch((err) => console.error("Erreur pharmacies proches:", err))
      .finally(() => setLoading(false))
    }
  }, [isNearbyMode, currentCoords, id])

  // Ouverture itinéraire
  const handleOpenGPS = (p) => {
    const targetLat = p?.latitude || lat
    const targetLng = p?.longitude || lng
    if (targetLat && targetLng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${targetLat},${targetLng}`, '_blank')
    }
  }

  return (
    <div className="h-screen w-full relative flex flex-col bg-slate-100">
      
      {/* Header / Bouton Retour */}
      <div className="absolute top-4 left-4 z-[1000] flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-full shadow-lg border border-slate-200/80 text-slate-800 font-semibold hover:bg-white transition-all active:scale-95"
        >
          <FiArrowLeft className="w-5 h-5 text-emerald-600" />
          <span>Retour</span>
        </button>

        {isNearbyMode && (
          <div className="hidden sm:flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-full shadow-lg text-xs font-semibold">
            <FiCrosshair className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Recherche en cours...' : `${pharmacies.length} pharmacies proches`}</span>
          </div>
        )}
      </div>

      {/* Carte Leaflet */}
      <MapContainer
        center={center}
        zoom={zoomLevel}
        className="h-full w-full z-0"
        zoomControl={false}
      >
        <RecenterMap center={center} zoom={zoomLevel} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Repère Utilisateur précis */}
        {userCoords && (
          <Marker position={userCoords} icon={userIcon}>
            <Popup>
              <div className="font-bold text-slate-800 text-xs text-center p-1">
                📍 Votre position actuelle
              </div>
            </Popup>
          </Marker>
        )}

        {/* Repères des pharmacies proches */}
        {isNearbyMode && pharmacies.map((p) => {
          if (!p.latitude || !p.longitude) return null
          return (
            <Marker
              key={p.id}
              position={[p.latitude, p.longitude]}
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

        {/* Repère unique */}
        {!isNearbyMode && singleCoords && (
          <Marker position={singleCoords} icon={pharmaIcon}>
            <Popup>
              <div className="p-1">
                <h4 className="font-bold text-slate-900 text-sm">{selectedPharmacie?.nom || 'Pharmacie'}</h4>
                <p className="text-xs text-slate-500 mt-1">{selectedPharmacie?.ville}</p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Carte de détails en bas de page */}
      {selectedPharmacie && (
        <div className="absolute bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-[1000] bg-white/95 backdrop-blur-md p-5 rounded-3xl shadow-2xl border border-slate-200/80 space-y-3 transition-all animate-in slide-in-from-bottom-5">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold tracking-wider text-emerald-600 uppercase bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                Pharmacie Sélectionnée
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