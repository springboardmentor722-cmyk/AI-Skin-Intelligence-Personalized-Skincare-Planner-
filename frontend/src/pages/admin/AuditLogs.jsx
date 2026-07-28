import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { Badge, Empty } from '../../components/ui'

export default function AuditLogs() {
  const [logs, setLogs] = useState(null)
  useEffect(() => { api.get('/admin/audit-logs?limit=300').then(setLogs).catch(() => setLogs([])) }, [])

  return (
    <div className="card">
      <h2 className="section-title">Audit logs</h2>
      <p className="stat-hint" style={{ marginBottom: 14 }}>
        Every sensitive action is recorded with actor, entity, before/after values, IP, and time.
      </p>
      {!logs ? <div className="skeleton" /> : logs.length === 0 ? <Empty>No activity recorded yet.</Empty> : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>When</th><th>Actor</th><th>Action</th><th>Entity</th><th>Change</th><th>IP</th><th>Status</th></tr>
            </thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id}>
                  <td style={{ whiteSpace: 'nowrap', color: 'var(--ink-soft)' }}>{new Date(l.created_at).toLocaleString()}</td>
                  <td>{l.actor_email || 'system'}</td>
                  <td style={{ fontWeight: 600 }}>{l.action}</td>
                  <td>{l.entity}{l.entity_id ? ` #${l.entity_id}` : ''}</td>
                  <td style={{ maxWidth: 260 }}>
                    {l.old_value && <div style={{ fontSize: 11.5, color: 'var(--danger)' }}>− {l.old_value}</div>}
                    {l.new_value && <div style={{ fontSize: 11.5, color: 'var(--ok)' }}>+ {l.new_value}</div>}
                  </td>
                  <td style={{ color: 'var(--ink-soft)' }}>{l.ip || '—'}</td>
                  <td><Badge status={l.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
