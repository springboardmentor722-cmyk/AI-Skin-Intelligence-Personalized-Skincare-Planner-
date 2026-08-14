import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Camera, ChevronDown, ChevronUp, BadgeCheck, Clock } from 'lucide-react'
import { dashboardApi } from '../api/endpoints'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'

export default function DermatologistDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedPatient, setExpandedPatient] = useState(null)
  const [patientPhotos, setPatientPhotos] = useState({})

  useEffect(() => {
    dashboardApi.dermatologist().then((res) => setData(res.data)).finally(() => setLoading(false))
  }, [])

  const togglePhotos = async (userId) => {
    if (expandedPatient === userId) {
      setExpandedPatient(null)
      return
    }
    setExpandedPatient(userId)
    if (!patientPhotos[userId]) {
      const res = await api.get(`/photos/user/${userId}`)
      setPatientPhotos((prev) => ({ ...prev, [userId]: res.data }))
    }
  }

  if (loading) return <div className="max-w-5xl mx-auto px-6 py-10 text-ink-faint">Loading...</div>

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="font-display text-2xl font-semibold text-ink mb-1">Dermatologist Dashboard</h1>
      <p className="text-ink-soft mb-6 text-sm">Recent patient assessments, risk insights, and photo-analysis review.</p>

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
          <BadgeCheck size={16} /> Your credentials are verified — clients see a verified badge on your reviews.
        </div>
      )}

      <div className="space-y-4">
        {data.recent_assessments.length === 0 ? (
          <div className="card text-center py-10 text-ink-faint">No patient assessments yet.</div>
        ) : (
          data.recent_assessments.map((p, i) => (
            <div key={i} className="card">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-medium text-ink">{p.name}</div>
                  <div className="text-xs text-ink-faint">{new Date(p.created_at).toLocaleString()}</div>
                </div>
                <span className={`badge ${p.overall_condition_score >= 50 ? 'bg-rose-50 text-rose-600' : 'bg-teal-50 text-teal-700'}`}>
                  Condition: {p.overall_condition_score}/100
                </span>
              </div>
              <div className="text-sm text-ink-soft mb-2">
                <strong>Prioritized concerns:</strong> {p.prioritized_concerns.join(', ')}
              </div>
              {p.risk_factors.length > 0 && (
                <ul className="text-xs text-gold-700 list-disc list-inside space-y-1 mb-3">
                  {p.risk_factors.map((rf, j) => <li key={j}>{rf}</li>)}
                </ul>
              )}

              <button
                onClick={() => togglePhotos(p.user_id)}
                className="text-xs font-medium text-teal-600 flex items-center gap-1"
              >
                <Camera size={13} /> Photo analysis {expandedPatient === p.user_id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>

              {expandedPatient === p.user_id && (
                <div className="mt-3 pt-3 border-t border-stone-200">
                  {!patientPhotos[p.user_id] ? (
                    <p className="text-xs text-ink-faint">Loading...</p>
                  ) : patientPhotos[p.user_id].length === 0 ? (
                    <p className="text-xs text-ink-faint">No photos uploaded by this patient.</p>
                  ) : (
                    patientPhotos[p.user_id].map((photo) => (
                      <div key={photo.id} className="text-xs text-ink-soft mb-2 grid grid-cols-4 gap-2">
                        <div>Redness: <span className="data-figure">{photo.redness_score?.toFixed(0) ?? '—'}</span></div>
                        <div>Texture: <span className="data-figure">{photo.texture_score?.toFixed(0) ?? '—'}</span></div>
                        <div>Evenness: <span className="data-figure">{photo.evenness_score?.toFixed(0) ?? '—'}</span></div>
                        <div>Oiliness: <span className="data-figure">{photo.oiliness_score?.toFixed(0) ?? '—'}</span></div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
