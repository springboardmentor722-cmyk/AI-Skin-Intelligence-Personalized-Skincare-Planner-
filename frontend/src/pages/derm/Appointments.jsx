import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { Badge, Empty, Modal, fmtDate, fmtTime } from '../../components/ui'

export default function DermAppointments() {
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')
  const [noting, setNoting] = useState(null)
  const [notes, setNotes] = useState('')
  const load = () => api.get('/appointments/incoming').then(setItems).catch(e => setError(e.message))
  useEffect(() => { load() }, [])

  const act = async (id, action, extra = {}) => {
    setError('')
    try { await api.patch(`/appointments/${id}`, { action, ...extra }); load() }
    catch (e) { setError(e.message) }
  }

  if (!items) return <div className="skeleton" />
  const today = new Date().toISOString().slice(0, 10)
  const pending = items.filter(a => a.status === 'pending')
  const confirmed = items.filter(a => a.status === 'confirmed' && a.appt_date >= today)
  const history = items.filter(a => !pending.includes(a) && !confirmed.includes(a))

  const complete = async () => {
    await act(noting.id, 'complete', { doctor_notes: notes })
    setNoting(null); setNotes('')
  }

  return (
    <div className="grid" style={{ gap: 18 }}>
      {error && <div className="alert error">{error}</div>}
      <div className="card">
        <h2 className="section-title">Incoming requests</h2>
        {pending.length === 0 ? <Empty>No new requests. Users book through your public profile.</Empty>
          : pending.map(a => (
            <div className="list-row" key={a.id}>
              <div>
                <div className="title">{a.patient_name}</div>
                <div className="sub">{fmtDate(a.appt_date)} · {fmtTime(a.appt_time)} · {a.consultation_type}
                  {a.reason ? ` · "${a.reason}"` : ''}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ok btn-sm" onClick={() => act(a.id, 'accept')}>Accept</button>
                <button className="btn btn-danger btn-sm" onClick={() => act(a.id, 'reject')}>Decline</button>
              </div>
            </div>
          ))}
      </div>

      <div className="card">
        <h2 className="section-title">Upcoming schedule</h2>
        {confirmed.length === 0 ? <Empty>No confirmed visits ahead.</Empty> : confirmed.map(a => (
          <div className="list-row" key={a.id}>
            <div>
              <div className="title">{a.patient_name}</div>
              <div className="sub">{fmtDate(a.appt_date)} · {fmtTime(a.appt_time)} · {a.consultation_type}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary btn-sm" onClick={() => { setNoting(a); setNotes('') }}>
                Complete + notes
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => act(a.id, 'cancel')}>Cancel</button>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="section-title">History</h2>
        {history.length === 0 ? <Empty>Completed, cancelled, and declined visits collect here.</Empty>
          : history.map(a => (
            <div className="list-row" key={a.id}>
              <div>
                <div className="title">{a.patient_name}</div>
                <div className="sub">{fmtDate(a.appt_date)} · {fmtTime(a.appt_time)}
                  {a.doctor_notes ? ` · notes: ${a.doctor_notes}` : ''}</div>
              </div>
              <Badge status={a.status} />
            </div>
          ))}
      </div>

      <Modal open={!!noting} onClose={() => setNoting(null)} title="Complete visit"
        sub={noting ? `${noting.patient_name} · ${fmtDate(noting.appt_date)} ${fmtTime(noting.appt_time)}` : ''}>
        <div className="field">
          <label htmlFor="dnotes">Clinical notes for the user</label>
          <textarea id="dnotes" className="input" value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Diagnosis, treatment plan, follow-up advice…" />
        </div>
        <button className="btn btn-primary" style={{ width: '100%' }} onClick={complete}>
          Mark completed
        </button>
      </Modal>
    </div>
  )
}
