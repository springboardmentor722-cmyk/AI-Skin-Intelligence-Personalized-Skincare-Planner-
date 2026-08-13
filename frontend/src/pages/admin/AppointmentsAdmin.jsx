import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { Badge, Empty, fmtDate, fmtTime } from '../../components/ui'

export default function AdminAppointments() {
  const [rows, setRows] = useState(null)
  const [status, setStatus] = useState('')
  useEffect(() => { api.get('/admin/appointments').then(setRows).catch(() => setRows([])) }, [])

  const filtered = rows?.filter(a => !status || a.status === status)

  return (
    <div className="card">
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
        <h2 className="section-title" style={{ marginBottom: 0, marginRight: 'auto' }}>All appointments</h2>
        <select className="input" style={{ width: 170 }} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {['pending', 'confirmed', 'completed', 'cancelled', 'rejected'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      {!rows ? <div className="skeleton" /> : filtered.length === 0 ? <Empty>No appointments found.</Empty> : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>User</th><th>Dermatologist</th><th>When</th><th>Type</th><th>Reason</th><th>Status</th></tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600 }}>{a.patient_name}</td>
                  <td>{a.dermatologist_name}</td>
                  <td>{fmtDate(a.appt_date)} · {fmtTime(a.appt_time)}</td>
                  <td>{a.consultation_type}</td>
                  <td style={{ maxWidth: 200, color: 'var(--ink-soft)' }}>{a.reason || '—'}</td>
                  <td><Badge status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
