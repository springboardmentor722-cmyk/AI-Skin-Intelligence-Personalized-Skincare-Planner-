import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import { Badge, Empty, Skeletons, StatCard, fmtDate } from '../../components/ui'

export default function ConsultantDashboard() {
  const [requests, setRequests] = useState(null)
  useEffect(() => { api.get('/consultation-requests/incoming').then(setRequests).catch(() => setRequests([])) }, [])
  if (!requests) return <Skeletons n={4} />

  const pending = requests.filter(r => r.status === 'pending')
  const accepted = requests.filter(r => r.status === 'accepted')
  const completed = requests.filter(r => r.status === 'completed')
  const routineAsks = pending.filter(r => r.request_type === 'routine_planning')

  return (
    <div className="grid" style={{ gap: 18 }}>
      <div className="grid cols-4">
        <StatCard label="New requests" value={pending.length} icon="clipboard"
          hint={pending.length ? 'Clients are waiting' : 'All caught up'}
          trend={pending.length ? 'down' : 'up'} />
        <StatCard label="Routine requests" value={routineAsks.length} icon="routine" hint="Awaiting a plan" />
        <StatCard label="Active clients" value={accepted.length} icon="users" hint="Accepted sessions" />
        <StatCard label="Completed sessions" value={completed.length} icon="check" hint="All time" />
      </div>

      <div className="grid cols-2">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h2 className="section-title" style={{ marginBottom: 0 }}>Incoming requests</h2>
            <Link className="btn btn-ghost btn-sm" to="/app/consultant/requests">Manage all</Link>
          </div>
          {pending.length === 0 ? <Empty>No new requests right now.</Empty> : pending.slice(0, 5).map(r => (
            <div className="list-row" key={r.id}>
              <div>
                <div className="title">{r.patient_name}</div>
                <div className="sub">
                  {r.request_type.replace(/_/g, ' ')}
                  {r.preferred_date ? ` · prefers ${fmtDate(r.preferred_date)}` : ''}
                </div>
              </div>
              <Badge status={r.status} />
            </div>
          ))}
        </div>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h2 className="section-title" style={{ marginBottom: 0 }}>Clients awaiting a routine</h2>
            <Link className="btn btn-ghost btn-sm" to="/app/consultant/routine-builder">Build one</Link>
          </div>
          {accepted.length === 0 ? <Empty>Accept a request to start working with a client.</Empty>
            : accepted.slice(0, 5).map(r => (
              <div className="list-row" key={r.id}>
                <div>
                  <div className="title">{r.patient_name}</div>
                  <div className="sub">{r.details || r.request_type.replace(/_/g, ' ')}</div>
                </div>
                <Badge status={r.status} />
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
