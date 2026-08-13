import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import { Badge, Empty, fmtDate, fmtTime } from '../../components/ui'

export default function Appointments() {
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')
  const load = () => api.get('/appointments/me').then(setItems).catch(e => setError(e.message))
  useEffect(() => { load() }, [])

  const cancel = async (id) => {
    setError('')
    try { await api.patch(`/appointments/${id}`, { action: 'cancel' }); load() }
    catch (e) { setError(e.message) }
  }

  if (!items) return <div className="skeleton" />
  const upcoming = items.filter(a => ['pending', 'confirmed'].includes(a.status))
  const past = items.filter(a => !['pending', 'confirmed'].includes(a.status))

  const Row = ({ a, actions }) => (
    <div className="list-row">
      <div>
        <div className="title">{a.dermatologist_name}</div>
        <div className="sub">{fmtDate(a.appt_date)} · {fmtTime(a.appt_time)} · {a.consultation_type}
          {a.reason ? ` · ${a.reason}` : ''}</div>
        {a.doctor_notes && <div className="sub" style={{ color: 'var(--primary)' }}>Doctor's notes: {a.doctor_notes}</div>}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Badge status={a.status} />
        {actions && a.status !== 'completed' && (
          <button className="btn btn-danger btn-sm" onClick={() => cancel(a.id)}>Cancel</button>
        )}
      </div>
    </div>
  )

  return (
    <div className="grid" style={{ gap: 18 }}>
      {error && <div className="alert error">{error}</div>}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h2 className="section-title" style={{ marginBottom: 0 }}>Upcoming</h2>
          <Link className="btn btn-primary btn-sm" to="/app/dermatologists">Book new appointment</Link>
        </div>
        {upcoming.length === 0 ? <Empty>Nothing booked. Your next visit will appear here.</Empty>
          : upcoming.map(a => <Row a={a} key={a.id} actions />)}
      </div>
      <div className="card">
        <h2 className="section-title">History</h2>
        {past.length === 0 ? <Empty>Completed and cancelled visits will collect here.</Empty>
          : past.map(a => <Row a={a} key={a.id} />)}
      </div>
    </div>
  )
}
