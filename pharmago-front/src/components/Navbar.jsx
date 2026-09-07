import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'

import {
  FiMapPin,
  FiPackage,
  FiBell,
  FiLogOut,
  FiUser,
  FiMenu,
  FiX,
  FiTrash2,
  FiChevronDown,
  FiClock,
  FiMail,
  FiPhone,
  FiMapPin as FiAddress,
  FiUsers,
} from 'react-icons/fi'

import { deleteAccount } from '../api/api.js'

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
  const {
    isAuthenticated,
    isPharmacie,
    isAdmin,
    user,
    logout,
  } = useAuth()

  const navigate = useNavigate()

  const [open, setOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  // =========================================================
  // NOM UTILISATEUR
  // =========================================================

  const getUserName = () => {
    if (user?.prenom || user?.nom) {
      return `${user?.prenom || ''} ${user?.nom || ''}`.trim()
    }

    return 'Utilisateur'
  }

  // =========================================================
  // TYPE UTILISATEUR
  // =========================================================

  const getUserType = () => {
    if (isAdmin) {
      return 'Administrateur'
    }

    if (isPharmacie) {
      return 'Pharmacie'
    }

    return 'Patient'
  }

  // =========================================================
  // DECONNEXION
  // =========================================================

  const handleLogout = async () => {
    setOpen(false)
    setProfileOpen(false)

    await logout()

    navigate('/connexion')
  }

  // =========================================================
  // SUPPRESSION DU COMPTE
  // =========================================================

  const handleDeleteAccount = async () => {
    const confirmation = window.confirm(
      'Êtes-vous sûr de vouloir supprimer définitivement votre compte ? Cette action est irréversible.'
    )

    if (!confirmation) {
      return
    }

    try {
      await deleteAccount()

      setProfileOpen(false)
      setOpen(false)

      await logout()

      navigate('/connexion')
    } catch (error) {
      console.error(
        'Erreur lors de la suppression du compte :',
        error
      )

      alert(
        error?.response?.data?.message ||
        'Impossible de supprimer le compte.'
      )
    }
  }

  // =========================================================
  // LIENS PATIENT DESKTOP
  // =========================================================

  const patientLinks = (
    <>
      <NavLink
        to="/"
        end
        className={linkClass}
      >
        <FiMapPin className="w-4 h-4" />
        <span>Pharmacies</span>
      </NavLink>

      <NavLink
        to="/medicaments"
        className={linkClass}
      >
        <FiPackage className="w-4 h-4" />
        <span>Médicaments</span>
      </NavLink>

      <NavLink
        to="/notifications"
        className={linkClass}
      >
        <FiBell className="w-4 h-4" />
        <span>Notifications</span>
      </NavLink>
    </>
  )

  // =========================================================
  // LIENS PHARMACIE DESKTOP
  // =========================================================

  const pharmacieLinks = (
     <NavLink
      to="/pharmacie/historique"
      className={mobileLinkClass}
      onClick={() => setOpen(false)}
    >
      <FiClock className="w-4 h-4" />
      <span>Historique</span>
    </NavLink>
  )

  // =========================================================
  // LIENS ADMIN DESKTOP
  // =========================================================

  const adminLinks = (
    <>
      
      
    </>
  )

  // =========================================================
  // LIENS PATIENT MOBILE
  // =========================================================

  const mobilePatientLinks = (
    <>
      <NavLink
        to="/"
        end
        className={mobileLinkClass}
        onClick={() => setOpen(false)}
      >
        <FiMapPin className="w-4 h-4" />
        <span>Pharmacies</span>
      </NavLink>

      <NavLink
        to="/medicaments"
        className={mobileLinkClass}
        onClick={() => setOpen(false)}
      >
        <FiPackage className="w-4 h-4" />
        <span>Médicaments</span>
      </NavLink>

      <NavLink
        to="/notifications"
        className={mobileLinkClass}
        onClick={() => setOpen(false)}
      >
        <FiBell className="w-4 h-4" />
        <span>Notifications</span>
      </NavLink>
    </>
  )

  // =========================================================
  // LIENS PHARMACIE MOBILE
  // =========================================================

  const mobilePharmacieLinks = (
    <NavLink
      to="/pharmacie/historique"
      className={mobileLinkClass}
      onClick={() => setOpen(false)}
    >
      <FiClock className="w-4 h-4" />
      <span>Historique</span>
    </NavLink>
  )

  // =========================================================
  // LIENS ADMIN MOBILE
  // =========================================================

  const mobileAdminLinks = (
    <>
      <NavLink
        to="/medecins"
        className={mobileLinkClass}
        onClick={() => setOpen(false)}
      >
        <FiUsers className="w-4 h-4" />
        <span>Médecins</span>
      </NavLink>

      <NavLink
        to="/medicaments"
        className={mobileLinkClass}
        onClick={() => setOpen(false)}
      >
        <FiPackage className="w-4 h-4" />
        <span>Médicaments</span>
      </NavLink>

      <NavLink
        to="/"
        end
        className={mobileLinkClass}
        onClick={() => setOpen(false)}
      >
        <FiMapPin className="w-4 h-4" />
        <span>Pharmacies</span>
      </NavLink>
    </>
  )

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/80 backdrop-blur-md">

      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">

        {/* =====================================================
            LOGO
        ====================================================== */}

        <NavLink
          to="/"
          className="flex items-center gap-2.5 group"
        >
          <img
            src="/pwa-192x192.png"
            alt="Logo PharmaGo"
            className="w-16 h-16 object-cover rounded-2xl shadow-md"
          />

          <span className="text-xl font-extrabold tracking-tight text-slate-900">
            Pharma<span className="text-[#16A34A]">Go</span>
          </span>
        </NavLink>

        {/* =====================================================
            NAVIGATION DESKTOP
        ====================================================== */}

        {isAuthenticated && (
          <nav className="hidden items-center gap-1 xl:gap-2 lg:flex">

            {isAdmin
              ? adminLinks
              : isPharmacie
                ? pharmacieLinks
                : patientLinks}

          </nav>
        )}

        {/* =====================================================
            PARTIE DROITE DESKTOP
        ====================================================== */}

        <div className="hidden items-center gap-3 lg:flex">

          {isAuthenticated ? (

            <div className="flex items-center gap-3 pl-2 border-l border-slate-200">

              {/* =================================================
                  PROFIL + MENU
              ================================================== */}

              <div className="relative">

                <button
                  type="button"
                  onClick={() =>
                    setProfileOpen((value) => !value)
                  }
                  className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/60 hover:bg-slate-100 transition-all"
                >

                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-[#16A34A] flex items-center justify-center font-bold text-xs">
                    <FiUser className="w-4 h-4" />
                  </div>

                  <span className="text-xs font-semibold text-slate-700 max-w-[140px] truncate">
                    {getUserName()}
                  </span>

                  <FiChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                      profileOpen
                        ? 'rotate-180'
                        : ''
                    }`}
                  />

                </button>

                {/* =================================================
                    MENU DROPDOWN
                ================================================== */}

                {profileOpen && (

                  <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50">

                    {/* EN-TÊTE */}

                    <div className="px-5 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-slate-100">

                      <div className="flex items-center gap-3">

                        <div className="w-12 h-12 rounded-xl bg-white border border-emerald-100 text-[#16A34A] flex items-center justify-center shadow-sm">

                          <FiUser className="w-6 h-6" />

                        </div>

                        <div className="min-w-0">

                          <p className="text-sm font-bold text-slate-900 truncate">
                            {getUserName()}
                          </p>

                          <p className="text-xs text-[#16A34A] font-semibold mt-0.5">
                            {getUserType()}
                          </p>

                        </div>

                      </div>

                    </div>

                    {/* INFORMATIONS */}

                    <div className="p-4 space-y-1">

                      {/* Email */}

                      {user?.email && (
                        <div className="flex items-start gap-3 px-2.5 py-2.5 rounded-xl hover:bg-slate-50">

                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <FiMail className="w-4 h-4" />
                          </div>

                          <div className="min-w-0">

                            <p className="text-[10px] uppercase tracking-wide font-bold text-slate-400">
                              Email
                            </p>

                            <p className="text-xs font-medium text-slate-700 truncate">
                              {user.email}
                            </p>

                          </div>

                        </div>
                      )}

                      {/* Téléphone */}

                      {user?.telephone && (
                        <div className="flex items-start gap-3 px-2.5 py-2.5 rounded-xl hover:bg-slate-50">

                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <FiPhone className="w-4 h-4" />
                          </div>

                          <div>

                            <p className="text-[10px] uppercase tracking-wide font-bold text-slate-400">
                              Téléphone
                            </p>

                            <p className="text-xs font-medium text-slate-700">
                              {user.telephone}
                            </p>

                          </div>

                        </div>
                      )}

                      {/* Adresse */}

                      {user?.adresse && (
                        <div className="flex items-start gap-3 px-2.5 py-2.5 rounded-xl hover:bg-slate-50">

                          <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                            <FiAddress className="w-4 h-4" />
                          </div>

                          <div className="min-w-0">

                            <p className="text-[10px] uppercase tracking-wide font-bold text-slate-400">
                              Adresse
                            </p>

                            <p className="text-xs font-medium text-slate-700 break-words">
                              {user.adresse}
                            </p>

                          </div>

                        </div>
                      )}

                      {/* Ville */}

                      {user?.ville && (
                        <div className="flex items-start gap-3 px-2.5 py-2.5 rounded-xl hover:bg-slate-50">

                          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                            <FiMapPin className="w-4 h-4" />
                          </div>

                          <div>

                            <p className="text-[10px] uppercase tracking-wide font-bold text-slate-400">
                              Ville
                            </p>

                            <p className="text-xs font-medium text-slate-700">
                              {user.ville}
                            </p>

                          </div>

                        </div>
                      )}

                    </div>

                    {/* SUPPRIMER LE COMPTE */}

                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      className="w-full flex items-center gap-3 px-5 py-3.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 border-t border-slate-100 transition-colors"
                    >

                      <FiTrash2 className="w-4 h-4" />

                      <span>
                        Supprimer mon compte
                      </span>

                    </button>

                  </div>

                )}

              </div>

              {/* =================================================
                  DECONNEXION
              ================================================== */}

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm"
              >

                <FiLogOut className="w-3.5 h-3.5" />

                <span>
                  Déconnexion
                </span>

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
                className="rounded-xl bg-[#16A34A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
              >
                Créer un compte
              </NavLink>

            </div>

          )}

        </div>

        {/* =====================================================
            BOUTON MENU MOBILE
        ====================================================== */}

        <button
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 text-slate-600 hover:bg-slate-50 lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle Navigation"
        >

          {open
            ? <FiX className="h-5 w-5" />
            : <FiMenu className="h-5 w-5" />
          }

        </button>

      </div>

      {/* =========================================================
          MENU MOBILE
      ========================================================== */}

      {open && (

        <div className="border-t border-slate-100 bg-white/95 px-4 pt-3 pb-6 lg:hidden shadow-xl">

          {isAuthenticated ? (

            <div className="space-y-3">

              {/* INFORMATIONS UTILISATEUR */}

              <div className="rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 p-4">

                <div className="flex items-center gap-3 mb-4">

                  <div className="w-11 h-11 rounded-xl bg-white border border-emerald-100 text-[#16A34A] flex items-center justify-center shadow-sm">

                    <FiUser className="w-5 h-5" />

                  </div>

                  <div className="min-w-0">

                    <p className="text-sm font-bold text-slate-900 truncate">
                      {getUserName()}
                    </p>

                    <p className="text-xs font-semibold text-[#16A34A]">
                      {getUserType()}
                    </p>

                  </div>

                </div>

                {/* INFOS */}

                <div className="space-y-2.5">

                  {/* Email */}

                  {user?.email && (
                    <div className="flex items-center gap-3 bg-white/70 rounded-xl p-2.5">

                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <FiMail className="w-4 h-4" />
                      </div>

                      <div className="min-w-0">

                        <p className="text-[10px] uppercase tracking-wide font-bold text-slate-400">
                          Email
                        </p>

                        <p className="text-xs font-medium text-slate-700 truncate">
                          {user.email}
                        </p>

                      </div>

                    </div>
                  )}

                  {/* Téléphone */}

                  {user?.telephone && (
                    <div className="flex items-center gap-3 bg-white/70 rounded-xl p-2.5">

                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <FiPhone className="w-4 h-4" />
                      </div>

                      <div>

                        <p className="text-[10px] uppercase tracking-wide font-bold text-slate-400">
                          Téléphone
                        </p>

                        <p className="text-xs font-medium text-slate-700">
                          {user.telephone}
                        </p>

                      </div>

                    </div>
                  )}

                  {/* Adresse */}

                  {user?.adresse && (
                    <div className="flex items-center gap-3 bg-white/70 rounded-xl p-2.5">

                      <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                        <FiAddress className="w-4 h-4" />
                      </div>

                      <div className="min-w-0">

                        <p className="text-[10px] uppercase tracking-wide font-bold text-slate-400">
                          Adresse
                        </p>

                        <p className="text-xs font-medium text-slate-700 break-words">
                          {user.adresse}
                        </p>

                      </div>

                    </div>
                  )}

                  {/* Ville */}

                  {user?.ville && (
                    <div className="flex items-center gap-3 bg-white/70 rounded-xl p-2.5">

                      <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <FiMapPin className="w-4 h-4" />
                      </div>

                      <div>

                        <p className="text-[10px] uppercase tracking-wide font-bold text-slate-400">
                          Ville
                        </p>

                        <p className="text-xs font-medium text-slate-700">
                          {user.ville}
                        </p>

                      </div>

                    </div>
                  )}

                </div>

              </div>

              {/* =================================================
                  NAVIGATION MOBILE
              ================================================== */}

              <div className="space-y-1">

                {isAdmin
                  ? mobileAdminLinks
                  : isPharmacie
                    ? mobilePharmacieLinks
                    : mobilePatientLinks}

              </div>

              {/* =================================================
                  SUPPRESSION DU COMPTE
              ================================================== */}

              <button
                type="button"
                onClick={handleDeleteAccount}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-100 bg-rose-50/50 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-100 transition-colors"
              >

                <FiTrash2 className="w-4 h-4" />

                <span>
                  Supprimer mon compte
                </span>

              </button>

              {/* =================================================
                  DECONNEXION
              ================================================== */}

              <div className="pt-2 border-t border-slate-100">

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
                >

                  <FiLogOut className="w-4 h-4" />

                  <span>
                    Se déconnecter
                  </span>

                </button>

              </div>

            </div>

          ) : (

            <div className="flex flex-col gap-2 pt-1">

              <NavLink
                to="/connexion"
                className="w-full text-center rounded-xl py-3 text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100"
                onClick={() => setOpen(false)}
              >
                Connexion
              </NavLink>

              <NavLink
                to="/inscription"
                className="w-full text-center rounded-xl bg-[#16A34A] py-3 text-sm font-semibold text-white hover:bg-emerald-700"
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
