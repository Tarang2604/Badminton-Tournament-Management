// src/services/api.js — Axios instance with JWT interceptor
import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor: Attach JWT to every request ────────────────────────
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: Handle 401 globally ───────────────────────────────
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth Endpoints ──────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  getMe: () => API.get('/auth/me'),
  updateProfile: (data) => API.put('/auth/update-profile', data),
  changePassword: (data) => API.put('/auth/change-password', data),
};

// ─── Tournament Endpoints ─────────────────────────────────────────────────────
export const tournamentAPI = {
  getAll: (params) => API.get('/tournaments', { params }),
  getById: (id) => API.get(`/tournaments/${id}`),
  getStats: () => API.get('/tournaments/stats'),
  create: (data) => API.post('/tournaments', data),
  update: (id, data) => API.put(`/tournaments/${id}`, data),
  updateStatus: (id, status) => API.patch(`/tournaments/${id}/status`, { status }),
  delete: (id) => API.delete(`/tournaments/${id}`),
  generateBracket: (id) => API.post(`/tournaments/${id}/generate-bracket`),
  getBracket: (id) => API.get(`/tournaments/${id}/bracket`),
};

// ─── Match Endpoints ──────────────────────────────────────────────────────────
export const matchAPI = {
  getByTournament: (tournamentId) => API.get(`/matches/tournament/${tournamentId}`),
  getByPlayer: (playerId) => API.get(`/matches/player/${playerId}`),
  getById: (id) => API.get(`/matches/${id}`),
  updateScore: (id, data) => API.put(`/matches/${id}/score`, data),
  schedule: (id, data) => API.patch(`/matches/${id}/schedule`, data),
  walkover: (id, winnerId) => API.patch(`/matches/${id}/walkover`, { winnerId }),
};

// ─── Registration Endpoints ───────────────────────────────────────────────────
export const registrationAPI = {
  register: (data) => API.post('/registrations', data),
  getMyRegistrations: () => API.get('/registrations/my'),
  getByTournament: (tournamentId, params) => API.get(`/registrations/tournament/${tournamentId}`, { params }),
  approve: (id, seed) => API.patch(`/registrations/${id}/approve`, { seed }),
  reject: (id, reason) => API.patch(`/registrations/${id}/reject`, { rejectionReason: reason }),
  withdraw: (id) => API.patch(`/registrations/${id}/withdraw`),
};

// ─── User Endpoints ───────────────────────────────────────────────────────────
export const userAPI = {
  getAll: (params) => API.get('/users', { params }),
  getById: (id) => API.get(`/users/${id}`),
  getLeaderboard: (limit = 10) => API.get('/users/leaderboard', { params: { limit } }),
  updateRole: (id, role) => API.patch(`/users/${id}/role`, { role }),
  deactivate: (id) => API.patch(`/users/${id}/deactivate`),
  delete: (id) => API.delete(`/users/${id}`),
};

export default API;
