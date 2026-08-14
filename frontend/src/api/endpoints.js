import api from './client'

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (email, password) => {
    const form = new URLSearchParams()
    form.append('username', email)
    form.append('password', password)
    return api.post('/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  },
  googleLogin: (id_token, role = 'user') => api.post('/auth/google', { id_token, role }),
}

export const userApi = {
  me: () => api.get('/users/me'),
  listAll: () => api.get('/users'),
  deactivate: (id) => api.patch(`/users/${id}/deactivate`),
  activate: (id) => api.patch(`/users/${id}/activate`),
}

export const profileApi = {
  getMine: () => api.get('/profile/me'),
  upsertMine: (data) => api.put('/profile/me', data),
  getForUser: (userId) => api.get(`/profile/${userId}`),
}

export const assessmentApi = {
  run: () => api.post('/assessment/run'),
  latest: () => api.get('/assessment/latest'),
  history: () => api.get('/assessment/history'),
}

export const routineApi = {
  generate: (routineType, season) =>
    api.post(`/routines/generate?routine_type=${routineType}${season ? `&season=${season}` : ''}`),
  active: () => api.get('/routines/active'),
  history: () => api.get('/routines/history'),
}

export const ingredientApi = {
  list: () => api.get('/ingredients'),
  checkSuitability: (ingredient_names) => api.post('/ingredients/check-suitability', { ingredient_names }),
}

export const productApi = {
  list: (category) => api.get('/products', { params: category ? { category } : {} }),
  recommendations: (category, limit = 10) =>
    api.get('/products/recommendations', { params: { category, limit } }),
  compare: (ids) => api.get('/products/compare', { params: { product_ids: ids.join(',') } }),
}

export const scoringApi = {
  compute: () => api.post('/scoring/compute'),
  latest: () => api.get('/scoring/latest'),
  history: () => api.get('/scoring/history'),
}

export const progressApi = {
  log: (data) => api.post('/progress/log', data),
  history: () => api.get('/progress/history'),
  summary: () => api.get('/progress/summary'),
}

export const notificationApi = {
  list: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  generateReminders: () => api.post('/notifications/generate-reminders'),
}

async function downloadFile(url, filename) {
  const res = await api.get(url, { responseType: 'blob' })
  const blobUrl = window.URL.createObjectURL(new Blob([res.data]))
  const link = document.createElement('a')
  link.href = blobUrl
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(blobUrl)
}

export const reportApi = {
  downloadPdf: () => downloadFile('/reports/pdf', 'skin_report.pdf'),
  downloadExcel: () => downloadFile('/reports/excel', 'skin_report.xlsx'),
}

export const dashboardApi = {
  user: () => api.get('/dashboard/user'),
  consultant: () => api.get('/dashboard/consultant'),
  dermatologist: () => api.get('/dashboard/dermatologist'),
  admin: () => api.get('/dashboard/admin'),
}
