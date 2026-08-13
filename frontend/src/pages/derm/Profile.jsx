import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { useAuth } from '../../context/AuthContext'

const FIELDS = [
  ['qualification', 'Qualification'],
  ['specialization', 'Specializations (comma separated)'],
  ['experience_years', 'Years of experience', 'number'],
  ['clinic_name', 'Clinic / hospital'],
  ['location', 'Location'],
  ['languages', 'Languages'],
  ['consultation_fee', 'Consultation fee (₹)', 'number'],
  ['bio', 'Bio', 'textarea'],
]

export default function DermProfile() {
  const { user } = useAuth()
  const [form, setForm] = useState(null)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    api.get('/dermatologists/me/profile')
      .then(setForm)
      .catch(() => setForm({ is_approved: false }))
  }, [user.id])

  const save = async (e) => {
    e.preventDefault()
    setMsg(null)
    try {
      const payload = Object.fromEntries(FIELDS.map(([k]) => [k, form[k] === '' ? null : form[k]]))
      if (payload.experience_years != null) payload.experience_years = Number(payload.experience_years)
      if (payload.consultation_fee != null) payload.consultation_fee = Number(payload.consultation_fee)
      const updated = await api.put('/dermatologists/me/profile', payload)
      setForm(updated)
      setMsg({ ok: true, text: 'Practice profile saved.' })
    } catch (err) { setMsg({ ok: false, text: err.message }) }
  }

  if (!form) return <div className="skeleton" />

  return (
    <div className="card" style={{ maxWidth: 720 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <h2 className="section-title" style={{ marginBottom: 0 }}>My practice</h2>
        <span className={`badge ${form.is_approved ? 'confirmed' : 'pending'}`}>
          {form.is_approved ? 'approved & listed' : 'awaiting admin approval'}
        </span>
      </div>
      <p className="stat-hint" style={{ marginBottom: 18 }}>
        This is what users see in the directory. New and edited profiles go live after an administrator approves them.
      </p>
      {msg && <div className={`alert ${msg.ok ? 'ok' : 'error'}`}>{msg.text}</div>}
      <form onSubmit={save} className="grid cols-2" style={{ gap: '0 16px' }}>
        {FIELDS.map(([key, label, type]) => (
          <div className="field" key={key} style={type === 'textarea' ? { gridColumn: 'span 2' } : undefined}>
            <label htmlFor={key}>{label}</label>
            {type === 'textarea'
              ? <textarea id={key} className="input" value={form[key] ?? ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
              : <input id={key} className="input" type={type || 'text'} min="0" value={form[key] ?? ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />}
          </div>
        ))}
        <div style={{ gridColumn: 'span 2' }}>
          <button className="btn btn-primary">Save practice profile</button>
        </div>
      </form>
    </div>
  )
}
