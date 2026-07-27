import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'
import { 
  FiPlusSquare, 
  FiMapPin, 
  FiPackage, 
  FiFileText, 
  FiCalendar, 
  FiShield, 
  FiGrid, 
  FiMaximize, 
  FiHome, 
  FiBell, 
  FiLogOut, 
  FiUser, 
  FiMenu, 
  FiX 
} from 'react-icons/fi'

const linkClass = ({ isActive }) =>
  `inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all duration-200 ${
    isActive
      ? 'bg-[#16A34A] text-white shadow-md shadow-emerald-600/20'
      : 'text-slate-600 hover:bg-emerald-50/70 hover:text-[#16A34A]'
  }`

const mobileLinkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
    isActive
      ? 'bg-[#16A34A] text-white shadow-sm'
      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
  }`

export default function Navbar() {
  const { isAuthenticated, isPharmacie, user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = async () => {
    setOpen(false)
    await logout()
    navigate('/connexion')
  }

  const patientLinks = (
    <>
      <NavLink to="/" end className={linkClass}>
        <FiMapPin className="w-4 h-4" />
        <span>Pharmacies</span>
      </NavLink>
      <NavLink to="/medicaments" className={linkClass}>
        <FiPackage className="w-4 h-4" />
        <span>Médicaments</span>
      </NavLink>
      <NavLink to="/ordonnances" className={linkClass}>
        <FiFileText className="w-4 h-4" />
        <span>Ordonnances</span>
      </NavLink>
      <NavLink to="/reservations" className={linkClass}>
        <FiCalendar className="w-4 h-4" />
        <span>Réservations</span>
      </NavLink>
      <NavLink to="/assurances" className={linkClass}>
        <FiShield className="w-4 h-4" />
        <span>Assurances</span>
      </NavLink>
    </>
  )

  const pharmacieLinks = (
    <>
      <NavLink to="/" end className={linkClass}>
        <FiGrid className="w-4 h-4" />
        <span>Tableau de bord</span>
      </NavLink>
      <NavLink to="/reservations" className={linkClass}>
        <FiCalendar className="w-4 h-4" />
        <span>Réservations</span>
      </NavLink>
      <NavLink to="/scanner" className={linkClass}>
        <FiMaximize className="w-4 h-4" />
        <span>Scanner QR</span>
      </NavLink>
      <NavLink to="/mon-officine" className={linkClass}>
        <FiHome className="w-4 h-4" />
        <span>Mon officine</span>
      </NavLink>
    </>
  )

  const mobilePatientLinks = (
    <>
      <NavLink to="/" end className={mobileLinkClass} onClick={() => setOpen(false)}>
        <FiMapPin className="w-4 h-4" />
        <span>Pharmacies</span>
      </NavLink>
      <NavLink to="/medicaments" className={mobileLinkClass} onClick={() => setOpen(false)}>
        <FiPackage className="w-4 h-4" />
        <span>Médicaments</span>
      </NavLink>
      <NavLink to="/ordonnances" className={mobileLinkClass} onClick={() => setOpen(false)}>
        <FiFileText className="w-4 h-4" />
        <span>Ordonnances</span>
      </NavLink>
      <NavLink to="/reservations" className={mobileLinkClass} onClick={() => setOpen(false)}>
        <FiCalendar className="w-4 h-4" />
        <span>Réservations</span>
      </NavLink>
      <NavLink to="/assurances" className={mobileLinkClass} onClick={() => setOpen(false)}>
        <FiShield className="w-4 h-4" />
        <span>Assurances</span>
      </NavLink>
    </>
  )

  const mobilePharmacieLinks = (
    <>
      <NavLink to="/" end className={mobileLinkClass} onClick={() => setOpen(false)}>
        <FiGrid className="w-4 h-4" />
        <span>Tableau de bord</span>
      </NavLink>
      <NavLink to="/reservations" className={mobileLinkClass} onClick={() => setOpen(false)}>
        <FiCalendar className="w-4 h-4" />
        <span>Réservations</span>
      </NavLink>
      <NavLink to="/scanner" className={mobileLinkClass} onClick={() => setOpen(false)}>
        <FiMaximize className="w-4 h-4" />
        <span>Scanner QR</span>
      </NavLink>
      <NavLink to="/mon-officine" className={mobileLinkClass} onClick={() => setOpen(false)}>
        <FiHome className="w-4 h-4" />
        <span>Mon officine</span>
      </NavLink>
    </>
  )

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/80 backdrop-blur-md transition-all">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        
        {/* Brand Logo */}
        <NavLink to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#16A34A] to-teal-500 text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
            <FiPlusSquare className="h-6 w-6 stroke-[2.5]" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-slate-900">
            Pharma<span className="text-[#16A34A]">Go</span>
          </span>
        </NavLink>

        {/* Desktop Navigation Links */}
        {isAuthenticated && (
          <nav className="hidden items-center gap-1 xl:gap-2 lg:flex">
            {isPharmacie ? pharmacieLinks : patientLinks}
            <NavLink to="/notifications" className={linkClass}>
              <FiBell className="w-4 h-4" />
              <span>Notifications</span>
            </NavLink>
          </nav>
        )}

        {/* Desktop User Profile / Auth Actions */}
        <div className="hidden items-center gap-3 lg:flex">
          {isAuthenticated ? (
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/60">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-[#16A34A] flex items-center justify-center font-bold text-xs">
                  <FiUser className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-700 max-w-[140px] truncate">
                  {user?.nom ? `${user.prenom} ${user.nom}` : user?.email}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm"
              >
                <FiLogOut className="w-3.5 h-3.5" />
                <span>Déconnexion</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <NavLink
                to="/connexion"
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-all"
              >
                Connexion
              </NavLink>
              <NavLink
                to="/inscription"
                className="rounded-xl bg-[#16A34A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all"
              >
                Créer un compte
              </NavLink>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 text-slate-600 hover:bg-slate-50 lg:hidden transition-colors"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle Navigation"
        >
          {open ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {open && (
        <div className="border-t border-slate-100 bg-white/95 backdrop-blur-lg px-4 pt-3 pb-6 lg:hidden shadow-xl animate-in slide-in-from-top-2 duration-200">
          {isAuthenticated ? (
            <div className="space-y-3">
              {/* Infos Utilisateur Mobile */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#16A34A] flex items-center justify-center font-bold">
                  <FiUser className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-900">
                    {user?.nom ? `${user.prenom} ${user.nom}` : 'Utilisateur'}
                  </span>
                  <span className="text-xs text-slate-500 truncate max-w-[200px]">
                    {user?.email}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                {isPharmacie ? mobilePharmacieLinks : mobilePatientLinks}
                <NavLink
                  to="/notifications"
                  className={mobileLinkClass}
                  onClick={() => setOpen(false)}
                >
                  <FiBell className="w-4 h-4" />
                  <span>Notifications</span>
                </NavLink>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-100 bg-rose-50/50 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-100 transition-colors"
                >
                  <FiLogOut className="w-4 h-4" />
                  <span>Se déconnecter</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2 pt-1">
              <NavLink
                to="/connexion"
                className="w-full text-center rounded-xl py-3 text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 transition-all"
                onClick={() => setOpen(false)}
              >
                Connexion
              </NavLink>
              <NavLink
                to="/inscription"
                className="w-full text-center rounded-xl bg-[#16A34A] py-3 text-sm font-semibold text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all"
                onClick={() => setOpen(false)}
              >
                Créer un compte
              </NavLink>
            </div>
          )}
        </div>
      )}
    </header>
  )
}