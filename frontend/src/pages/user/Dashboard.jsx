import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { Badge, Empty, Icon, ScoreDial, Skeletons, Sparkline, StatCard, fmtDate, fmtTime } from '../../components/ui'

const TIPS = [
  'Sunscreen is the cheapest anti-aging product you will ever own — reapply every 3–4 hours outdoors.',
  'Introduce one new active at a time and give it two weeks before judging it.',
  'Hydration shows up on your skin about 48 hours later — today\'s water is Friday\'s glow.',
  'Change your pillowcase twice a week if you are fighting breakouts.',
  'Moisturizer on damp skin traps roughly 2× the water of moisturizer on dry skin.',
]

export default function UserDashboard() {
  const { user } = useAuth()
  const [progress, setProgress] = useState(null)
  const [appointments, setAppointments] = useState(null)
  const [requests, setRequests] = useState(null)
  const [lifestyle, setLifestyle] = useState(null)

  useEffect(() => {
    api.get('/progress/me').then(setProgress).catch(() => setProgress([]))
    api.get('/appointments/me').then(setAppointments).catch(() => setAppointments([]))
    api.get('/consultation-requests/me').then(setRequests).catch(() => setRequests([]))
    api.get('/users/me/lifestyle').then(setLifestyle).catch(() => setLifestyle([]))
  }, [])

  if (!progress || !appointments || !requests || !lifestyle) return <Skeletons n={4} />

  const latest = progress[progress.length - 1] || {}
  const prev = progress[progress.length - 2] || latest
  const delta = (latest.skin_score ?? 0) - (prev.skin_score ?? 0)
  const today = lifestyle[0] || {}
  const upcoming = appointments
    .filter(a => ['pending', 'confirmed'].includes(a.status))
    .sort((a, b) => (a.appt_date + a.appt_time).localeCompare(b.appt_date + b.appt_time))
  const tip = TIPS[new Date().getDate() % TIPS.length]

  return (
    <div className="grid" style={{ gap: 18 }}>
      <div className="grid cols-3">
        <div className="card span-2">
          <ScoreDial
            score={latest.skin_score ?? 0}
            caption={progress.length
              ? `${delta >= 0 ? '+' : ''}${delta} vs last check-in. Based on ${progress.length} logged check-ins across acne, hydration, and pigmentation.`
              : 'Log your first progress check-in to activate your score.'}
          />
        </div>
        <div className="card" style={{ background: 'linear-gradient(135deg, var(--accent-soft), var(--primary-soft))' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--accent)' }}>
            <Icon name="leaf" /><span className="stat-label" style={{ color: 'var(--accent)' }}>AI daily tip</span>
          </div>
          <p style={{ marginTop: 12, fontSize: 14.5, lineHeight: 1.55 }}>{tip}</p>
          <p className="stat-hint" style={{ marginTop: 10 }}>
            Full AI skin scans and recommendations arrive in the next milestone.
          </p>
        </div>
      </div>

      <div className="grid cols-4">
        <StatCard label="Hydration" value={`${latest.hydration ?? '—'}%`} icon="drop"
          hint={latest.hydration >= 70 ? 'Well hydrated' : 'Aim for 2.5L water today'}
          trend={latest.hydration >= 70 ? 'up' : undefined} />
        <StatCard label="Acne level" value={latest.acne_level ?? '—'} icon="face"
          hint={`${(prev.acne_level ?? 0) - (latest.acne_level ?? 0) >= 0 ? 'Improving' : 'Flaring'} · lower is better`}
          trend={(prev.acne_level ?? 0) - (latest.acne_level ?? 0) >= 0 ? 'up' : 'down'} />
        <StatCard label="Sleep last night" value={today.sleep_hours != null ? `${today.sleep_hours}h` : '—'} icon="moon"
          hint={today.sleep_hours >= 7 ? 'On target' : 'Target 7–8h'} trend={today.sleep_hours >= 7 ? 'up' : undefined} />
        <StatCard label="Water today" value={today.water_intake_l != null ? `${today.water_intake_l}L` : '—'} icon="drop"
          hint="Goal: 2.5L" />
      </div>

      <div className="grid cols-3">
        <div className="card span-2">
          <h2 className="section-title">Skin score · last 12 weeks</h2>
          <Sparkline data={progress.map(p => p.skin_score ?? 0)} height={92} />
        </div>
        <div className="card">
          <h2 className="section-title">Pigmentation trend</h2>
          <Sparkline data={progress.map(p => 10 - (p.pigmentation_level ?? 0))} height={92} stroke="var(--accent)" />
          <p className="stat-hint" style={{ marginTop: 8 }}>Higher line = clearer tone</p>
        </div>
      </div>

      <div className="grid cols-2">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h2 className="section-title" style={{ marginBottom: 0 }}>Upcoming appointments</h2>
            <Link className="btn btn-ghost btn-sm" to="/app/dermatologists">Book new</Link>
          </div>
          {upcoming.length === 0
            ? <Empty>No visits scheduled. Browse the dermatologist directory to book one.</Empty>
            : upcoming.slice(0, 4).map(a => (
              <div className="list-row" key={a.id}>
                <div>
                  <div className="title">Dr. {a.dermatologist_name.replace(/^Dr\.?\s*/i, '')}</div>
                  <div className="sub">{fmtDate(a.appt_date)} · {fmtTime(a.appt_time)} · {a.consultation_type}</div>
                </div>
                <Badge status={a.status} />
              </div>
            ))}
        </div>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h2 className="section-title" style={{ marginBottom: 0 }}>Consultant sessions</h2>
            <Link className="btn btn-ghost btn-sm" to="/app/consultants">Request</Link>
          </div>
          {requests.length === 0
            ? <Empty>Ask a consultant for a routine, diet plan, or one-to-one session.</Empty>
            : requests.slice(0, 4).map(r => (
              <div className="list-row" key={r.id}>
                <div>
                  <div className="title">{r.request_type.replace(/_/g, ' ')}</div>
                  <div className="sub">{r.consultant_name}</div>
                </div>
                <Badge status={r.status} />
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
