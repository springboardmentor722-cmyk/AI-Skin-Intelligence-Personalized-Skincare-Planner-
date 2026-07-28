import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { Empty, Icon } from '../../components/ui'

function StepList({ label, steps, setSteps, placeholder }) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const v = draft.trim()
    if (!v) return
    setSteps([...steps, v]); setDraft('')
  }
  return (
    <div className="field">
      <label>{label}</label>
      <div style={{ display: 'flex', gap: 8 }}>
        <input className="input" value={draft} placeholder={placeholder}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }} />
        <button type="button" className="btn btn-ghost" onClick={add} aria-label={`Add ${label} step`}>
          <Icon name="plus" />
        </button>
      </div>
      {steps.length > 0 && (
        <ol style={{ margin: '8px 0 0', paddingLeft: 20, display: 'grid', gap: 6 }}>
          {steps.map((s, i) => (
            <li key={i} style={{ fontSize: 13.5 }}>
              {s}{' '}
              <button type="button" className="btn btn-danger btn-sm" style={{ padding: '1px 8px', marginLeft: 6 }}
                onClick={() => setSteps(steps.filter((_, j) => j !== i))}>remove</button>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

export default function RoutineBuilder() {
  const [clients, setClients] = useState(null)
  const [form, setForm] = useState({ patient_id: '', title: 'Personalized Routine', lifestyle_advice: '' })
  const [morning, setMorning] = useState([])
  const [night, setNight] = useState([])
  const [weekly, setWeekly] = useState([])
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    api.get('/consultation-requests/incoming').then(reqs => {
      const accepted = reqs.filter(r => r.status === 'accepted')
      const seen = new Map()
      accepted.forEach(r => seen.set(r.patient_id, r.patient_name))
      setClients([...seen.entries()].map(([id, name]) => ({ id, name })))
    }).catch(() => setClients([]))
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setMsg(null)
    try {
      await api.post('/routines', {
        patient_id: Number(form.patient_id), title: form.title,
        morning_steps: morning, night_steps: night, weekly_steps: weekly,
        lifestyle_advice: form.lifestyle_advice || null,
      })
      setMsg({ kind: 'ok', text: 'Routine published — the client has been notified.' })
      setMorning([]); setNight([]); setWeekly([])
      setForm(f => ({ ...f, title: 'Personalized Routine', lifestyle_advice: '' }))
    } catch (err) { setMsg({ kind: 'error', text: err.message }) }
  }

  if (!clients) return <div className="skeleton" />

  return (
    <div className="grid cols-2">
      <div className="card span-2" style={{ maxWidth: 760 }}>
        <h2 className="section-title">Routine builder</h2>
        {clients.length === 0 ? (
          <Empty>Accept a consultation request first — accepted clients appear here so you can build their routine.</Empty>
        ) : (
          <form onSubmit={submit}>
            {msg && <div className={`alert ${msg.kind}`}>{msg.text}</div>}
            <div className="grid cols-2" style={{ gap: 14 }}>
              <div className="field">
                <label htmlFor="client">Client</label>
                <select id="client" className="input" required value={form.patient_id}
                  onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))}>
                  <option value="">Choose a client…</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="title">Routine name</label>
                <input id="title" className="input" required value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
            </div>
            <StepList label="Morning steps" steps={morning} setSteps={setMorning} placeholder="e.g. Gentle Foam Cleanser" />
            <StepList label="Night steps" steps={night} setSteps={setNight} placeholder="e.g. Azelaic 10% Calming Cream" />
            <StepList label="Weekly treatments" steps={weekly} setSteps={setWeekly} placeholder="e.g. BHA exfoliant, 2× per week" />
            <div className="field">
              <label htmlFor="advice">Lifestyle advice</label>
              <textarea id="advice" className="input" value={form.lifestyle_advice}
                placeholder="Sleep, hydration, diet, and habit guidance…"
                onChange={e => setForm(f => ({ ...f, lifestyle_advice: e.target.value }))} />
            </div>
            <button className="btn btn-primary" disabled={!form.patient_id}>Publish routine</button>
          </form>
        )}
      </div>
    </div>
  )
}
