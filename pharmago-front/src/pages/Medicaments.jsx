import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  FiSearch, 
  FiPackage, 
  FiTag, 
  FiDollarSign, 
  FiMapPin, 
  FiAlertCircle, 
  FiCheckCircle,
  FiX
} from 'react-icons/fi'
import api from '../api/axios'
import Alert from '../components/Alert'

export default function Medicaments() {
  const [medicaments, setMedicaments] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchMedicaments = async (q = '') => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/medicaments', { params: q ? { search: q } : {} })
      // Prise en charge automatique de la pagination Laravel (data.data) ou d'un tableau direct (data)
      const list = Array.isArray(data) ? data : (data.data || [])
      setMedicaments(list)
    } catch (err) {
      setError('Impossible de charger le catalogue de médicaments.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMedicaments()
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    fetchMedicaments(search)
  }

  const handleClearSearch = () => {
    setSearch('')
    fetchMedicaments('')
  }

  // Formatage propre des montants (ex: 1 500 FCFA)
  const formatPrice = (price) => {
    if (!price) return null
    return new Intl.NumberFormat('fr-FR').format(price)
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* 1. Hero Section avec barre de recherche glassmorphism */}
      <div className="relative overflow-hidden bg-gradient-to-b from-emerald-50/60 via-white to-slate-50/60 pt-12 pb-20 border-b border-emerald-100/40">
        <div className="absolute top-0 right-1/4 translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-10 w-80 h-80 bg-teal-200/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-100/80 text-emerald-800 mb-4 border border-emerald-200/60 shadow-xs">
              <FiPackage className="w-3.5 h-3.5 text-emerald-600" />
              Catalogue Pharmaceutique
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
              Trouvez vos <span className="text-[#16A34A] bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600">médicaments</span> au meilleur prix
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-600 font-normal">
              Recherchez un médicament et découvrez les pharmacies partenaires qui le disposent en stock.
            </p>
          </div>

          {/* Formulaire de recherche */}
          <div className="max-w-2xl mx-auto">
            <form 
              onSubmit={handleSubmit}
              className="bg-white/80 backdrop-blur-md p-2.5 sm:p-3 rounded-3xl shadow-xl shadow-emerald-950/5 border border-white/80 ring-1 ring-slate-200/60 flex flex-col sm:flex-row gap-2.5"
            >
              <div className="relative flex-1 flex items-center">
                <div className="absolute left-4 pointer-events-none text-slate-400">
                  <FiSearch className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-11 pr-10 py-3.5 bg-slate-50/80 border border-slate-200/80 rounded-2xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] focus:bg-white transition-all"
                  placeholder="Rechercher un médicament (ex: Paracétamol, Amoxicilline)..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60 transition-all"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-[#16A34A] hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold text-sm transition-all shadow-md shadow-emerald-600/20 whitespace-nowrap cursor-pointer"
              >
                <span>Rechercher</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Alert Erreur */}
        {error && (
          <div className="mb-6 max-w-2xl mx-auto">
            <Alert type="error" onClose={() => setError('')}>
              {error}
            </Alert>
          </div>
        )}

        {/* États : Loading, Empty, Grid */}
        {loading ? (
          /* Skeleton Loading */
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-xs animate-pulse space-y-4"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="h-6 bg-slate-100 rounded-md w-1/2" />
                  <div className="h-6 bg-slate-100 rounded-full w-20" />
                </div>
                <div className="h-4 bg-slate-100 rounded-md w-3/4" />
                <div className="h-8 bg-slate-100 rounded-xl w-1/3" />
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="h-3 bg-slate-100 rounded-md w-1/4" />
                  <div className="flex gap-2">
                    <div className="h-8 bg-slate-100 rounded-full w-32" />
                    <div className="h-8 bg-slate-100 rounded-full w-28" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : medicaments.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-[24px] border border-slate-200/70 p-12 text-center shadow-xs max-w-lg mx-auto my-8">
            <div className="w-16 h-16 bg-emerald-50 text-[#16A34A] rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
              <FiAlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Aucun médicament trouvé
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Vérifiez l'orthographe du nom ou réessayez avec un autre mot-clé.
            </p>
            {search && (
              <button
                onClick={handleClearSearch}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-all"
              >
                Voir tous les médicaments
              </button>
            )}
          </div>
        ) : (
          /* Liste des Médicaments */
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
            {medicaments.map((med) => (
              <div
                key={med.id}
                className="bg-white rounded-[24px] p-6 shadow-xs border border-slate-200/60 hover:border-[#16A34A]/40 hover:shadow-xl hover:shadow-emerald-950/5 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Header Carte */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center font-bold border border-emerald-100 shrink-0">
                        <FiPackage className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 truncate">
                        {med.nom}
                      </h3>
                    </div>
                    {med.categorie && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shrink-0">
                        <FiTag className="w-3 h-3 text-emerald-600" />
                        {med.categorie}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {med.description && (
                    <p className="text-sm text-slate-500 mb-4 line-clamp-2 leading-relaxed">
                      {med.description}
                    </p>
                  )}

                  {/* Prix indicatif de marché */}
                  {med.prix_marche > 0 && (
                    <div className="inline-flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/60 text-xs font-semibold text-slate-700 mb-4">
                      <FiDollarSign className="w-3.5 h-3.5 text-[#16A34A]" />
                      <span>Prix de référence :</span>
                      <span className="text-[#16A34A] font-bold">
                        {formatPrice(med.prix_marche)} FCFA
                      </span>
                    </div>
                  )}
                </div>

                {/* Section Pharmacies Disponibles */}
                {med.pharmacies?.length > 0 ? (
                  <div className="mt-2 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                      <FiCheckCircle className="w-3.5 h-3.5 text-[#16A34A]" />
                      <span>Disponible chez ({med.pharmacies.length})</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {med.pharmacies.map((ph) => (
                        <Link
                          key={ph.id}
                          to={`/pharmacies/${ph.id}`}
                          className="inline-flex items-center gap-1.5 bg-white hover:bg-emerald-50 text-slate-700 hover:text-[#16A34A] border border-slate-200 hover:border-emerald-300 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 shadow-2xs"
                        >
                          <FiMapPin className="w-3 h-3 text-[#16A34A]" />
                          <span className="truncate max-w-[120px]">{ph.nom}</span>
                          {ph.pivot?.prix > 0 && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="text-[#16A34A] font-bold">
                                {formatPrice(ph.pivot.prix)} FCFA
                              </span>
                            </>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 pt-3 border-t border-slate-100 text-xs text-slate-400 italic">
                    Aucune pharmacie rattachée pour le moment.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}