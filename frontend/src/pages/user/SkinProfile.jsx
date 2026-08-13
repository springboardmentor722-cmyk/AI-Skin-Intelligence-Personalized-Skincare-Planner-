import { useEffect, useState } from 'react'
import { api } from '../../api/client'

const FIELDS = [
  ['age', 'Age', 'number'],
  ['gender', 'Gender', 'select', ['', 'female', 'male', 'non-binary', 'prefer not to say']],
  ['skin_type', 'Skin type', 'select', ['', 'normal', 'oily', 'dry', 'combination', 'sensitive']],
  ['skin_tone', 'Skin tone', 'select', ['', 'fair', 'light', 'medium', 'tan', 'deep']],
  ['concerns', 'Skin concerns', 'textarea'],
  ['allergies', 'Allergies', 'textarea'],
  ['sensitivities', 'Skin sensitivities', 'textarea'],
  ['medical_history', 'Medical history', 'textarea'],
  ['current_products', 'Products you currently use', 'textarea'],
  ['goals', 'Your goals', 'textarea'],
]

export default function SkinProfile() {
  const [form, setForm] = useState(null)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { api.get('/users/me/skin-profile').then(setForm).catch(e => setError(e.message)) }, [])

  const save = async (e) => {
    e.preventDefault()
    setError(''); setSaved(false)
    try {
      const payload = Object.fromEntries(FIELDS.map(([k]) => [k, form[k] === '' ? null : form[k]]))
      if (payload.age != null) payload.age = Number(payload.age)
      const updated = await api.put('/users/me/skin-profile', payload)
      setForm(updated); setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) { setError(err.message) }
  }

  if (!form) return <div className="skeleton" />

  return (
    <div className="card" style={{ maxWidth: 760 }}>
      <h2 className="section-title">Skin profile</h2>
      <p className="stat-hint" style={{ marginBottom: 18 }}>
        Dermatologists and consultants you work with see this profile — the more accurate it is,
        the better the guidance. It also feeds the AI recommendations arriving in the next milestone.
      </p>
      {error && <div className="alert error">{error}</div>}
      {saved && <div className="alert ok">Profile saved.</div>}
      <form onSubmit={save} className="grid cols-2" style={{ gap: '0 18px' }}>
        {FIELDS.map(([key, label, type, options]) => (
          <div className="field" key={key} style={type === 'textarea' ? { gridColumn: 'span 2' } : undefined}>
            <label htmlFor={key}>{label}</label>
            {type === 'select' ? (
              <select id={key} className="input" value={form[key] ?? ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}>
                {options.map(o => <option key={o} value={o}>{o || 'Select…'}</option>)}
              </select>
            ) : type === 'textarea' ? (
              <textarea id={key} className="input" value={form[key] ?? ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
            ) : (
              <input id={key} className="input" type={type} min="1" max="120" value={form[key] ?? ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
            )}
          </div>
        ))}
        <div style={{ gridColumn: 'span 2' }}>
          <button className="btn btn-primary">Save profile</button>
        </div>
      </form>
    </div>
  )
}
