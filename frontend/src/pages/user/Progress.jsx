import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { Sparkline, StatCard } from '../../components/ui'

const EMPTY = { skin_score: '', hydration: '', acne_level: '', pigmentation_level: '', notes: '' }

export default function Progress() {
  const [entries, setEntries] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [msg, setMsg] = useState(null)

  const load = () => api.get('/progress/me').then(setEntries).catch(() => setEntries([]))
  useEffect(() => { load() }, [])

  const save = async (e) => {
    e.preventDefault()
    setMsg(null)
    try {
      const payload = {}
      for (const k of ['skin_score', 'hydration', 'acne_level', 'pigmentation_level']) {
        if (form[k] !== '') payload[k] = Number(form[k])
      }
      if (form.notes) payload.notes = form.notes
      await api.post('/progress/me', payload)
      setMsg({ ok: true, text: 'Check-in logged.' })
      setForm(EMPTY); load()
    } catch (err) { setMsg({ ok: false, text: err.message }) }
  }

  if (!entries) return <div className="skeleton" />
  const latest = entries[entries.length - 1] || {}
  const first = entries[0] || {}

  return (
    <div className="grid" style={{ gap: 18 }}>
      <div className="grid cols-4">
        <StatCard label="Current score" value={latest.skin_score ?? '—'} icon="chart"
          hint={entries.length > 1 ? `${latest.skin_score - first.skin_score >= 0 ? '+' : ''}${latest.skin_score - first.skin_score} since first check-in` : 'Log more check-ins for trends'}
          trend={latest.skin_score >= first.skin_score ? 'up' : 'down'} />
        <StatCard label="Hydration" value={latest.hydration != null ? `${latest.hydration}%` : '—'} icon="drop" />
        <StatCard label="Acne level" value={latest.acne_level ?? '—'} icon="face" hint="0–10, lower is better" />
        <StatCard label="Pigmentation" value={latest.pigmentation_level ?? '—'} icon="sun" hint="0–10, lower is better" />
      </div>

      <div className="grid cols-2">
        <div className="card">
          <h2 className="section-title">Skin score history</h2>
          <Sparkline data={entries.map(p => p.skin_score ?? 0)} height={110} />
        </div>
        <div className="card">
          <h2 className="section-title">Acne reduction</h2>
          <Sparkline data={entries.map(p => 10 - (p.acne_level ?? 0))} height={110} stroke="var(--accent)" />
          <p className="stat-hint" style={{ marginTop: 6 }}>Higher line = fewer breakouts</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 680 }}>
        <h2 className="section-title">Log a check-in</h2>
        {msg && <div className={`alert ${msg.ok ? 'ok' : 'error'}`}>{msg.text}</div>}
        <form onSubmit={save}>
          <div className="grid cols-4" style={{ gap: 12 }}>
            {[['skin_score', 'Score (0–100)', 100], ['hydration', 'Hydration %', 100],
              ['acne_level', 'Acne (0–10)', 10], ['pigmentation_level', 'Pigment (0–10)', 10]].map(([k, l, max]) => (
              <div className="field" key={k}>
                <label htmlFor={k}>{l}</label>
                <input id={k} className="input" type="number" min="0" max={max} value={form[k]}
                  onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
              </div>
            ))}
          </div>
          <div className="field">
            <label htmlFor="pnotes">Notes</label>
            <input id="pnotes" className="input" value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="e.g. started retinol, less redness this week" />
          </div>
          <button className="btn btn-primary">Save check-in</button>
        </form>
      </div>
    </div>
  )
}
