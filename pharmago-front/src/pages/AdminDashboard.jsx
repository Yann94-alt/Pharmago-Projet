import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Building2, 
  Mail, 
  UserCheck, 
  UserX, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Plus, 
  X, 
  AlertCircle,
  Loader2,
  TrendingUp,
  Sparkles,
  LogOut,
  Lock,
  User
} from 'lucide-react';
import api from '../api/axios';

const AdminDashboard = () => {
  const navigate = useNavigate();

  // États des données du dashboard
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // États de la modal d'invitation (pharmacie)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState(null);
  const [inviteSuccess, setInviteSuccess] = useState(null);

  // États de la modal de création d'administrateur
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminForm, setAdminForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    password_confirmation: ''
  });
  const [adminSubmitting, setAdminSubmitting] = useState(false);
  const [adminError, setAdminError] = useState(null);
  const [adminSuccess, setAdminSuccess] = useState(null);

  // Fonction de chargement du dashboard
  const loadDashboard = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await api.get('/admin/dashboard');
      setDashboardData(response.data.data);
    } catch (err) {
      console.error("Erreur chargement dashboard:", err);
      if (err.response && err.response.status === 403) {
        navigate('/connexion');
      } else {
        setError("Impossible de charger les données du tableau de bord.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // Fonction de déconnexion
  const handleLogout = async () => {
    try {
      // Optionnel : appeler une route de déconnexion si l'API en possède une
      // await api.post('/logout');
    } catch (err) {
      console.error("Erreur lors de la déconnexion:", err);
    } finally {
      localStorage.removeItem('token');
      navigate('/connexion');
    }
  };

  // Gestion de l'envoi de l'invitation pharmacie
  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setInviteError(null);
    setInviteSuccess(null);

    try {
      await api.post('/admin/inviter-pharmacie', { email });
      setInviteSuccess("Invitation pharmacie envoyée avec succès.");
      setEmail('');
      await loadDashboard(true);
      
      setTimeout(() => {
        setIsModalOpen(false);
        setInviteSuccess(null);
      }, 1500);
    } catch (err) {
      console.error("Erreur invitation pharmacie:", err);
      if (err.response && err.response.data && err.response.data.errors && err.response.data.errors.email) {
        setInviteError(err.response.data.errors.email[0]);
      } else if (err.response && err.response.data && err.response.data.message) {
        setInviteError(err.response.data.message);
      } else {
        setInviteError("Une erreur est survenue lors de l'envoi de l'invitation.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Gestion de la création d'un administrateur
  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setAdminSubmitting(true);
    setAdminError(null);
    setAdminSuccess(null);

    try {
      await api.post('/admin/admins', adminForm);
      setAdminSuccess("Administrateur créé avec succès.");
      setAdminForm({
        nom: '',
        prenom: '',
        email: '',
        password: '',
        password_confirmation: ''
      });
      await loadDashboard(true);

      setTimeout(() => {
        setIsAdminModalOpen(false);
        setAdminSuccess(null);
      }, 1500);
    } catch (err) {
      console.error("Erreur création admin:", err);
      if (err.response && err.response.data && err.response.data.errors) {
        // Prend la première erreur du tableau d'erreurs Laravel
        const firstErrorKey = Object.keys(err.response.data.errors)[0];
        setAdminError(err.response.data.errors[firstErrorKey][0]);
      } else if (err.response && err.response.data && err.response.data.message) {
        setAdminError(err.response.data.message);
      } else {
        setAdminError("Une erreur est survenue lors de la création de l'administrateur.");
      }
    } finally {
      setAdminSubmitting(false);
    }
  };

  // Affichage du chargement initial
  if (loading) {
    return (
      <div className="min-h-screen bg-emerald-50/50 flex flex-col justify-center items-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center animate-pulse">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
        <p className="text-slate-600 font-medium mt-4 text-sm tracking-wide">Chargement de votre espace...</p>
      </div>
    );
  }

  // Affichage de l'erreur de chargement
  if (error) {
    return (
      <div className="min-h-screen bg-emerald-50/50 flex flex-col justify-center items-center p-6">
        <div className="bg-white p-8 rounded-3xl border border-emerald-100 max-w-md w-full text-center shadow-xl">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Erreur de chargement</h2>
          <p className="text-slate-600 text-sm mb-6">{error}</p>
          <button
            onClick={() => loadDashboard()}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-2xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const { users, pharmacies, invitations } = dashboardData || {};

  const totalUsers = users?.total || 0;
  const activeUsers = users?.active || 0;
  const inactiveUsers = users?.inactive || 0;
  const activePercentage = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/30 text-slate-800 pb-16">
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-emerald-100 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:h-24 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-md shadow-emerald-600/20 text-white shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Tableau de bord</h1>
                <p className="text-xs text-emerald-700 font-medium flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Plateforme active & sécurisée</span>
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="sm:hidden p-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all cursor-pointer"
              title="Se déconnecter"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end flex-wrap">
            <button
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-white hover:bg-emerald-50/50 text-slate-700 text-sm font-medium transition-all disabled:opacity-50 shadow-2xs cursor-pointer"
              title="Actualiser les données"
            >
              <RefreshCw className={`w-4 h-4 text-emerald-600 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualiser</span>
            </button>

            {/* Bouton pour ouvrir la modal de création d'admin */}
            <button
              onClick={() => {
                setAdminError(null);
                setAdminSuccess(null);
                setAdminForm({ nom: '', prenom: '', email: '', password: '', password_confirmation: '' });
                setIsAdminModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold text-sm transition-all shadow-md shadow-purple-600/25 active:scale-[0.98] cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Créer un admin</span>
            </button>

            <button
              onClick={() => {
                setInviteError(null);
                setInviteSuccess(null);
                setEmail('');
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold text-sm transition-all shadow-md shadow-emerald-600/20 active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Inviter une pharmacie</span>
            </button>

            <button
              onClick={handleLogout}
              className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-sm font-semibold transition-all shadow-2xs cursor-pointer"
              title="Quitter l'application"
            >
              <LogOut className="w-4 h-4" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Section 1 : 4 Grandes Cartes Statistiques Principales */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            <div className="bg-white p-6 rounded-3xl border border-emerald-100/80 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-0 group-hover:scale-110 transition-transform"></div>
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Utilisateurs</p>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">{users?.total ?? 0}</h3>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center shadow-xs">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-emerald-100/80 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-bl-full -z-0 group-hover:scale-110 transition-transform"></div>
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Patients</p>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">{users?.patients ?? 0}</h3>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-blue-100/80 text-blue-700 flex items-center justify-center shadow-xs">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-emerald-100/80 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-0 group-hover:scale-110 transition-transform"></div>
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Pharmacies</p>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">{users?.pharmacies ?? 0}</h3>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center shadow-xs">
                  <Building2 className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-emerald-100/80 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50/50 rounded-bl-full -z-0 group-hover:scale-110 transition-transform"></div>
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Administrateurs</p>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">{users?.admins ?? 0}</h3>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-purple-100/80 text-purple-700 flex items-center justify-center shadow-xs">
                  <ShieldAlert className="w-6 h-6" />
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Section 2 : Grid pour Utilisateurs Actifs/Inactifs et Invitations Pharmacies */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <section className="bg-white p-8 rounded-3xl border border-emerald-100/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">État des utilisateurs</h3>
                  <p className="text-xs text-slate-500">Répartition par statut d'activité</p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-100">
                  Total : {totalUsers}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div 
                  onClick={() => navigate('/admin/patients')}
                  className="bg-emerald-50/40 border border-emerald-200/80 p-5 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-emerald-100/50 transition-all group shadow-2xs"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-emerald-800 mb-0.5">Actifs</p>
                    <h4 className="text-2xl font-black text-slate-900">{activeUsers}</h4>
                  </div>
                </div>

                <div className="bg-rose-50/40 border border-rose-200/80 p-5 rounded-2xl flex items-center gap-4 shadow-2xs">
                  <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                    <UserX className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-rose-800 mb-0.5">Inactifs</p>
                    <h4 className="text-2xl font-black text-slate-900">{inactiveUsers}</h4>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-2">
                <span className="flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Taux d'activité global</span>
                <span className="text-emerald-800">{activePercentage}% actifs</span>
              </div>
              <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden flex p-0.5 border border-slate-200">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full rounded-full transition-all duration-500 shadow-2xs" 
                  style={{ width: `${activePercentage}%` }}
                />
              </div>
            </div>
          </section>

          <section className="bg-white p-8 rounded-3xl border border-emerald-100/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Invitations pharmacies</h3>
                  <p className="text-xs text-slate-500">Suivi des liens d'invitation envoyés</p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-100">
                  Total : {invitations?.total ?? 0}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-blue-100 bg-blue-50/40 flex items-center gap-3.5 shadow-2xs">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-blue-800">Total</p>
                    <h4 className="text-lg font-black text-slate-900">{invitations?.total ?? 0}</h4>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-amber-100 bg-amber-50/40 flex items-center gap-3.5 shadow-2xs">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-amber-800">En attente</p>
                    <h4 className="text-lg font-black text-slate-900">{invitations?.pending ?? 0}</h4>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/40 flex items-center gap-3.5 shadow-2xs">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-emerald-800">Utilisées</p>
                    <h4 className="text-lg font-black text-slate-900">{invitations?.used ?? 0}</h4>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-rose-100 bg-rose-50/40 flex items-center gap-3.5 shadow-2xs">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-rose-800">Expirées</p>
                    <h4 className="text-lg font-black text-slate-900">{invitations?.expired ?? 0}</h4>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Pharmacies enregistrées au total :</span>
              <span className="font-bold text-slate-900 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">{pharmacies?.total ?? 0}</span>
            </div>
          </section>

        </div>

      </main>

      {/* Modal "Inviter une pharmacie" */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-emerald-100 max-w-md w-full overflow-hidden transition-all transform scale-100">
            
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-emerald-50/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Inviter une pharmacie</h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="p-6 space-y-4">
              
              {inviteSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-2xl flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                  <span className="font-medium">{inviteSuccess}</span>
                </div>
              )}

              {inviteError && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-2xl flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
                  <span className="font-medium">{inviteError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Adresse email de la pharmacie
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="pharmacie@exemple.com"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm text-slate-900 placeholder:text-slate-400 transition-all shadow-2xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-all disabled:opacity-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold text-sm transition-all flex items-center gap-2 disabled:opacity-50 shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                  <span>Envoyer l'invitation</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Modal "Créer un administrateur" */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-purple-100 max-w-md w-full overflow-hidden transition-all transform scale-100 max-h-[90vh] flex flex-col">
            
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-purple-50/30 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Créer un administrateur</h3>
              </div>
              <button 
                onClick={() => setIsAdminModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdminSubmit} className="p-6 space-y-4 overflow-y-auto">
              
              {adminSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-2xl flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                  <span className="font-medium">{adminSuccess}</span>
                </div>
              )}

              {adminError && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-2xl flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
                  <span className="font-medium">{adminError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Nom
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={adminForm.nom}
                      onChange={(e) => setAdminForm({...adminForm, nom: e.target.value})}
                      placeholder="Nom"
                      className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 text-sm text-slate-900 placeholder:text-slate-400 transition-all shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Prénom
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={adminForm.prenom}
                      onChange={(e) => setAdminForm({...adminForm, prenom: e.target.value})}
                      placeholder="Prénom"
                      className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 text-sm text-slate-900 placeholder:text-slate-400 transition-all shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Adresse email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={adminForm.email}
                    onChange={(e) => setAdminForm({...adminForm, email: e.target.value})}
                    placeholder="admin@exemple.com"
                    className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 text-sm text-slate-900 placeholder:text-slate-400 transition-all shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Mot de passe (8 car. min)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={adminForm.password}
                    onChange={(e) => setAdminForm({...adminForm, password: e.target.value})}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 text-sm text-slate-900 placeholder:text-slate-400 transition-all shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={adminForm.password_confirmation}
                    onChange={(e) => setAdminForm({...adminForm, password_confirmation: e.target.value})}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 text-sm text-slate-900 placeholder:text-slate-400 transition-all shadow-2xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAdminModalOpen(false)}
                  disabled={adminSubmitting}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-all disabled:opacity-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={adminSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold text-sm transition-all flex items-center gap-2 disabled:opacity-50 shadow-md shadow-purple-600/20 cursor-pointer"
                >
                  {adminSubmitting && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                  <span>Créer l'administrateur</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;