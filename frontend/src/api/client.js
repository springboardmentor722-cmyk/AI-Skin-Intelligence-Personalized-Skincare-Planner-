// Thin fetch wrapper. In dev, Vite proxies /api to the FastAPI server.
const BASE = '/api'

export function getToken() { return localStorage.getItem('lumen_token') }
export function setToken(t) { t ? localStorage.setItem('lumen_token', t) : localStorage.removeItem('lumen_token') }

async function request(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (res.status === 204) return null
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const detail = typeof data.detail === 'string' ? data.detail
      : Array.isArray(data.detail) ? data.detail.map(d => d.msg).join(', ')
      : 'Something went wrong'
    const err = new Error(detail)
    err.status = res.status
    throw err
  }
  return data
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body = {}) => request('POST', path, body),
  put: (path, body = {}) => request('PUT', path, body),
  patch: (path, body = {}) => request('PATCH', path, body),
  del: (path) => request('DELETE', path),
}
