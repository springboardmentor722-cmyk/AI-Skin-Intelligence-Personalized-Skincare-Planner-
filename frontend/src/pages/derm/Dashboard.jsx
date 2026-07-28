import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import { Badge, Empty, Skeletons, StatCard, fmtDate, fmtTime } from '../../components/ui'

export default function DermDashboard() {
  const [appointments, setAppointments] = useState(null)
  useEffect(() => { api.get('/appointments/incoming').then(setAppointments).catch(() => setAppointments([])) }, [])
  if (!appointments) return <Skeletons n={4} />

  const today = new Date().toISOString().slice(0, 10)
  const pending = appointments.filter(a => a.status === 'pending')
  const todays = appointments.filter(a => a.appt_date === today && a.status === 'confirmed')
  const upcoming = appointments.filter(a => a.status === 'confirmed' && a.appt_date >= today)
  const completed = appointments.filter(a => a.status === 'completed')

  return (
    <div className="grid" style={{ gap: 18 }}>
      <div className="grid cols-4">
        <StatCard label="Today's visits" value={todays.length} icon="calendar" />
        <StatCard label="Pending requests" value={pending.length} icon="clock"
          hint={pending.length ? 'Awaiting your response' : 'All caught up'}
          trend={pending.length ? 'down' : 'up'} />
        <StatCard label="Upcoming confirmed" value={upcoming.length} icon="check" />
        <StatCard label="Completed" value={completed.length} icon="clipboard" hint="All time" />
      </div>

      <div className="grid cols-2">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h2 className="section-title" style={{ marginBottom: 0 }}>Requests waiting on you</h2>
            <Link className="btn btn-ghost btn-sm" to="/app/derm/appointments">Manage all</Link>
          </div>
          {pending.length === 0 ? <Empty>No pending requests.</Empty> : pending.slice(0, 5).map(a => (
            <div className="list-row" key={a.id}>
              <div>
                <div className="title">{a.patient_name}</div>
                <div className="sub">{fmtDate(a.appt_date)} · {fmtTime(a.appt_time)} · {a.reason || 'No reason given'}</div>
              </div>
              <Badge status={a.status} />
            </div>
          ))}
        </div>
        <div className="card">
          <h2 className="section-title">Next confirmed visits</h2>
          {upcoming.length === 0 ? <Empty>Nothing confirmed yet.</Empty> : upcoming.slice(0, 5).map(a => (
            <div className="list-row" key={a.id}>
              <div>
                <div className="title">{a.patient_name}</div>
                <div className="sub">{fmtDate(a.appt_date)} · {fmtTime(a.appt_time)} · {a.consultation_type}</div>
              </div>
              <Badge status={a.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
