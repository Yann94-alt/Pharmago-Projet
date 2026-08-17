import api from "./axios";


/* ==========================
   AUTHENTIFICATION
========================== */

export const login = (data) =>
  api.post("/login", data);


export const register = (data) =>
  api.post("/register", data);


export const logout = () =>
  api.post("/logout");


export const getMe = () =>
  api.get("/me");



/* ==========================
   ADMIN
========================== */


export const invitePharmacie = (data) =>
  api.post(
    "/admin/inviter-pharmacie",
    data
  );


export const getAdminDashboard = () =>
  api.get(
    "/admin/dashboard"
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
/* ==========================
   PHARMACIES
========================== */



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



/* ==========================
   MEDICAMENTS
========================== */


export const getMedicaments = () =>
  api.get("/medicaments");


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



/* ==========================
   ORDONNANCES
========================== */


export const getOrdonnances = () =>
  api.get("/ordonnances");


export const getOrdonnance = (id) =>
  api.get(`/ordonnances/${id}`);


export const createOrdonnance = (data) =>
  api.post(
    "/ordonnances",
    data
  );



/* ==========================
   RESERVATIONS PATIENT
========================== */


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


export const accepterReservation = (id) =>
  api.post(
    `/reservations/${id}/accepter`
  );


export const envoyerPieceIdentite = (id, data) =>
  api.post(
    `/reservations/${id}/piece-identite`,
    data
  );



/* ==========================
   RESERVATIONS PHARMACIE
========================== */


// ===============================
// RÉSERVATIONS PHARMACIE
// ===============================

// Récupérer toutes les réservations de la pharmacie connectée
export const getPharmacieReservations = () =>
  api.get('/pharmacies/reservations')

// Récupérer une réservation précise
export const getPharmacieReservation = (id) =>
  api.get(`/pharmacies/reservations/${id}`)

// Envoyer une proposition au patient
export const analyserReservation = (id, data) =>
  api.post(
    `/pharmacies/reservations/${id}/proposition`,
    data
  )

// Confirmer une réservation après réception de la pièce d'identité
export const confirmerReservation = (id, data) =>
  api.post(
    `/pharmacies/reservations/${id}/confirmer`,
    data
  )

// Modifier le statut de la réservation
export const updateReservationStatut = (id, statut) =>
  api.put(
    `/pharmacies/reservations/${id}/statut`,
    {
      statut
    }
  )
  // Récupérer les documents d'une réservation
export const getReservationDocuments = async (reservationId) => {
  return api.get(`/pharmacies/reservations/${reservationId}/documents`, {
    responseType: 'blob',
  })
}



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