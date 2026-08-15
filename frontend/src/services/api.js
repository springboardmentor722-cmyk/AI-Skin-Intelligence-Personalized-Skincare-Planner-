// frontend/src/services/api.js

import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to all requests EXCEPT login and register
api.interceptors.request.use((config) => {
  // Skip token for auth endpoints
  if (config.url === '/login' || config.url === '/register' || config.url === '/register/professional') {
    return config;
  }
  const token = localStorage.getItem('token');
  if (token) {
    config.params = { ...config.params, token };
  }
  return config;
});

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      if (window.location.pathname !== '/login') {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ============================================================
// AUTHENTICATION
// ============================================================

export const login = (email, password) => {
  const formData = new FormData();
  formData.append('username', email);
  formData.append('password', password);
  return api.post('/login', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
};

export const register = (userData) => {
  return api.post('/register', userData);
};

export const registerProfessional = (userData) => {
  return api.post('/register/professional', userData);
};

// ============================================================
// SKIN PROFILE
// ============================================================

export const getSkinProfile = (params) => api.get('/skin-profile', { params });
export const createSkinProfile = (data) => api.post('/skin-profile', data);
export const updateSkinProfile = (data) => api.put('/skin-profile', data);

// ============================================================
// ASSESSMENT
// ============================================================

export const getAssessmentScore = (params) => api.get('/api/v1/assessment/score', { params });
export const evaluateAssessment = () => api.post('/api/v1/assessment/evaluate');

// ============================================================
// ROUTINE
// ============================================================

export const getRoutine = (params) => api.get('/api/v1/routine', { params });
export const toggleRoutineStep = (stepId) => api.post('/api/v1/routine/toggle', null, { params: { step_id: stepId } });
export const getRoutineStreak = () => api.get('/api/v1/routine/streak');

// ============================================================
// PRODUCTS
// ============================================================

export const getProducts = (params) => api.get('/api/v1/products', { params });
export const getProductDetail = (productId) => api.get(`/api/v1/products/${productId}`);
export const getProductCategories = () => api.get('/api/v1/products/categories');
export const getProductRecommendations = (params) => api.get('/api/v1/products/recommendations', { params });
export const recommendProduct = (data) => api.post('/api/v1/products/recommend', data);

// ============================================================
// INGREDIENTS
// ============================================================

export const searchIngredients = (q, limit) => api.get('/api/v1/ingredients/search', { params: { q, limit } });
export const getIngredientDetail = (ingredientId) => api.get(`/api/v1/ingredients/${ingredientId}`);
export const getIngredientSafety = (ingredientName) => api.get(`/api/v1/ingredients/safety-rating/${ingredientName}`);
export const getProductsByIngredient = (ingredientId, limit) => api.get(`/api/v1/ingredients/${ingredientId}/products`, { params: { limit } });

// ============================================================
// APPOINTMENTS
// ============================================================

export const bookAppointment = (data) => api.post('/appointments/book', data);
export const getMyAppointments = () => api.get('/appointments/my-appointments');
export const updateAppointmentStatus = (appointmentId, data) => api.put(`/appointments/${appointmentId}/status`, data);

// ============================================================
// AI ANALYSIS
// ============================================================

export const analyzeSkin = (formData) => {
  return api.post('/api/v1/ai-analyze', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
export const getLatestAIAnalysis = (params) => api.get('/api/v1/ai-analysis/latest', { params });
export const submitAIFeedback = (data) => api.post('/api/v1/ai-analysis/feedback', data);

// ============================================================
// PHOTOS
// ============================================================

export const uploadPhoto = (formData) => {
  return api.post('/api/v1/photos/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
export const getPhotos = (params) => api.get('/api/v1/photos', { params });
export const getPhotoComparison = (params) => api.get('/api/v1/photos/comparison', { params });
export const deletePhoto = (photoId) => api.delete(`/api/v1/photos/${photoId}`);

// ============================================================
// PROGRESS
// ============================================================

export const getAdherence = (params) => api.get('/api/v1/progress/adherence', { params });
export const getScoreHistory = (params) => api.get('/api/v1/progress/score-history', { params });
export const getProgressSummary = () => api.get('/api/v1/progress/summary');
export const getProgressInsights = () => api.get('/api/v1/progress/insights');

// ============================================================
// PROFESSIONALS
// ============================================================

export const getApprovedProfessionals = () => api.get('/professionals/approved');
export const requestConsultation = (data) => api.post('/consultation/request', data);

// ============================================================
// CONSULTANT DASHBOARD
// ============================================================

export const getConsultantReviews = () => api.get('/consultant/reviews');
export const getConsultantClients = () => api.get('/consultant/clients');
export const getConsultantAssessments = () => api.get('/consultant/assessments');
export const getClientRoutine = (userId) => api.get(`/consultant/client/${userId}/routine`);
export const updateClientRoutine = (userId, data) => api.put(`/consultant/client/${userId}/routine`, data);
export const recommendProductToClient = (data) => api.post('/consultant/recommend-product', data);

// ============================================================
// DERMATOLOGIST DASHBOARD
// ============================================================

export const getDermatologistPatients = () => api.get('/dermatologist/patients');
export const getDermatologistAssessments = () => api.get('/dermatologist/assessments');
export const getPatientTreatmentPlan = (userId) => api.get(`/dermatologist/patient/${userId}/treatment-plan`);
export const updatePatientTreatmentPlan = (userId, data) => api.put(`/dermatologist/patient/${userId}/treatment-plan`, data);
export const createPrescription = (data) => api.post('/dermatologist/prescription', data);
export const getPatientPrescriptions = (patientId) => api.get(`/dermatologist/prescriptions/${patientId}`);

// ============================================================
// PROFESSIONAL - PATIENT DATA ACCESS
// ============================================================

export const getPatientAIAnalysis = (userId) => api.get(`/professional/patient/${userId}/ai-analysis`);
export const getPatientPhotos = (userId) => api.get(`/professional/patient/${userId}/photos`);

// ============================================================
// ADMIN
// ============================================================

export const getAdminStats = () => api.get('/admin/stats');
export const getPendingProfessionals = () => api.get('/admin/professionals/pending');
export const approveProfessional = (profileId) => api.put(`/admin/approve-professional/${profileId}`);
export const rejectProfessional = (profileId) => api.put(`/admin/reject-professional/${profileId}`);
export const getAllUsers = (params) => api.get('/admin/users', { params });
export const toggleUserStatus = (userId) => api.put(`/admin/users/${userId}/toggle-status`);
export const getAllAssessments = (params) => api.get('/admin/assessments/all', { params });
export const getRoutineMatrix = () => api.get('/admin/routines/matrix');
export const addRoutineStep = (data) => api.post('/admin/routines/matrix', data);
export const updateRoutineStep = (stepId, data) => api.put(`/admin/routines/matrix/${stepId}`, data);
export const deleteRoutineStep = (stepId) => api.delete(`/admin/routines/matrix/${stepId}`);
export const addProduct = (data) => api.post('/admin/products', data);
export const updateProduct = (productId, data) => api.put(`/admin/products/${productId}`, data);
export const deleteProduct = (productId) => api.delete(`/admin/products/${productId}`);
export const getAdminReportData = () => api.get('/admin/reports/data');
export const getSystemHealth = () => api.get('/admin/health');

export default api;