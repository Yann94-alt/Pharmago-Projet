import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Building2, 
  ArrowLeft, 
  Trash2, 
  RefreshCw, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  Search,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { getAdminUsers, deleteAdminUser } from '../api/api.js';

const AdminPatients = () => {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // États pour la modal de confirmation de suppression
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState(null);

  // Charger tous les utilisateurs
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAdminUsers();
      const allUsers = response.data.data || response.data;
      setUsers(allUsers);
    } catch (err) {
      console.error("Erreur lors du chargement des utilisateurs :", err);
      if (err.response && err.response.status === 403) {
        navigate('/login');
      } else {
        setError("Impossible de charger les données.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Formatage de la date en français
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  // Ouvrir la modal de suppression
  const confirmDelete = (user) => {
    setUserToDelete(user);
    setActionError(null);
    setDeleteModalOpen(true);
  };

  // Exécuter la suppression
  const handleDelete = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    setActionError(null);

    try {
      await deleteAdminUser(userToDelete.id);
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      setDeleteModalOpen(false);
      setUserToDelete(null);
    } catch (err) {
      console.error("Erreur suppression utilisateur :", err);
      setActionError("Une erreur est survenue lors de la suppression.");
    } finally {
      setDeleting(false);
    }
  };

  // Filtrer les utilisateurs selon la recherche
  const filteredUsers = users.filter(u => {
    const query = searchQuery.toLowerCase();
    const fullName = `${u.prenom || ''} ${u.nom || ''}`.toLowerCase();
    const email = (u.email || '').toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  const patientsList = filteredUsers.filter(u => u.role === 'patient');
  const pharmaciesList = filteredUsers.filter(u => u.role === 'pharmacie');

  // Composant de liste partagé (Table sur Desktop, Cartes empilées sur Mobile)
  const renderUserList = (list, typeLabel) => {
    if (list.length === 0) {
      return (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-400 text-sm font-medium shadow-xs">
          Aucun {typeLabel.toLowerCase()} ne correspond à votre recherche.
        </div>
      );
    }

    return (
      <>
        {/* Version Mobile / Tablette (Cartes empilées) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
          {list.map((user) => (
            <div key={user.id} className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {user.prenom || '—'} {user.nom || '—'}
                  </h3>
                  {user.is_active ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shrink-0">
                      <CheckCircle2 className="w-3 h-3" /> Actif
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60 shrink-0">
                      <XCircle className="w-3 h-3" /> Inactif
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 break-all font-medium">{user.email}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Inscrit le {formatDate(user.created_at)}</span>
                <button
                  onClick={() => confirmDelete(user)}
                  className="p-2 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg transition-all inline-flex items-center gap-1 font-semibold cursor-pointer"
                  title="Supprimer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Supprimer</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Version Grand Écran (Table classique optimisée) */}
        <div className="hidden lg:block bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Identité</th>
                  <th className="py-3.5 px-6">Email</th>
                  <th className="py-3.5 px-6">Statut</th>
                  <th className="py-3.5 px-6">Inscription</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium">
                {list.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="py-4 px-6 text-slate-900 font-semibold">
                      {user.prenom || '—'} {user.nom || '—'}
                    </td>
                    <td className="py-4 px-6 text-slate-600 font-normal">{user.email}</td>
                    <td className="py-4 px-6">
                      {user.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/60">
                          <XCircle className="w-3.5 h-3.5" /> Inactif
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-500 font-normal">{formatDate(user.created_at)}</td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => confirmDelete(user)}
                        className="p-2 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg transition-all inline-flex items-center justify-center cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-16">
      
      {/* Top Header Banner Responsive */}
      <div className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1.5">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors border border-slate-700/50 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Retour au dashboard</span>
              </button>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight flex flex-wrap items-center gap-2.5 pt-1">
                <span>Annuaire des Utilisateurs</span>
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  <Sparkles className="w-3 h-3" /> Admin
                </span>
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm">
                Supervisez et gérez l'ensemble des patients et structures pharmaceutiques.
              </p>
            </div>

            <div className="flex items-center self-start sm:self-auto">
              <button
                onClick={fetchUsers}
                disabled={loading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Actualiser</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 sm:-mt-6 space-y-8">
        
        {/* Search Bar Floating Card */}
        <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 flex items-center justify-between gap-4">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom, prénom ou email..."
              className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 transition-all font-medium"
            />
          </div>
        </div>

        {/* Global States */}
        {loading && users.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center flex flex-col items-center justify-center shadow-xs">
            <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4" />
            <p className="text-slate-600 font-semibold text-sm">Chargement des données en cours...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 text-center max-w-md mx-auto shadow-xs">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Incident technique</h2>
            <p className="text-slate-500 text-sm mb-6">{error}</p>
            <button
              onClick={fetchUsers}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm shadow-md cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Réessayer
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            
            {/* SECTION 1 : PATIENTS */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 shadow-2xs">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">Patients</h2>
                    <p className="text-[11px] sm:text-xs text-slate-500">Utilisateurs inscrits en tant que patients</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-3 py-1 bg-teal-50 text-teal-700 rounded-full border border-teal-100">
                  {patientsList.length}
                </span>
              </div>

              {renderUserList(patientsList, "Patient")}
            </section>

            {/* SECTION 2 : PHARMACIES */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-2xs">
                    <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">Pharmacies</h2>
                    <p className="text-[11px] sm:text-xs text-slate-500">Officines et pharmacies partenaires</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                  {pharmaciesList.length}
                </span>
              </div>

              {renderUserList(pharmaciesList, "Pharmacie")}
            </section>

          </div>
        )}

      </main>

      {/* Modern Dialog Modal (Responsive) */}
      {deleteModalOpen && userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden p-5 sm:p-6 space-y-5 sm:space-y-6">
            
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shrink-0 border border-rose-100 shadow-sm">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Confirmation requise</h3>
                <p className="text-xs text-slate-500">Cette action de suppression est définitive.</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3.5 sm:p-4 border border-slate-200/60 text-xs sm:text-sm text-slate-600">
              Voulez-vous vraiment supprimer le compte de <span className="font-bold text-slate-900">{userToDelete.prenom} {userToDelete.nom}</span> ? Toutes les données associées seront perdues.
            </div>

            {actionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-rose-900/20 cursor-pointer"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Supprimer définitivement</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPatients;