import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Store role in localStorage for frontend routing
export const storeUserRole = (roleId) => {
  localStorage.setItem('userRole', roleId);
};

export const getUserRole = () => {
  return localStorage.getItem('userRole');
};

// Auth API calls
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  getCurrentUser: () => api.get('/api/auth/me'),
};

// Profile API calls
export const profileAPI = {
  create: (data) => api.post('/api/profile/create', data),
  get: () => api.get('/api/profile/'),
  update: (data) => api.put('/api/profile/update', data),
  delete: () => api.delete('/api/profile/'),
};

// Lifestyle API calls
export const lifestyleAPI = {
  log: (data) => api.post('/api/lifestyle/log', data),
  getLog: (date) => api.get(`/api/lifestyle/log/${date}`),
  getHistory: (days = 7) => api.get(`/api/lifestyle/history?days=${days}`),
  update: (date, data) => api.put(`/api/lifestyle/log/${date}`, data),
  delete: (date) => api.delete(`/api/lifestyle/log/${date}`),
};

export default api;