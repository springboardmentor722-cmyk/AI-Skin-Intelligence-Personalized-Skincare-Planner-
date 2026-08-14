import React, { useEffect, useState } from 'react'
import { BadgeCheck, Clock, XCircle } from 'lucide-react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

const STATUS_META = {
  verified: { icon: BadgeCheck, color: 'text-teal-600', bg: 'bg-teal-50', label: 'Verified' },
  pending: { icon: Clock, color: 'text-gold-600', bg: 'bg-gold-50', label: 'Pending review' },
  rejected: { icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-50', label: 'Not approved' },
}

export default function Verification() {
  const { updateUser } = useAuth()
  const [status, setStatus] = useState(null)
  const [form, setForm] = useState({ license_number: '', credential_notes: '' })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    api.get('/verification/me').then((res) => {
      setStatus(res.data)
      setForm({ license_number: res.data.license_number || '', credential_notes: res.data.credential_notes || '' })
    }).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await api.post('/verification/submit', form)
      setStatus(res.data)
      updateUser(res.data)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="max-w-2xl mx-auto px-6 py-10 text-ink-faint">Loading...</div>

  const meta = STATUS_META[status?.verification_status] || STATUS_META.pending
  const Icon = meta.icon

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="font-display text-2xl font-semibold text-ink mb-1">Professional Verification</h1>
      <p className="text-ink-soft mb-6 text-sm">
        Submit your credentials so clients see a verified badge on your dashboard.
      </p>

      <div className={`card ${meta.bg} border-none flex items-center gap-3 mb-8`}>
        <Icon size={20} className={meta.color} />
        <div>
          <div className={`font-medium ${meta.color}`}>{meta.label}</div>
          {status?.verification_status === 'rejected' && (
            <div className="text-xs text-ink-faint mt-0.5">Update your details below and resubmit.</div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="label">License / Registration Number</label>
          <input
            className="input" required value={form.license_number}
            onChange={(e) => setForm({ ...form, license_number: e.target.value })}
            placeholder="e.g. MCI-12345-DERM"
          />
        </div>
        <div>
          <label className="label">Qualifications & Affiliation</label>
          <textarea
            className="input" required rows={4} value={form.credential_notes}
            onChange={(e) => setForm({ ...form, credential_notes: e.target.value })}
            placeholder="e.g. MD Dermatology, Apollo Hospitals, 6 years experience"
          />
        </div>
        <button type="submit" disabled={submitting || status?.verification_status === 'pending'} className="btn-primary w-full">
          {submitting ? 'Submitting...' : status?.verification_status === 'pending' ? 'Waiting for admin' : status?.verification_status === 'verified' ? 'Update Credentials' : 'Submit for Review'}
        </button>
      </form>
    </div>
  )
}
