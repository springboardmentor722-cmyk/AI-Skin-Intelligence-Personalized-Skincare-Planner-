import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import { Skeletons, StatCard } from '../../components/ui'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [logs, setLogs] = useState(null)

  useEffect(() => {
    api.get('/admin/stats').then(setStats).catch(() => setStats({}))
    api.get('/admin/audit-logs?limit=8').then(setLogs).catch(() => setLogs([]))
  }, [])

  if (!stats) return <Skeletons n={4} />
  const approvals = (stats.pending_derm_approvals || 0) + (stats.pending_consultant_approvals || 0)

  return (
    <div className="grid" style={{ gap: 18 }}>
      <div className="grid cols-4">
        <StatCard label="Total users" value={stats.users_total ?? 0} icon="users"
          hint={`${stats.patients ?? 0} users · ${stats.dermatologists ?? 0} derms · ${stats.consultants ?? 0} consultants`} />
        <StatCard label="Appointments" value={stats.appointments_total ?? 0} icon="calendar"
          hint={`${stats.appointments_pending ?? 0} pending · ${stats.appointments_confirmed ?? 0} confirmed`} />
        <StatCard label="Consultation requests" value={stats.consultation_requests ?? 0} icon="clipboard" />
        <StatCard label="Provider approvals" value={approvals} icon="shield"
          hint={approvals ? 'Review in Users' : 'Nothing waiting'} trend={approvals ? 'down' : 'up'} />
      </div>

      <div className="grid cols-4">
        <StatCard label="Products" value={stats.products ?? 0} icon="cart" hint="In the catalogue" />
        <StatCard label="Ingredients" value={stats.ingredients ?? 0} icon="leaf" hint="Reference dataset" />
        <StatCard label="Audit events" value={stats.audit_events ?? 0} icon="shield" hint="Everything is recorded" />
        <StatCard label="Admins" value={stats.admins ?? 0} icon="settings" hint="Full-control accounts" />
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h2 className="section-title" style={{ marginBottom: 0 }}>Latest platform activity</h2>
          <Link className="btn btn-ghost btn-sm" to="/app/admin/audit-logs">Full audit log</Link>
        </div>
        {!logs ? <div className="skeleton" /> : logs.map(l => (
          <div className="list-row" key={l.id}>
            <div>
              <div className="title">{l.action}</div>
              <div className="sub">{l.actor_email || 'system'} · {l.entity}{l.entity_id ? ` #${l.entity_id}` : ''}</div>
            </div>
            <span className="sub" style={{ color: 'var(--ink-faint)', fontSize: 12 }}>
              {new Date(l.created_at).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
