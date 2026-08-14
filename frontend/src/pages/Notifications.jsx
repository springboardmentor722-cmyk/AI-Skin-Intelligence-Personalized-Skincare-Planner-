import React, { useEffect, useState } from 'react'
import { notificationApi } from '../api/endpoints'

const ICONS = {
  routine_reminder: '🧴',
  hydration: '💧',
  sleep: '😴',
  replenishment: '🛒',
  progress_alert: '📈',
  platform: '🔔',
}

export default function Notifications() {
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  const load = () => {
    notificationApi.list().then((res) => setNotifs(res.data)).finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      await notificationApi.generateReminders()
      load()
    } finally {
      setGenerating(false)
    }
  }

  const markRead = async (id) => {
    await notificationApi.markRead(id)
    load()
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-2xl font-semibold text-ink">Notifications</h1>
        <button onClick={handleGenerate} disabled={generating} className="btn-outline text-sm">
          {generating ? 'Checking...' : 'Refresh Reminders'}
        </button>
      </div>
      <p className="text-ink-soft mb-8 text-sm">Routine reminders, hydration nudges, and platform alerts.</p>

      {loading ? (
        <p className="text-ink-faint">Loading...</p>
      ) : notifs.length === 0 ? (
        <div className="card text-center py-10 text-ink-faint">No notifications yet. Click "Refresh Reminders" to check.</div>
      ) : (
        <div className="space-y-3">
          {notifs.map((n) => (
            <div key={n.id} className={`card flex items-start gap-3 ${n.is_read ? 'opacity-60' : ''}`}>
              <span className="text-xl">{ICONS[n.type] || '🔔'}</span>
              <div className="flex-1">
                <p className="text-sm text-ink">{n.message}</p>
                <p className="text-xs text-ink-faint mt-1">{new Date(n.created_at).toLocaleString()}</p>
              </div>
              {!n.is_read && (
                <button onClick={() => markRead(n.id)} className="text-xs text-brand-600 font-medium whitespace-nowrap">
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
