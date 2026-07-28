import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { Empty, Sparkline } from '../../components/ui'

const EMPTY = { sleep_hours: '', water_intake_l: '', exercise_minutes: '', stress_level: '', environment_exposure: '' }

export default function Lifestyle() {
  const [logs, setLogs] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [msg, setMsg] = useState(null)

  const load = () => api.get('/users/me/lifestyle').then(setLogs).catch(() => setLogs([]))
  useEffect(() => { load() }, [])

  const save = async (e) => {
    e.preventDefault()
    setMsg(null)
    try {
      const payload = {}
      if (form.sleep_hours !== '') payload.sleep_hours = Number(form.sleep_hours)
      if (form.water_intake_l !== '') payload.water_intake_l = Number(form.water_intake_l)
      if (form.exercise_minutes !== '') payload.exercise_minutes = Number(form.exercise_minutes)
      if (form.stress_level !== '') payload.stress_level = Number(form.stress_level)
      if (form.environment_exposure) payload.environment_exposure = form.environment_exposure
      await api.post('/users/me/lifestyle', payload)
      setMsg({ ok: true, text: "Today's log saved." })
      setForm(EMPTY)
      load()
    } catch (err) { setMsg({ ok: false, text: err.message }) }
  }

  if (!logs) return <div className="skeleton" />
  const asc = [...logs].reverse()

  return (
    <div className="grid cols-2">
      <div className="card">
        <h2 className="section-title">Log today</h2>
        <p className="stat-hint" style={{ marginBottom: 16 }}>
          Sleep, water, movement, and stress all show up on your skin. One log per day — re-saving updates it.
        </p>
        {msg && <div className={`alert ${msg.ok ? 'ok' : 'error'}`}>{msg.text}</div>}
        <form onSubmit={save}>
          <div className="grid cols-2" style={{ gap: '0 14px' }}>
            <div className="field">
              <label htmlFor="sleep">Sleep (hours)</label>
              <input id="sleep" className="input" type="number" step="0.5" min="0" max="24"
                value={form.sleep_hours} onChange={e => setForm(f => ({ ...f, sleep_hours: e.target.value }))} />
            </div>
            <div className="field">
              <label htmlFor="water">Water (litres)</label>
              <input id="water" className="input" type="number" step="0.1" min="0" max="20"
                value={form.water_intake_l} onChange={e => setForm(f => ({ ...f, water_intake_l: e.target.value }))} />
            </div>
            <div className="field">
              <label htmlFor="exercise">Exercise (minutes)</label>
              <input id="exercise" className="input" type="number" min="0" max="1440"
                value={form.exercise_minutes} onChange={e => setForm(f => ({ ...f, exercise_minutes: e.target.value }))} />
            </div>
            <div className="field">
              <label htmlFor="stress">Stress (1–10)</label>
              <input id="stress" className="input" type="number" min="1" max="10"
                value={form.stress_level} onChange={e => setForm(f => ({ ...f, stress_level: e.target.value }))} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="env">Environmental exposure (sun & pollution)</label>
            <select id="env" className="input" value={form.environment_exposure}
              onChange={e => setForm(f => ({ ...f, environment_exposure: e.target.value }))}>
              <option value="">Select…</option>
              <option value="low">Low — mostly indoors</option>
              <option value="moderate">Moderate — some outdoor time</option>
              <option value="high">High — long outdoor exposure</option>
            </select>
          </div>
          <button className="btn btn-primary">Save today's log</button>
        </form>
      </div>
      <div className="grid" style={{ gap: 18, alignContent: 'start' }}>
        <div className="card">
          <h2 className="section-title">Sleep · last {asc.length} days</h2>
          <Sparkline data={asc.map(l => l.sleep_hours ?? 0)} height={70} />
        </div>
        <div className="card">
          <h2 className="section-title">Water intake</h2>
          <Sparkline data={asc.map(l => l.water_intake_l ?? 0)} height={70} stroke="var(--accent)" />
        </div>
        <div className="card">
          <h2 className="section-title">Recent logs</h2>
          {logs.length === 0 ? <Empty>Nothing logged yet.</Empty> : logs.slice(0, 6).map(l => (
            <div className="list-row" key={l.id}>
              <div className="title">{l.log_date}</div>
              <div className="sub">
                {l.sleep_hours ?? '—'}h sleep · {l.water_intake_l ?? '—'}L water · stress {l.stress_level ?? '—'}/10
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
