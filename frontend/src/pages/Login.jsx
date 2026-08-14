import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import GoogleSignInButton from '../components/GoogleSignInButton'

export default function Login() {
  const { login, googleLogin } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleCredential = async (idToken) => {
    setError('')
    try {
      await googleLogin(idToken)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Google login failed.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-porcelain">
      <div className="card w-full max-w-md">
        <Link to="/" className="font-display text-xl font-semibold text-ink mb-1 block">Skinsight</Link>
        <p className="text-ink-soft mb-6 text-sm">Log in to your personalized skincare planner.</p>

        {error && <div className="bg-rose-50 text-rose-600 text-sm rounded-lg px-4 py-2 mb-4">{error}</div>}

        <div className="mb-5">
          <GoogleSignInButton onCredential={handleGoogleCredential} />
        </div>

        <div className="flex items-center gap-3 mb-5">
          <div className="h-px bg-stone-200 flex-1" />
          <span className="text-xs text-ink-faint">or use email</span>
          <div className="h-px bg-stone-200 flex-1" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p className="text-sm text-ink-soft mt-6 text-center">
          Don't have an account? <Link to="/register" className="text-teal-600 font-medium">Sign up</Link>
        </p>
        <p className="text-xs text-ink-faint mt-4 text-center">
          Admin demo login: admin@skinintel.com / Admin@123
        </p>
      </div>
    </div>
  )
}

