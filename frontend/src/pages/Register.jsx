import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Icon, Logo } from '../components/ui'
import heroDecor from '../assets/hero-auth.jpg'

const FEATURES = [
  { icon: 'clipboard', title: 'Personalized plans', sub: 'Custom routines that evolve with your skin' },
  { icon: 'drop', title: 'Smart insights', sub: 'Guidance tailored to your unique skin' },
  { icon: 'cart', title: 'Curated products', sub: 'Discover products matched to your profile' },
]

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'user' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setBusy(true)
    try {
      await register(form)
      navigate('/app', { replace: true })
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-frame lp-frame" style={{ backgroundImage: `url(${heroDecor})` }}>
        <div className="auth-hero">
          
          <div className="hero-brand">
            <Logo size={34} color="#ddb27a" />
            <span className="brand-name">lumen</span>
          </div>
          <h2>Design your glow.<br /><em>Your way.</em></h2>
          <div className="hero-line" />
          <p>
            Lumen helps you create a personalized skincare plan that fits your
            unique skin, your goals, and your lifestyle.
          </p>
          <div className="hero-features">
            {FEATURES.map(f => (
              <div className="hero-feature" key={f.title}>
                <div className="hf-icon"><Icon name={f.icon} size={21} /></div>
                <div className="hf-title">{f.title}</div>
                <div className="hf-sub">{f.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="auth-panel">
          <div className="auth-card">
            <h1>Create your account</h1>
            <p className="sub">Begin your skincare journey</p>
            {error && <div className="alert error">{error}</div>}
            <form onSubmit={submit}>
              <div className="field">
                <label htmlFor="name">Full name</label>
                <div className="input-icon">
                  <Icon name="user" />
                  <input id="name" className="input" required minLength={2} value={form.full_name}
                    placeholder="Enter your full name" onChange={set('full_name')} />
                </div>
              </div>
              <div className="field">
                <label htmlFor="email">Email address</label>
                <div className="input-icon">
                  <Icon name="user" />
                  <input id="email" className="input" type="email" required value={form.email}
                    placeholder="Enter your email" onChange={set('email')} autoComplete="email" />
                </div>
              </div>
              <div className="field">
                <label htmlFor="password">Password</label>
                <div className="input-icon">
                  <Icon name="shield" />
                  <input id="password" className="input" type="password" required minLength={8} value={form.password}
                    placeholder="8+ characters" onChange={set('password')} autoComplete="new-password" />
                </div>
              </div>
              <div className="field">
                <label htmlFor="role">I am joining as</label>
                <select id="role" className="input" value={form.role} onChange={set('role')}>
                  <option value="user">User</option>
                  <option value="dermatologist">Dermatologist</option>
                  <option value="consultant">Skincare Consultant</option>
                </select>
              </div>
              <button className="btn btn-primary" disabled={busy}>
                {busy ? 'Creating…' : <>Create account <span aria-hidden="true">→</span></>}
              </button>
            </form>
            <p className="auth-foot" style={{ fontSize: 12, color: 'var(--ink-faint)' }}>
              Provider accounts are reviewed by an administrator before going live.
            </p>
            <p className="auth-foot">
              Already registered? <Link to="/login">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
