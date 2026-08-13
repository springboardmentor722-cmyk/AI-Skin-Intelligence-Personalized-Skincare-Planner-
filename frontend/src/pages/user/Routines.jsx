import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import { Empty, Icon } from '../../components/ui'

const parse = (s) => { try { return JSON.parse(s) || [] } catch { return [] } }

export default function Routines() {
  const [routines, setRoutines] = useState(null)
  useEffect(() => { api.get('/routines/me').then(setRoutines).catch(() => setRoutines([])) }, [])

  if (!routines) return <div className="skeleton" />
  if (routines.length === 0) return (
    <div className="card">
      <Empty>
        No routines yet. <Link to="/app/consultants">Request one from a consultant</Link> — they'll build it
        around your skin profile.
      </Empty>
    </div>
  )

  return (
    <div className="grid" style={{ gap: 18 }}>
      {routines.map(r => (
        <div className="card" key={r.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <h2 className="section-title" style={{ marginBottom: 4 }}>{r.title}</h2>
            <span className="stat-hint">created {new Date(r.created_at).toLocaleDateString()}</span>
          </div>
          <div className="grid cols-3" style={{ marginTop: 12 }}>
            {[['Morning', parse(r.morning_steps), 'sun'], ['Night', parse(r.night_steps), 'moon'],
              ['Weekly', parse(r.weekly_steps), 'calendar']].map(([label, steps, icon]) => (
              <div key={label}>
                <div className="stat-label" style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
                  <Icon name={icon} size={13} /> {label}
                </div>
                {steps.length === 0 ? <p className="stat-hint">—</p> : (
                  <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 2 }}>
                    {steps.map((s, i) => <li key={i}>{s}</li>)}
                  </ol>
                )}
              </div>
            ))}
          </div>
          {r.lifestyle_advice && (
            <p className="stat-hint" style={{ marginTop: 14, padding: '10px 14px', background: 'var(--accent-soft)', borderRadius: 12 }}>
              <strong>Lifestyle:</strong> {r.lifestyle_advice}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
