import api from "./axios";

export const login = (data) =>
  api.post("/connexion", data);
 
export const register = (data) =>
  api.post("/inscription", data);

export const logout = () =>
  api.post("/logout");
 
 
export const getMe = () =>
  api.get("/me");
 
 
export const invitePharmacie = (data) =>
  api.post(
    "/admin/inviter-pharmacie",
    data
  );
 
 
export const getAdminDashboard = () =>
  api.get(
    "/admin/dashboard"
  );
 

  export const createAdmin = (data) =>
  api.post(
    "/admin/admins",
    data
  );
 
export const verifyInvitation = (token) =>
  api.get(
    `/admin/invitation/${token}`
  );
 
// Récupérer la liste des utilisateurs
export const getAdminUsers = () =>
  api.get(
    "/admin/users"
  );
 
 
// Supprimer un utilisateur
export const deleteAdminUser = (id) =>
  api.delete(
    `/admin/users/${id}`
  );

export const registerPharmacy = (token, data) =>
  api.post(
    `/pharmacie/register/${token}`,
    data
  );
 
export const getPharmacies = () =>
  api.get("/pharmacies");
 
 
export const getPharmacie = (id) =>
  api.get(`/pharmacies/${id}`);
 
 
export const getPharmaciesDeGarde = () =>
  api.get("/pharmacies/garde");
 
 
export const searchPharmacies = (params) =>
  api.get(
    "/pharmacies/search",
    {
      params
    }
  );
 
  export const accepterReservation = (id) => {
  return api.post(`/reservations/${id}/accepter`)
}
 
// Pharmacies de garde proches
export const getNearbyPharmacies = (params) =>
  api.get(
    "/pharmacies/nearby",
    {
      params
    }
  );
 
 
// Pharmacies partenaires proches
export const getNearbyPartnerPharmacies = (params) =>
  api.get(
    "/pharmacies/nearby-partners",
    {
      params
    }
  );
 
export const createPharmacie = (data) =>
  api.post(
    "/pharmacies",
    data
  );
 
 
export const updatePharmacie = (id, data) =>
  api.put(
    `/pharmacies/${id}`,
    data
  );
export const getMedicaments = (params = {}) =>
  api.get("/medicaments", {
    params
  });

  export const getMedicamentsPharmacie = () =>
  api.get('/pharmacies/medicaments')

 
 
export const getMedicament = (id) =>
  api.get(`/medicaments/${id}`);
 
 
export const createMedicament = (data) =>
  api.post(
    "/medicaments",
    data
  );
 
 
export const updateMedicament = (id, data) =>
  api.put(
    `/medicaments/${id}`,
    data
  );
 
 
export const deleteMedicament = (id) =>
  api.delete(
    `/medicaments/${id}`
  );
 
 export const forgotPassword = (email) => {
  return api.post('/auth/forgot-password', {
    email,
  })
}
export const resetPassword = ({
  email,
  token,
  password,
  password_confirmation,
}) => {
  return api.post('/auth/reset-password', {
    email,
    token,
    password,
    password_confirmation,
  })
}


export const getOrdonnances = () =>
  api.get("/ordonnances");
 
export const deleteAccount = () => {
  return api.delete('/auth/delete-account')
}
 
export const getOrdonnance = (id) =>
  api.get(`/ordonnances/${id}`);
 
 
export const createOrdonnance = (data) =>
  api.post(
    "/ordonnances",
    data
  );
 
export const getBeneficiaires = () => {
  return api.get('/beneficiaires')
}
// Créer un bénéficiaire
export const createBeneficiaire = (data) => {
  return api.post('/beneficiaires', data)
}
export const getReservations = () =>
  api.get("/reservations");
 
 
export const getReservation = (id) =>
  api.get(`/reservations/${id}`);
 
 
export const createReservation = (data) =>
  api.post(
    "/reservations",
    data
  );
 export const getHistoriqueReservations = async (annee = '', mois = '') => {
  const params = {}

  if (annee) {
    params.annee = annee
  }

  if (mois) {
    params.mois = mois
  }

  return api.get('/pharmacie/historique-reservations', {
    params,
  })
}
export const confirmerReservation = (id) =>
  api.post(
    `/reservations/${id}/confirmer`
  );
 
 
// Annuler une réservation avant qu'elle ne soit confirmée
export const annulerReservation = (id) =>
  api.post(
    `/reservations/${id}/annuler`
  );
 
 
 
/* ==========================
   RESERVATIONS PHARMACIE
========================== */
 
 
// Récupérer toutes les réservations de la pharmacie connectée
export const getPharmacieReservations = () =>
  api.get('/pharmacies/reservations')
 
// Récupérer une réservation précise
export const getPharmacieReservation = (id) =>
  api.get(`/pharmacies/reservations/${id}`)
 
// Envoyer une proposition au patient (analyse de l'ordonnance)
export const analyserReservation = (id, data) =>
  api.post(
    `/pharmacies/reservations/${id}/proposition`,
    data
  )
 
// Modifier le statut de la réservation (prete, remise)
export const updateReservationStatut = (id, statut) =>
  api.put(
    `/pharmacies/reservations/${id}/statut`,
    {
      statut
    }
  )
 
// Récupérer la liste des documents (chemins) d'une réservation
export const getReservationDocuments = (id) =>
  api.get(`/pharmacies/reservations/${id}/documents`)
 
// Récupérer un document précis en tant que fichier (blob)
// type : 'ordonnance' | 'assurance' | 'bon'
export const getReservationDocument = (id, type) =>
  api.get(`/pharmacies/reservations/${id}/documents/${type}`, {
    responseType: 'blob'
  })
 
 
 
/* ==========================
   ASSURANCES
========================== */
 
 
export const getAssurances = () =>
  api.get("/assurances");
 
 
export const createAssurance = (data) =>
  api.post(
    "/assurances",
    data
  );
 
 
export const deleteAssurance = (id) =>
  api.delete(
    `/assurances/${id}`
  );
 
 
 
/* ==========================
   FACTURES
========================== */
 
 
export const createFacture = (data) =>
  api.post(
    "/factures",
    data
  );
 
 
export const getFacture = (id) =>
  api.get(
    `/factures/${id}`
  );
 
 
 
/* ==========================
   QR CODES
========================== */
 
 
export const scannerQrCode = (data) =>
  api.post(
    "/qrcodes/scanner",
    data
  );
 
 
export const utiliserQrCode = (code) =>
  api.put(
    `/qrcodes/${code}/utiliser`
  );
 
 
 
/* ==========================
   NOTIFICATIONS
========================== */
 
 
export const getNotifications = () =>
  api.get("/notifications");
 
 
export const marquerNotificationLue = (id) =>
  api.put(
    `/notifications/${id}/lu`
  );
 
 
export const marquerToutesLues = () =>
  api.put(
    "/notifications/lire-tout"
  );
 
export const supprimerNotification = (id) =>
  api.delete(
    `/notifications/${id}`
  );