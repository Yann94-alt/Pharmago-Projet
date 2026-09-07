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
  FiX,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi'

import api from '../api/axios'
import Alert from '../components/Alert'

export default function Medicaments() {
  const [medicaments, setMedicaments] = useState([])
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [from, setFrom] = useState(0)
  const [to, setTo] = useState(0)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // =====================================================
  // RÉCUPÉRER LES MÉDICAMENTS
  // =====================================================

  const fetchMedicaments = async (q = '', page = 1) => {
    setError('')
    setLoading(true)

    try {
      const { data } = await api.get('/medicaments', {
        params: {
          ...(q ? { search: q } : {}),
          page
        }
      })

      // Laravel paginate() retourne :
      // data.data = tableau des médicaments
      // data.current_page
      // data.last_page
      // data.total
      // data.from
      // data.to

      const pagination = data.data

      setMedicaments(
        Array.isArray(pagination?.data)
          ? pagination.data
          : []
      )

      setCurrentPage(pagination?.current_page || 1)
      setLastPage(pagination?.last_page || 1)
      setTotal(pagination?.total || 0)
      setFrom(pagination?.from || 0)
      setTo(pagination?.to || 0)

    } catch (err) {
      console.error('Erreur médicaments:', err)

      setError(
        'Impossible de charger le catalogue de médicaments.'
      )

      setMedicaments([])
    } finally {
      setLoading(false)
    }
  }

  // =====================================================
  // CHARGEMENT INITIAL
  // =====================================================

  useEffect(() => {
    fetchMedicaments('', 1)
  }, [])

  // =====================================================
  // RECHERCHE
  // =====================================================

  const handleSubmit = (e) => {
    e.preventDefault()

    fetchMedicaments(search, 1)
  }

  const handleClearSearch = () => {
    setSearch('')
    fetchMedicaments('', 1)
  }

  // =====================================================
  // CHANGEMENT DE PAGE
  // =====================================================

  const handlePageChange = (page) => {
    if (page < 1 || page > lastPage || loading) {
      return
    }

    fetchMedicaments(search, page)
  }

  // =====================================================
  // FORMATAGE DU PRIX
  // =====================================================

  const formatPrice = (price) => {
    if (!price) return null

    return new Intl.NumberFormat('fr-FR').format(price)
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">

      {/* =====================================================
          HERO
      ====================================================== */}

      <div className="relative overflow-hidden bg-white border-b border-slate-100 pt-10 pb-16">

        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-50 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-50/50 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          <div className="text-center max-w-2xl mx-auto mb-8">

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-[#16A34A] mb-3 border border-emerald-100">

              <FiPackage className="w-3.5 h-3.5" />

              Catalogue Pharmaceutique

            </span>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">

              Trouvez vos{' '}

              <span className="text-[#16A34A]">
                médicaments
              </span>{' '}

              au meilleur prix

            </h1>

            <p className="mt-2 text-sm sm:text-base text-slate-500">
              Recherchez un produit et consultez instantanément les pharmacies qui l'ont en stock.
            </p>

          </div>

          {/* BARRE DE RECHERCHE */}

          <div className="max-w-xl mx-auto">

            <form
              onSubmit={handleSubmit}
              className="bg-white p-2 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/80 flex items-center gap-2"
            >

              <div className="relative flex-1 flex items-center">

                <FiSearch className="absolute left-3.5 h-4 w-4 text-slate-400" />

                <input
                  type="text"
                  className="w-full pl-10 pr-9 py-2.5 bg-transparent text-slate-900 placeholder-slate-400 text-sm focus:outline-none"
                  placeholder="Rechercher par nom..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                {search && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 rounded-full transition-all"
                  >
                    <FiX className="w-3.5 h-3.5" />
                  </button>
                )}

              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-[#16A34A] hover:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-sm cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                Rechercher
              </button>

            </form>

          </div>

        </div>

      </div>

      {/* =====================================================
          CONTENU
      ====================================================== */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">

        {/* ERREUR */}

        {error && (
          <div className="mb-6 max-w-xl mx-auto">

            <Alert
              type="error"
              onClose={() => setError('')}
            >
              {error}
            </Alert>

          </div>
        )}

        {/* LOADING */}

        {loading ? (

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

            {[1, 2, 3, 4, 5, 6].map((i) => (

              <div
                key={i}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm animate-pulse space-y-4"
              >

                <div className="flex justify-between items-start">

                  <div className="h-5 bg-slate-100 rounded-md w-1/2" />

                  <div className="h-5 bg-slate-100 rounded-full w-16" />

                </div>

                <div className="h-4 bg-slate-100 rounded-md w-3/4" />

                <div className="h-6 bg-slate-100 rounded-lg w-1/3" />

              </div>

            ))}

          </div>

        ) : medicaments.length === 0 ? (

          /* =====================================================
             AUCUN RÉSULTAT
          ====================================================== */

          <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center shadow-sm max-w-md mx-auto my-6">

            <div className="w-12 h-12 bg-emerald-50 text-[#16A34A] rounded-full flex items-center justify-center mx-auto mb-3">

              <FiAlertCircle className="w-6 h-6" />

            </div>

            <h3 className="text-base font-bold text-slate-900 mb-1">
              Aucun médicament trouvé
            </h3>

            <p className="text-xs text-slate-500 mb-5">
              Vérifiez l'orthographe ou essayez un autre terme de recherche.
            </p>

            {search && (
              <button
                onClick={handleClearSearch}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all"
              >
                Réinitialiser la recherche
              </button>
            )}

          </div>

        ) : (

          <>

            {/* =====================================================
                LISTE DES MÉDICAMENTS
            ====================================================== */}

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

              {medicaments.map((med) => (

                <div
                  key={med.id}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:border-emerald-200 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                >

                  <div>

                    <div className="flex items-start gap-3 mb-3">

                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center shrink-0 mt-0.5">

                        <FiPackage className="w-4 h-4" />

                      </div>

                      <div className="flex-1 min-w-0">

                        <h3 className="text-base font-bold text-slate-900 leading-snug break-words">
                          {med.nom}
                        </h3>

                        {med.categorie && (

                          <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">

                            <FiTag className="w-3 h-3 text-slate-400" />

                            {med.categorie}

                          </span>

                        )}

                      </div>

                    </div>

                    {/* DESCRIPTION */}

                    {med.description && (

                      <p className="text-xs text-slate-500 mb-3 line-clamp-2 leading-relaxed">
                        {med.description}
                      </p>

                    )}

                    {/* PRIX */}

                    {med.prix_marche > 0 && (

                      <div className="inline-flex items-center gap-1.5 bg-emerald-50/50 px-2.5 py-1 rounded-lg border border-emerald-100 text-xs font-medium text-slate-700 mb-4">

                        <FiDollarSign className="w-3.5 h-3.5 text-[#16A34A]" />

                        <span className="text-slate-500 text-[11px]">
                          Prix indicatif :
                        </span>

                        <span className="text-[#16A34A] font-bold">
                          {formatPrice(med.prix_marche)} FCFA
                        </span>

                      </div>

                    )}

                  </div>

                </div>

              ))}

            </div>

            {/* =====================================================
                PAGINATION SERVEUR
            ====================================================== */}

            {lastPage > 1 && (

              <div className="flex items-center justify-between border-t border-slate-100 mt-8 pt-4 px-2">

                <div className="text-xs text-slate-500">

                  Affichage de{' '}

                  <span className="font-semibold text-slate-700">
                    {from}
                  </span>{' '}

                  à{' '}

                  <span className="font-semibold text-slate-700">
                    {to}
                  </span>{' '}

                  sur{' '}

                  <span className="font-semibold text-slate-700">
                    {total}
                  </span>{' '}

                  résultats

                </div>

                <div className="flex items-center gap-2">

                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
                  >
                    <FiChevronLeft className="w-3.5 h-3.5" />
                    Précédent
                  </button>

                  <span className="text-xs font-semibold text-slate-700 px-2">
                    {currentPage} / {lastPage}
                  </span>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === lastPage || loading}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
                  >
                    Suivant
                    <FiChevronRight className="w-3.5 h-3.5" />
                  </button>

                </div>

              </div>

            )}

          </>

        )}

      </div>

    </div>
  )
}