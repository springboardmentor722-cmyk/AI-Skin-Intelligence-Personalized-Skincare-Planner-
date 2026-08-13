import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Badge, Empty, Icon } from '../components/ui'

export default function Notifications() {
  const [items, setItems] = useState(null)
  const load = () => api.get('/notifications/me').then(setItems).catch(() => setItems([]))
  useEffect(() => { load() }, [])

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`)
    load()
  }

  return (
    <div className="card">
      <h2 className="section-title">Notifications</h2>
      {!items ? <div className="skeleton" /> : items.length === 0 ? (
        <Empty>You're all caught up. New appointment, routine, and platform updates land here.</Empty>
      ) : items.map(n => (
        <div className="list-row" key={n.id} style={{ opacity: n.is_read ? 0.6 : 1 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ color: 'var(--primary)' }}><Icon name="bell" /></span>
            <div>
              <div className="title">{n.title}</div>
              <div className="sub">{n.body} · {new Date(n.created_at).toLocaleString()}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Badge status={n.is_read ? 'neutral' : 'pending'} />
            {!n.is_read && <button className="btn btn-ghost btn-sm" onClick={() => markRead(n.id)}>Mark read</button>}
          </div>
        </div>
      ))}
    </div>
  )
}
