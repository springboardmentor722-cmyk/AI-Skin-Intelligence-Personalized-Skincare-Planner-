import { useEffect, useMemo, useState } from 'react'
import { api } from '../../api/client'
import { Avatar, Empty, Icon, Modal, Skeletons } from '../../components/ui'

// The user's live local clock — so slots already past *for them* are hidden.
function localNow() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    + `T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function todayPlus(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export default function Dermatologists() {
  const [derms, setDerms] = useState(null)
  const [filters, setFilters] = useState({ q: '', location: '', specialization: '', max_fee: '' })
  const [booking, setBooking] = useState(null) // dermatologist being booked

  const query = useMemo(() => {
    const p = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => v && p.set(k, v))
    return p.toString()
  }, [filters])

  useEffect(() => {
    const t = setTimeout(() => {
      api.get(`/dermatologists${query ? `?${query}` : ''}`).then(setDerms).catch(() => setDerms([]))
    }, 250)
    return () => clearTimeout(t)
  }, [query])

  return (
    <div className="grid" style={{ gap: 18 }}>
      <div className="card">
        <h2 className="section-title">Find a dermatologist</h2>
        <div className="grid cols-4" style={{ gap: 12 }}>
          <input className="input" placeholder="Search name, clinic, specialty…" value={filters.q}
            onChange={e => setFilters(f => ({ ...f, q: e.target.value }))} aria-label="Search" />
          <input className="input" placeholder="Location" value={filters.location}
            onChange={e => setFilters(f => ({ ...f, location: e.target.value }))} aria-label="Location" />
          <select className="input" value={filters.specialization}
            onChange={e => setFilters(f => ({ ...f, specialization: e.target.value }))} aria-label="Specialization">
            <option value="">Any specialization</option>
            <option>Acne</option><option>Pigmentation</option><option>Anti-aging</option>
            <option>Laser</option><option>Sensitive Skin</option><option>Eczema</option>
          </select>
          <select className="input" value={filters.max_fee}
            onChange={e => setFilters(f => ({ ...f, max_fee: e.target.value }))} aria-label="Max fee">
            <option value="">Any fee</option>
            <option value="800">Up to ₹800</option>
            <option value="1000">Up to ₹1000</option>
            <option value="1500">Up to ₹1500</option>
          </select>
        </div>
      </div>

      {!derms ? <Skeletons n={3} /> : derms.length === 0 ? (
        <div className="card"><Empty>No dermatologists match those filters yet — try widening the search.</Empty></div>
      ) : (
        <div className="grid cols-3">
          {derms.map(d => (
            <div className="card hoverable" key={d.id}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                <Avatar name={d.full_name} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{d.full_name}</div>
                  <div className="stat-hint">{d.qualification}</div>
                </div>
              </div>
              <div className="pill-row" style={{ marginBottom: 12 }}>
                {(d.specialization || '').split(',').slice(0, 3).map(s => (
                  <span className="badge neutral" key={s}>{s.trim()}</span>
                ))}
              </div>
              <div className="stat-hint" style={{ lineHeight: 1.7 }}>
                <Icon name="stethoscope" size={13} /> {d.clinic_name} · {d.location}<br />
                {d.experience_years} yrs experience · speaks {d.languages}<br />
                <span style={{ color: 'var(--gold)' }}>★ {d.rating.toFixed(1)}</span> · ₹{d.consultation_fee} per visit
              </div>
              <button className="btn btn-primary" style={{ width: '100%', marginTop: 14 }}
                onClick={() => setBooking(d)}>
                Book appointment
              </button>
            </div>
          ))}
        </div>
      )}

      <BookingModal derm={booking} onClose={() => setBooking(null)} />
    </div>
  )
}

function BookingModal({ derm, onClose }) {
  const [date, setDate] = useState(todayPlus(1))
  const [slots, setSlots] = useState(null)
  const [time, setTime] = useState('')
  const [type, setType] = useState('video')
  const [reason, setReason] = useState('')
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!derm) return
    setSlots(null); setTime(''); setMsg(null)
    api.get(`/dermatologists/${derm.user_id}/slots?on=${date}`
        + `&now=${localNow()}`)
      .then(r => setSlots(r.slots))
      .catch(() => setSlots([]))
  }, [derm, date])

  if (!derm) return null

  const book = async () => {
    setBusy(true); setMsg(null)
    try {
      await api.post('/appointments', {
        dermatologist_user_id: derm.user_id,
        appt_date: date, appt_time: time,
        consultation_type: type, reason,
      })
      setMsg({ ok: true, text: 'Request sent — the dermatologist will confirm shortly. Track it under Appointments.' })
      setTime('')
      const r = await api.get(`/dermatologists/${derm.user_id}/slots?on=${date}`
        + `&now=${localNow()}`)
      setSlots(r.slots)
    } catch (err) { setMsg({ ok: false, text: err.message }) } finally { setBusy(false) }
  }

  const types = (derm.consultation_types || 'video').split(',')

  return (
    <Modal open onClose={onClose} title={`Book ${derm.full_name}`}
      sub={`${derm.clinic_name} · ${derm.location} · ₹${derm.consultation_fee}`}>
      {msg && <div className={`alert ${msg.ok ? 'ok' : 'error'}`}>{msg.text}</div>}
      <div className="field">
        <label htmlFor="bdate">Date</label>
        <input id="bdate" className="input" type="date" value={date} min={todayPlus(0)} max={todayPlus(60)}
          onChange={e => setDate(e.target.value)} />
      </div>
      <div className="field">
        <label>Available time slots</label>
        {!slots ? <div className="skeleton" style={{ height: 44 }} />
          : slots.length === 0 ? <Empty>No open slots on this date — try another day.</Empty>
          : (
            <div className="slot-grid">
              {slots.map(s => (
                <button key={s} type="button" className={`slot ${time === s ? 'selected' : ''}`}
                  onClick={() => setTime(s)}>{s}</button>
              ))}
            </div>
          )}
      </div>
      <div className="field">
        <label htmlFor="btype">Consultation type</label>
        <select id="btype" className="input" value={type} onChange={e => setType(e.target.value)}>
          {types.map(t => <option key={t} value={t}>{t === 'video' ? 'Video consultation' : 'Clinic visit'}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="breason">Reason for consultation</label>
        <textarea id="breason" className="input" value={reason} onChange={e => setReason(e.target.value)}
          placeholder="e.g. acne flare on cheeks for two weeks, tried salicylic wash" />
      </div>
      <button className="btn btn-primary" style={{ width: '100%' }} disabled={!time || busy} onClick={book}>
        {busy ? 'Booking…' : time ? `Confirm ${date} at ${time}` : 'Pick a time slot'}
      </button>
    </Modal>
  )
}
