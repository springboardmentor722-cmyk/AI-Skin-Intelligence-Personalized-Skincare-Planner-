import { createContext, useContext, useEffect, useState } from 'react'
import { api, getToken, setToken } from '../api/client'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!getToken()) { setLoading(false); return }
    api.get('/auth/me').then(setUser).catch(() => setToken(null)).finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const data = await api.post('/auth/login', { email, password })
    setToken(data.access_token); setUser(data.user); return data.user
  }
  const register = async (payload) => {
    const data = await api.post('/auth/register', payload)
    setToken(data.access_token); setUser(data.user); return data.user
  }
  const loginWithGoogle = async (credential) => {
    const data = await api.post('/auth/google', { credential })
    setToken(data.access_token); setUser(data.user); return data.user
  }
  const logout = () => { setToken(null); setUser(null) }

  return <AuthCtx.Provider value={{ user, loading, login, register, loginWithGoogle, logout }}>{children}</AuthCtx.Provider>
}
