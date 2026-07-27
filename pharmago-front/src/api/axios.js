import axios from 'axios';

const api = axios.create({
  //baseURL: "http://127.0.0.1:8000/api",http://192.168.1.151:8000/api
  baseURL: "http://127.0.0.1:8000/api",
  headers: {
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pharmago_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('pharmago_token');
      localStorage.removeItem('pharmago_user');

      // Évite de recharger inutilement si on est déjà sur la page connexion
      if (window.location.pathname !== '/connexion') {
        window.location.href = '/connexion';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
