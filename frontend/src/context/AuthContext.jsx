import React, { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '../api/endpoints'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem('skin_intel_user')
    const token = localStorage.getItem('skin_intel_token')
    if (storedUser && token) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const res = await authApi.login(email, password)
    localStorage.setItem('skin_intel_token', res.data.access_token)
    localStorage.setItem('skin_intel_user', JSON.stringify(res.data.user))
    setUser(res.data.user)
    return res.data.user
  }

  const googleLogin = async (idToken, role = 'user') => {
    const res = await authApi.googleLogin(idToken, role)
    localStorage.setItem('skin_intel_token', res.data.access_token)
    localStorage.setItem('skin_intel_user', JSON.stringify(res.data.user))
    setUser(res.data.user)
    return res.data.user
  }

  const register = async (data) => {
    const res = await authApi.register(data)
    localStorage.setItem('skin_intel_token', res.data.access_token)
    localStorage.setItem('skin_intel_user', JSON.stringify(res.data.user))
    setUser(res.data.user)
    return res.data.user
  }

  const updateUser = (userData) => {
    localStorage.setItem('skin_intel_user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('skin_intel_token')
    localStorage.removeItem('skin_intel_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, googleLogin, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
