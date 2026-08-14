import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-porcelain">
      <div className="card w-full max-w-md">
        <Link to="/" className="font-display text-xl font-semibold text-ink mb-1 block">Skinsight</Link>
        <h1 className="font-display text-2xl font-semibold text-ink mb-1 mt-3">Create your account</h1>
        <p className="text-ink-soft mb-6 text-sm">Start building your personalized skincare plan.</p>

        {error && <div className="bg-rose-50 text-rose-600 text-sm rounded-lg px-4 py-2 mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input className="input" required value={form.name} onChange={update('name')} placeholder="Jane Doe" />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required value={form.email} onChange={update('email')} placeholder="you@example.com" />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" required minLength={6} value={form.password} onChange={update('password')} placeholder="At least 6 characters" />
          </div>
          <div>
            <label className="label">I am a...</label>
            <select className="input" value={form.role} onChange={update('role')}>
              <option value="user">Skincare User</option>
              <option value="consultant">Skincare Consultant</option>
              <option value="dermatologist">Dermatologist</option>
            </select>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-sm text-ink-soft mt-6 text-center">
          Already have an account? <Link to="/login" className="text-teal-600 font-medium">Log in</Link>
        </p>
      </div>
    </div>
  )
}
