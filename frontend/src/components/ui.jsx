// Shared UI primitives — kept dependency-free (inline SVG icons, custom charts).
import { useEffect, useState } from 'react'

/* ---------- Icons (1.8px stroke, consistent set) ---------- */
const paths = {
  home: 'M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10',
  scan: 'M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8m8 0h2.5A1.5 1.5 0 0 1 20 5.5V8m0 8v2.5a1.5 1.5 0 0 1-1.5 1.5H16m-8 0H5.5A1.5 1.5 0 0 1 4 18.5V16m0-4h16',
  face: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-3-10h.01M15 11h.01M9 15c.8.8 1.8 1.2 3 1.2s2.2-.4 3-1.2',
  routine: 'M8 3v3m8-3v3M4.5 8.5h15M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm3 8 2 2 4-4',
  cart: 'M5 7h15l-1.5 8.5a2 2 0 0 1-2 1.5H8.6a2 2 0 0 1-2-1.6L5 7Zm0 0L4.3 4H2m8 17h.01M17 21h.01',
  stethoscope: 'M6 4v5a4 4 0 0 0 8 0V4m-2 9v3a5 5 0 0 0 10 0v-1m0 0a2 2 0 1 0 0-.01M4 4h4M12 4h2',
  calendar: 'M8 3v3m8-3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z',
  chat: 'M21 12a8 8 0 0 1-8 8H4l2.2-3.3A8 8 0 1 1 21 12Zm-12-1h.01M12 11h.01M15 11h.01',
  chart: 'M4 20V4m0 16h16M8 16v-5m4 5V8m4 8v-3',
  bell: 'M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Zm4 9a2 2 0 0 0 4 0',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0',
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 9a6 6 0 0 1 12 0M16 4.5a3.5 3.5 0 0 1 0 6.5m5 9a6 6 0 0 0-4-5.6',
  clipboard: 'M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1Zm-3 2h12a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Zm3 5h6m-6 4h4',
  shield: 'M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Zm-3 9 2 2 4-4',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8-3a8 8 0 0 1-.2 1.7l2 1.6-2 3.4-2.4-1a8 8 0 0 1-2.9 1.7L14 22h-4l-.5-2.6a8 8 0 0 1-2.9-1.7l-2.4 1-2-3.4 2-1.6A8 8 0 0 1 4 12c0-.6.1-1.1.2-1.7l-2-1.6 2-3.4 2.4 1a8 8 0 0 1 2.9-1.7L10 2h4l.5 2.6a8 8 0 0 1 2.9 1.7l2.4-1 2 3.4-2 1.6c.1.6.2 1.1.2 1.7Z',
  logout: 'M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5m5 5H3',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-15v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  moon: 'M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v5l3 2',
  drop: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z',
  megaphone: 'M3 10v4a1 1 0 0 0 1 1h2l4 4V5L6 9H4a1 1 0 0 0-1 1Zm11-2s2 1.5 2 4-2 4-2 4m3-11s3 2.3 3 7-3 7-3 7',
  check: 'M5 12.5 10 17.5 19 7',
  x: 'M6 6l12 12M18 6 6 18',
  plus: 'M12 5v14M5 12h14',
  leaf: 'M5 19c0-8 5-13 14-14-1 9-6 14-14 14Zm0 0c2-4 5-7 9-9',
}

export function Icon({ name, size = 18, style }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={style} aria-hidden="true"
      fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name] || paths.home} />
    </svg>
  )
}

/* ---------- Stat card ---------- */
export function StatCard({ label, value, hint, trend, icon }) {
  return (
    <div className="card hoverable">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span className="stat-label">{label}</span>
        {icon && <span style={{ color: 'var(--primary)' }}><Icon name={icon} /></span>}
      </div>
      <div className="stat-value">{value}</div>
      {hint && <div className={`stat-hint ${trend || ''}`}>{hint}</div>}
    </div>
  )
}

/* ---------- Score dial (signature element) ---------- */
export function ScoreDial({ score = 0, label = 'Skin Health Score', caption }) {
  const [animated, setAnimated] = useState(0)
  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimated(score))
    return () => cancelAnimationFrame(id)
  }, [score])
  const r = 56
  const c = 2 * Math.PI * r
  const filled = c * (Math.min(100, Math.max(0, animated)) / 100)
  return (
    <div className="dial-wrap">
      <svg width="150" height="150" viewBox="0 0 150 150" role="img" aria-label={`${label}: ${score} of 100`}>
        <defs>
          <linearGradient id="dialGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--accent)" />
          </linearGradient>
        </defs>
        <circle cx="75" cy="75" r={r} stroke="var(--border)" strokeWidth="11" fill="none" />
        <circle cx="75" cy="75" r={r} stroke="url(#dialGrad)" strokeWidth="11" fill="none"
          strokeLinecap="round" strokeDasharray={`${filled} ${c}`}
          transform="rotate(-90 75 75)"
          style={{ transition: 'stroke-dasharray 1.1s cubic-bezier(.3,.8,.3,1)' }} />
        <text x="75" y="72" textAnchor="middle" fill="var(--ink)"
          style={{ font: '600 30px Cormorant Garamond, serif' }}>{score}</text>
        <text x="75" y="92" textAnchor="middle" fill="var(--ink-faint)" style={{ font: '500 10px Jost' }}>
          / 100
        </text>
      </svg>
      <div className="dial-meta">
        <div className="stat-label">{label}</div>
        <div className="dial-number">{score >= 80 ? 'Radiant' : score >= 60 ? 'Improving' : 'Needs care'}</div>
        {caption && <p className="dial-caption">{caption}</p>}
      </div>
    </div>
  )
}

/* ---------- Sparkline / area chart ---------- */
export function Sparkline({ data = [], height = 64, stroke = 'var(--primary)' }) {
  if (!data.length) return <div className="empty">No data yet</div>
  const w = 260
  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const pts = data.map((v, i) => [
    (i / Math.max(1, data.length - 1)) * w,
    height - 6 - ((v - min) / span) * (height - 14),
  ])
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  const area = `${line} L${w},${height} L0,${height} Z`
  return (
    <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height} preserveAspectRatio="none" aria-hidden="true">
      <path d={area} fill={stroke} opacity="0.12" />
      <path d={line} fill="none" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3.4" fill={stroke} />
    </svg>
  )
}

/* ---------- Modal ---------- */
export function Modal({ open, onClose, title, sub, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2>{title}</h2>
            {sub && <p className="modal-sub">{sub}</p>}
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

/* ---------- States ---------- */
export function Skeletons({ n = 4 }) {
  return <div className="grid cols-4">{Array.from({ length: n }, (_, i) => <div key={i} className="skeleton" />)}</div>
}
export function Empty({ children }) { return <div className="empty">{children}</div> }
export function Avatar({ name = '' }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return <div className="avatar">{initials || '•'}</div>
}
export function Badge({ status }) { return <span className={`badge ${status}`}>{status}</span> }

export const fmtDate = (d) => new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
export const fmtTime = (t) => (t || '').slice(0, 5)

/* ---------- Lumen mark: gold crescent, face profile, botanical sprig ---------- */
export function Logo({ size = 34, color = 'var(--accent)' }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true"
      fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* crescent C */}
      <path d="M30 8.5A14.5 14.5 0 1 0 30 31.5" strokeWidth="1.8" />
      {/* face profile */}
      <path d="M17.5 12.5c-1.6 1.4-2.2 3-1.9 4.6l-1.1 1.7 1.2.5c0 1.6.5 2.9 1.7 3.9 1 .8 1.3 1.8 1.1 3" />
      {/* sprig */}
      <path d="M26 10.5c1.8 3.4 2.4 7 1.7 10.8" />
      <path d="M27.2 14.2c1.5-.4 2.6-1.3 3.2-2.8-1.7-.2-3 .3-3.9 1.6" />
      <path d="M27.9 18.3c1.6-.1 2.9-.8 3.8-2.1-1.7-.5-3.1-.2-4.2.9" />
      <path d="M27.4 15.5c-1.4-.7-2.9-.8-4.4-.2 1 1.3 2.3 1.9 3.9 1.7" />
    </svg>
  )
}
