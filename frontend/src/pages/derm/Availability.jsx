import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { Empty } from '../../components/ui'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function Availability() {
  const [slots, setSlots] = useState(null)
  const [form, setForm] = useState({ day_of_week: 0, start_time: '10:00', end_time: '13:00', slot_minutes: 30 })
  const [error, setError] = useState('')

  const load = () => api.get('/dermatologists/me/availability').then(setSlots).catch(e => setError(e.message))
  useEffect(() => { load() }, [])

  const add = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.post('/dermatologists/me/availability', { ...form, day_of_week: Number(form.day_of_week), slot_minutes: Number(form.slot_minutes) })
      load()
    } catch (err) { setError(err.message) }
  }
  const remove = async (id) => { await api.del(`/dermatologists/me/availability/${id}`); load() }

  if (!slots) return <div className="skeleton" />

  return (
    <div className="grid cols-2">
      <div className="card">
        <h2 className="section-title">Weekly availability</h2>
        <p className="stat-hint" style={{ marginBottom: 14 }}>
          These windows repeat every week and are split into bookable slots automatically.
          Booked slots vanish from users' pickers in real time.
        </p>
        {slots.length === 0 ? <Empty>No availability yet — users can't book you until you add some.</Empty>
          : DAYS.map((day, i) => {
            const daySlots = slots.filter(s => s.day_of_week === i)
            if (!daySlots.length) return null
            return (
              <div className="list-row" key={day}>
                <div className="title">{day}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {daySlots.map(s => (
                    <span key={s.id} className="badge neutral" style={{ display: 'inline-flex', gap: 8 }}>
                      {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)} · {s.slot_minutes}m
                      <button onClick={() => remove(s.id)} aria-label="Remove window"
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', padding: 0, fontWeight: 700 }}>×</button>
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
      </div>
      <div className="card" style={{ alignSelf: 'start' }}>
        <h2 className="section-title">Add a window</h2>
        {error && <div className="alert error">{error}</div>}
        <form onSubmit={add}>
          <div className="field">
            <label htmlFor="dow">Day</label>
            <select id="dow" className="input" value={form.day_of_week}
              onChange={e => setForm(f => ({ ...f, day_of_week: e.target.value }))}>
              {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
            </select>
          </div>
          <div className="grid cols-2" style={{ gap: '0 12px' }}>
            <div className="field">
              <label htmlFor="st">Start</label>
              <input id="st" className="input" type="time" value={form.start_time}
                onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} required />
            </div>
            <div className="field">
              <label htmlFor="et">End</label>
              <input id="et" className="input" type="time" value={form.end_time}
                onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} required />
            </div>
          </div>
          <div className="field">
            <label htmlFor="dur">Slot length (minutes)</label>
            <select id="dur" className="input" value={form.slot_minutes}
              onChange={e => setForm(f => ({ ...f, slot_minutes: e.target.value }))}>
              {[15, 20, 30, 45, 60].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }}>Add availability</button>
        </form>
      </div>
    </div>
  )
}
