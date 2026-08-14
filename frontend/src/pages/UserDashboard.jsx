import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ScanFace, Sparkles, ShoppingBag, TrendingUp, Camera } from 'lucide-react'
import { dashboardApi, scoringApi } from '../api/endpoints'
import ScoreGauge from '../components/ScoreGauge'

const QUICK_ACTIONS = [
  { to: '/assessment', icon: ScanFace, label: 'Run Assessment' },
  { to: '/profile', icon: Camera, label: 'Update Profile' },
  { to: '/routines', icon: Sparkles, label: 'Get Routine' },
  { to: '/products', icon: ShoppingBag, label: 'Find Products' },
  { to: '/progress', icon: TrendingUp, label: 'Track Progress' },
]

export default function UserDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [computing, setComputing] = useState(false)

  const load = () => {
    dashboardApi.user().then((res) => setData(res.data)).finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleCompute = async () => {
    setComputing(true)
    try {
      await scoringApi.compute()
      load()
    } catch (e) {
      alert(e.response?.data?.detail || 'Could not compute score yet — create your skin profile first.')
    } finally {
      setComputing(false)
    }
  }

  if (loading) return <div className="max-w-5xl mx-auto px-6 py-10 text-ink-faint">Loading dashboard...</div>

  if (!data?.has_profile) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <h1 className="font-display text-2xl font-semibold mb-3">Welcome! Let's set up your skin profile.</h1>
        <p className="text-ink-soft mb-6">We need a few details about your skin, lifestyle, and concerns before we can run your AI skin assessment.</p>
        <Link to="/profile" className="btn-primary">Create My Skin Profile</Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="font-display text-2xl font-semibold text-ink mb-1">Your Dashboard</h1>
      <p className="text-ink-soft mb-8 text-sm">Here's a snapshot of your skin health today.</p>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="card flex flex-col items-center justify-center">
          <ScoreGauge score={data.skin_health_score} label="Skin Health Score" />
          <button onClick={handleCompute} disabled={computing} className="btn-outline text-sm mt-4">
            {computing ? 'Computing...' : 'Recompute Score'}
          </button>
        </div>

        <div className="card">
          <h3 className="font-medium text-ink mb-3">Active Routines</h3>
          {data.active_routine_count === 0 ? (
            <p className="text-sm text-ink-faint mb-3">No active routines yet.</p>
          ) : (
            <ul className="space-y-1 mb-3">
              {data.active_routines.map((r) => (
                <li key={r} className="badge bg-teal-50 text-teal-700 mr-1 mb-1 capitalize">{r}</li>
              ))}
            </ul>
          )}
          <Link to="/routines" className="text-teal-600 text-sm font-medium">Manage routines →</Link>
        </div>

        <div className="card">
          <h3 className="font-medium text-ink mb-3">Notifications</h3>
          <p className="data-figure text-3xl font-semibold text-teal-700 mb-1">{data.unread_notifications}</p>
          <p className="text-sm text-ink-faint mb-3">unread alerts</p>
          <Link to="/notifications" className="text-teal-600 text-sm font-medium">View all →</Link>
        </div>
      </div>

      <div className="grid md:grid-cols-5 gap-4">
        {QUICK_ACTIONS.map((a) => (
          <Link key={a.to} to={a.to} className="card hover:shadow-lifted hover:-translate-y-0.5 transition-all text-center py-8">
            <a.icon size={22} className="mx-auto mb-3 text-teal-600" strokeWidth={1.75} />
            <div className="font-medium text-ink text-sm">{a.label}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
