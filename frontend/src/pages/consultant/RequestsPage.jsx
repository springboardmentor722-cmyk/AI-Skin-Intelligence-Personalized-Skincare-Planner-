import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { Badge, Empty, Modal, Skeletons, fmtDate, fmtTime } from '../../components/ui'

export default function ConsultantRequests() {
  const [requests, setRequests] = useState(null)
  const [error, setError] = useState('')
  const [viewing, setViewing] = useState(null)   // request whose skin profile is open
  const [skin, setSkin] = useState(null)

  const load = () => api.get('/consultation-requests/incoming').then(setRequests).catch(() => setRequests([]))
  useEffect(() => { load() }, [])

  const act = async (id, action) => {
    setError('')
    try { await api.patch(`/consultation-requests/${id}`, { action }); load() }
    catch (e) { setError(e.message) }
  }

  const openSkin = async (req) => {
    setViewing(req); setSkin(null)
    try { setSkin(await api.get(`/clients/${req.patient_id}/skin-profile`)) }
    catch (e) { setSkin({ error: e.message }) }
  }

  if (!requests) return <Skeletons n={2} />

  return (
    <div className="card">
      <h2 className="section-title">Consultation requests</h2>
      {error && <div className="alert error">{error}</div>}
      {requests.length === 0 ? <Empty>No requests yet. Open requests from any user appear here too.</Empty> : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Client</th><th>Type</th><th>Preferred</th><th>Details</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {requests.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.patient_name}</td>
                  <td>{r.request_type.replace(/_/g, ' ')}</td>
                  <td>{r.preferred_date ? `${fmtDate(r.preferred_date)}${r.preferred_time ? ' · ' + fmtTime(r.preferred_time) : ''}` : '—'}</td>
                  <td style={{ maxWidth: 220, color: 'var(--ink-soft)' }}>{r.details || '—'}</td>
                  <td><Badge status={r.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openSkin(r)}>Skin details</button>
                      {r.status === 'pending' && <>
                        <button className="btn btn-ok btn-sm" onClick={() => act(r.id, 'accept')}>Accept</button>
                        <button className="btn btn-danger btn-sm" onClick={() => act(r.id, 'reject')}>Decline</button>
                      </>}
                      {r.status === 'accepted' &&
                        <button className="btn btn-primary btn-sm" onClick={() => act(r.id, 'complete')}>Mark complete</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!viewing} onClose={() => setViewing(null)}
        title={viewing ? `${viewing.patient_name} — skin details` : ''}
        sub="Shared with you because this client sent you a request.">
        {!skin ? <div className="skeleton" /> : skin.error ? <div className="alert error">{skin.error}</div> : (
          <div className="grid cols-2" style={{ gap: 12 }}>
            {[['Age', skin.age], ['Gender', skin.gender], ['Skin type', skin.skin_type], ['Skin tone', skin.skin_tone],
              ['Concerns', skin.concerns], ['Allergies', skin.allergies], ['Sensitivities', skin.sensitivities],
              ['Current products', skin.current_products], ['Goals', skin.goals]].map(([k, v]) => (
              <div key={k}>
                <div className="stat-label">{k}</div>
                <div style={{ marginTop: 4, fontSize: 14 }}>{v || '—'}</div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}
