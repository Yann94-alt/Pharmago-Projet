import { createContext, useContext, useState } from "react"

const PharmacyContext = createContext()

export function PharmacyProvider({ children }) {

  const [search, setSearch] = useState("")
  const [deGarde, setDeGarde] = useState(false)
  const [coords, setCoords] = useState(null)
  const [pharmacies, setPharmacies] = useState([])

  return (
    <PharmacyContext.Provider
      value={{
        search,
        setSearch,
        deGarde,
        setDeGarde,
        coords,
        setCoords,
        pharmacies,
        setPharmacies
      }}
    >
      {children}
    </PharmacyContext.Provider>
  )
}

export function usePharmacy() {
  return useContext(PharmacyContext)
}
