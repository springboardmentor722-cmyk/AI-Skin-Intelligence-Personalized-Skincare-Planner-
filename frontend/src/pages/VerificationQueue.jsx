import React, { useEffect, useState } from 'react'
import { BadgeCheck, XCircle, Clock } from 'lucide-react'
import api from '../api/client'

export default function VerificationQueue() {
  const [pending, setPending] = useState([])
  const [all, setAll] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    Promise.all([api.get('/verification/queue'), api.get('/verification/all')])
      .then(([p, a]) => { setPending(p.data); setAll(a.data) })
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const decide = async (userId, approve) => {
    await api.post(`/verification/${userId}/decide`, { approve })
    load()
  }

  if (loading) return <div className="max-w-4xl mx-auto px-6 py-10 text-ink-faint">Loading...</div>

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="font-display text-2xl font-semibold text-ink mb-1">Verification Queue</h1>
      <p className="text-ink-soft mb-8 text-sm">Review dermatologist and consultant credentials before they go live as verified.</p>

      <h3 className="font-medium text-ink mb-3 text-sm flex items-center gap-2">
        <Clock size={15} className="text-gold-500" /> Pending review ({pending.length})
      </h3>
      <div className="space-y-3 mb-10">
        {pending.length === 0 ? (
          <div className="card text-center py-8 text-ink-faint text-sm">Nothing waiting on review.</div>
        ) : (
          pending.map((u) => (
            <div key={u.id} className="card flex items-start justify-between gap-4">
              <div>
                <div className="font-medium text-ink">{u.name} <span className="text-xs text-ink-faint capitalize">· {u.role}</span></div>
                <div className="text-xs text-ink-faint mb-2">{u.email}</div>
                <div className="text-sm text-ink-soft"><strong>License:</strong> {u.license_number}</div>
                <div className="text-sm text-ink-soft"><strong>Credentials:</strong> {u.credential_notes}</div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => decide(u.id, true)} className="btn-primary text-xs py-1.5 px-3">Approve</button>
                <button onClick={() => decide(u.id, false)} className="btn-outline text-xs py-1.5 px-3">Reject</button>
              </div>
            </div>
          ))
        )}
      </div>

      <h3 className="font-medium text-ink mb-3 text-sm">All professional accounts</h3>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ink-faint border-b border-stone-200">
              <th className="pb-3">Name</th>
              <th className="pb-3">Role</th>
              <th className="pb-3">Status</th>
              <th className="pb-3">License</th>
            </tr>
          </thead>
          <tbody>
            {all.map((u) => (
              <tr key={u.id} className="border-b border-stone-100">
                <td className="py-3 font-medium text-ink">{u.name}</td>
                <td className="py-3 capitalize text-ink-soft">{u.role}</td>
                <td className="py-3">
                  <span className={`badge inline-flex items-center gap-1 ${
                    u.verification_status === 'verified' ? 'bg-teal-50 text-teal-700' :
                    u.verification_status === 'rejected' ? 'bg-rose-50 text-rose-600' : 'bg-gold-50 text-gold-600'
                  }`}>
                    {u.verification_status === 'verified' && <BadgeCheck size={12} />}
                    {u.verification_status === 'rejected' && <XCircle size={12} />}
                    {u.verification_status === 'pending' && <Clock size={12} />}
                    {u.verification_status}
                  </span>
                </td>
                <td className="py-3 text-ink-faint">{u.license_number || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
