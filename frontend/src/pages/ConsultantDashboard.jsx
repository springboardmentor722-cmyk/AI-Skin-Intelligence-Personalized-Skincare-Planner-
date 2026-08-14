import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BadgeCheck, Clock } from 'lucide-react'
import { dashboardApi, profileApi } from '../api/endpoints'
import { useAuth } from '../context/AuthContext'

export default function ConsultantDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardApi.consultant().then((res) => setData(res.data)).finally(() => setLoading(false))
  }, [])

  const viewProfile = async (userId) => {
    try {
      const res = await profileApi.getForUser(userId)
      setSelectedProfile(res.data)
    } catch {
      setSelectedProfile({ error: 'This client has not created a skin profile yet.' })
    }
  }

  if (loading) return <div className="max-w-5xl mx-auto px-6 py-10 text-ink-faint">Loading...</div>

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="font-display text-2xl font-semibold text-ink mb-1">Consultant Dashboard</h1>
      <p className="text-ink-soft mb-6 text-sm">{data.client_count} clients registered on the platform.</p>

      {user.verification_status === 'pending' && (
        <div className="card bg-gold-50 border-none mb-8 flex items-center gap-2 text-sm text-gold-700">
          <Clock size={16} /> Waiting for admin approval — clients see a "pending" badge until an admin approves your credentials.
        </div>
      )}
      {user.verification_status !== 'verified' && user.verification_status !== 'pending' && (
        <div className="card bg-gold-50 border-none mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gold-700">
            <Clock size={16} /> Your account isn't verified yet — clients see a "pending" badge until an admin approves your credentials.
          </div>
          <Link to="/verification" className="btn-primary text-xs py-1.5 px-3 whitespace-nowrap">Submit credentials</Link>
        </div>
      )}
      {user.verification_status === 'verified' && (
        <div className="card bg-teal-50 border-none mb-8 flex items-center gap-2 text-sm text-teal-700">
          <BadgeCheck size={16} /> Your credentials are verified.
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-medium text-ink mb-4">Client Profiles</h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {data.clients.map((c) => (
              <button
                key={c.user_id}
                onClick={() => viewProfile(c.user_id)}
                className="w-full text-left px-4 py-3 rounded-xl border border-stone-200 hover:border-teal-300 hover:bg-teal-50 transition-colors flex justify-between items-center"
              >
                <div>
                  <div className="font-medium text-sm text-ink">{c.name}</div>
                  <div className="text-xs text-ink-faint capitalize">{c.skin_type || 'No profile yet'}</div>
                </div>
                {c.latest_score !== null && c.latest_score !== undefined && (
                  <span className="badge bg-teal-50 text-teal-700">{c.latest_score}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="font-medium text-ink mb-4">Selected Client Details</h3>
          {!selectedProfile ? (
            <p className="text-sm text-ink-faint">Select a client to view their skin profile.</p>
          ) : selectedProfile.error ? (
            <p className="text-sm text-ink-faint">{selectedProfile.error}</p>
          ) : (
            <div className="space-y-2 text-sm">
              <div><span className="text-ink-faint">Skin Type:</span> <span className="capitalize">{selectedProfile.skin_type}</span></div>
              <div><span className="text-ink-faint">Age Group:</span> {selectedProfile.age_group}</div>
              <div><span className="text-ink-faint">Concerns:</span> {selectedProfile.skin_concerns.join(', ') || 'None'}</div>
              <div><span className="text-ink-faint">Allergies:</span> {selectedProfile.allergies.join(', ') || 'None'}</div>
              <div><span className="text-ink-faint">Sleep Quality:</span> {selectedProfile.sleep_quality}</div>
              <div><span className="text-ink-faint">Water Intake:</span> {selectedProfile.water_intake_liters} L/day</div>
              <div><span className="text-ink-faint">Budget Range:</span> {selectedProfile.budget_range}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
