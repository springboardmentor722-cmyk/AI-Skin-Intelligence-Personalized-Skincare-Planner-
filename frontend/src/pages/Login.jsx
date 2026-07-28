import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'
import { Logo } from '../components/ui'
import heroDecor from '../assets/hero-login.jpg'

/* Local icons matched to the reference artwork */
const Mail = () => (
  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" /><path d="m4.5 7 7.5 6 7.5-6" />
  </svg>
)
const Lock = () => (
  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5.5" y="10.5" width="13" height="9" rx="2.5" /><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
  </svg>
)
const Eye = ({ off }) => (
  <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3" />
    {off && <path d="M4 20 20 4" />}
  </svg>
)
const Globe = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c-5 5.4-5 11.6 0 17M12 3.5c5 5.4 5 11.6 0 17" />
  </svg>
)

const FEATURES = [
  {
    title: 'Personalized Plans', sub: 'Tailored routines just for your skin',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4l1.6 4.6L18 10l-4.4 1.4L12 16l-1.6-4.6L6 10l4.4-1.4L12 4Z" /><path d="M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z" /></svg>,
  },
  {
    title: 'Smart Recommendations', sub: 'AI-powered insights that evolve with you',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4c3.2 3.6 4.8 6.6 4.8 9a4.8 4.8 0 1 1-9.6 0c0-2.4 1.6-5.4 4.8-9Z" /></svg>,
  },
  {
    title: 'Track & Glow Progress', sub: 'Monitor your journey and celebrate results',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><rect x="4.5" y="6" width="15" height="14" rx="2.5" /><path d="M4.5 10.5h15M8.5 4v3.5M15.5 4v3.5M8.5 14h.01M12 14h.01M15.5 14h.01M8.5 17h.01M12 17h.01" /></svg>,
  },
]

const CURVE = 'M120,0 L58,0 C10,110 24,230 74,340 C112,424 16,540 26,668 C34,764 74,822 120,860'

export default function Login() {
  const { login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const [googleReady, setGoogleReady] = useState(false)

  /* Let the page grow past the viewport so the artwork can show at its true
     aspect ratio (it scrolls, like the Create Account page). Scoped to login. */
  useEffect(() => {
    document.body.classList.add('on-login')
    return () => document.body.classList.remove('on-login')
  }, [])
  const googleBtnRef = useRef(null)

  /* Google Sign-In: ask the server whether it's configured, then render
     Google's official button (required — Google blocks custom-button popups). */
  useEffect(() => {
    let cancelled = false
    api.get('/auth/google/config').then(cfg => {
      if (cancelled || !cfg.enabled || !cfg.client_id) return
      const boot = () => {
        if (cancelled || !window.google || !googleBtnRef.current) return
        window.google.accounts.id.initialize({
          client_id: cfg.client_id,
          callback: async ({ credential }) => {
            setError(''); setInfo(''); setBusy(true)
            try {
              await loginWithGoogle(credential)
              navigate(location.state?.from?.pathname || '/app', { replace: true })
            } catch (err) { setError(err.message) } finally { setBusy(false) }
          },
        })
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          type: 'standard', theme: 'outline', size: 'large',
          text: 'continue_with', shape: 'pill', width: 360,
        })
        setGoogleReady(true)
      }
      if (window.google?.accounts?.id) { boot(); return }
      const existing = document.getElementById('gsi-script')
      if (existing) { existing.addEventListener('load', boot); return }
      const script = document.createElement('script')
      script.id = 'gsi-script'
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = boot
      document.head.appendChild(script)
    }).catch(() => { /* Google not configured — button stays hidden */ })
    return () => { cancelled = true }
  }, [loginWithGoogle, navigate, location])

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setInfo(''); setBusy(true)
    try {
      await login(email, password)
      navigate(location.state?.from?.pathname || '/app', { replace: true })
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return (
    <div className="lp" style={{ backgroundImage: `url(${heroDecor})` }}>
      {/* ------- Left: plum silk hero with the photographic still life ------- */}
      <div className="lp-left">
        
        <div className="lp-left-inner">
          <div className="lp-brand">
            <Logo size={44} color="#cfa768" />
            <span>LUMEN</span>
          </div>
          <div className="lp-copy">
            <h1>Your skin has a story,<br /><em>Let&rsquo;s start reading it&hellip;</em></h1>
            <div className="lp-rule"><span>✦</span></div>
            <p>
              Lumen helps you understand your skin through intelligent analysis and
              creates personalized skincare routines designed specifically for your
              unique skin, lifestyle, and long-term goals.
            </p>
            <div className="lp-features">
              {FEATURES.map(f => (
                <div className="lp-feature" key={f.title}>
                  <div className="lp-ficon">{f.icon}</div>
                  <div className="lp-ftitle">{f.title}</div>
                  <div className="lp-fsub">{f.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ------- Right: cream marble panel behind the organic gold curve ------- */}
      <div className="lp-right">
        <svg className="lp-curve" viewBox="0 0 120 860" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="lpCream" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fbf3e9" />
              <stop offset="1" stopColor="#f5e8dc" />
            </linearGradient>
          </defs>
          <path d={CURVE + ' L120,860 Z'} fill="url(#lpCream)" />
          <path d={CURVE} fill="none" stroke="#d9b98a" strokeWidth="2.4" opacity="0.9" />
        </svg>

        <button type="button" className="lp-lang" onClick={() => setInfo('Multi-language support arrives in a later milestone.')}>
          <Globe /> English <span className="lp-caret">▾</span>
        </button>

        <div className="lp-form-wrap">
          <div className="lp-form">
            <h2>Welcome back <span className="lp-spark">✦</span></h2>
            <div className="lp-sub">Continue your skincare journey</div>

            {error && <div className="alert error">{error}</div>}
            {info && <div className="alert ok">{info}</div>}

            <form onSubmit={submit}>
              <label className="lp-label" htmlFor="lp-email">Email address</label>
              <div className="lp-input">
                <span className="lp-ic"><Mail /></span>
                <input id="lp-email" type="email" required autoComplete="email"
                  placeholder="Enter your email" value={email}
                  onChange={e => setEmail(e.target.value)} />
              </div>

              <label className="lp-label" htmlFor="lp-pass">Password</label>
              <div className="lp-input">
                <span className="lp-ic"><Lock /></span>
                <input id="lp-pass" type={showPw ? 'text' : 'password'} required autoComplete="current-password"
                  placeholder="Enter your password" value={password}
                  onChange={e => setPassword(e.target.value)} />
                <button type="button" className="lp-eye" aria-label={showPw ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPw(s => !s)}><Eye off={showPw} /></button>
              </div>

              <a className="lp-forgot" href="#forgot"
                onClick={(e) => { e.preventDefault(); setInfo('Password reset arrives in the next milestone — an administrator can reset it for you.') }}>
                Forgot password?
              </a>

              <button className="lp-login" disabled={busy}>
                <span>{busy ? 'Signing in…' : 'LOGIN'}</span>
                <span className="lp-arr" aria-hidden="true">⟶</span>
              </button>
            </form>

            {googleReady && <>
              <div className="lp-or"><span>OR</span></div>
              <div className="lp-google-wrap" ref={googleBtnRef} />
            </>}

            <div className="lp-new">
              New here? <Link to="/register">Create your account</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
