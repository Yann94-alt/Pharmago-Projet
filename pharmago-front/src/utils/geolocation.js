const STORAGE_KEY = 'pharmago_location'


// Récupère la position actuelle du navigateur
export function captureLocation({ timeout = 30000 } = {}) {

  return new Promise((resolve, reject) => {

    if (!navigator.geolocation) {
      reject(new Error('Géolocalisation non disponible sur cet appareil.'))
      return
    }


    navigator.geolocation.getCurrentPosition(

      (pos) => {

        const coords = {

          lat: pos.coords.latitude,

          lng: pos.coords.longitude,

          accuracy: pos.coords.accuracy,

          capturedAt: Date.now(),

        }


        console.log("📍 GPS obtenu :", coords)


        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(coords)
        )


        resolve(coords)

      },


      (err) => {

        console.error("Erreur GPS :", err)

        reject(err)

      },


      {
        enableHighAccuracy: true,

        timeout: timeout,

        maximumAge: 0
      }

    )

  })

}



export function getStoredLocation() {

  try {

    const raw = localStorage.getItem(STORAGE_KEY)

    return raw ? JSON.parse(raw) : null

  } catch {

    return null

  }

}



export function clearStoredLocation() {

  localStorage.removeItem(STORAGE_KEY)

}