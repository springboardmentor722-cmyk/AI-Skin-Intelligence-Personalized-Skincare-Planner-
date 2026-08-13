import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { Avatar, Badge, Empty, Modal, Skeletons } from '../../components/ui'

const TYPES = [
  ['one_to_one', 'One-to-one session'],
  ['routine_planning', 'Routine planning'],
  ['lifestyle', 'Lifestyle guidance'],
  ['product', 'Product consultation'],
  ['diet', 'Diet consultation'],
  ['anti_aging', 'Anti-aging consultation'],
  ['sensitive_skin', 'Sensitive skin consultation'],
]

export default function Consultants() {
  const [consultants, setConsultants] = useState(null)
  const [requests, setRequests] = useState(null)
  const [target, setTarget] = useState(undefined) // undefined = closed, null = any consultant, object = specific

  const load = () => {
    api.get('/consultants').then(setConsultants).catch(() => setConsultants([]))
    api.get('/consultation-requests/me').then(setRequests).catch(() => setRequests([]))
  }
  useEffect(() => { load() }, [])

  const cancel = async (id) => { await api.patch(`/consultation-requests/${id}`, { action: 'cancel' }); load() }

  return (
    <div className="grid" style={{ gap: 18 }}>
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 className="section-title" style={{ marginBottom: 4 }}>Skincare consultants</h2>
          <p className="stat-hint">Request a personalized routine built around your skin profile, or book a 1:1 session.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setTarget(null)}>Request any consultant</button>
      </div>

      {!consultants ? <Skeletons n={2} /> : (
        <div className="grid cols-2">
          {consultants.map(c => (
            <div className="card hoverable" key={c.id}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
                <Avatar name={c.full_name} />
                <div>
                  <div style={{ fontWeight: 700 }}>{c.full_name}</div>
                  <div className="stat-hint"><span style={{ color: 'var(--gold)' }}>★ {c.rating.toFixed(1)}</span> · speaks {c.languages}</div>
                </div>
              </div>
              <p className="stat-hint" style={{ marginBottom: 6 }}>{c.bio}</p>
              <div className="pill-row" style={{ margin: '10px 0 14px' }}>
                {(c.expertise || '').split(',').slice(0, 3).map(s => <span className="badge neutral" key={s}>{s.trim()}</span>)}
              </div>
              <button className="btn btn-ghost" style={{ width: '100%' }} onClick={() => setTarget(c)}>
                Request {c.full_name.split(' ')[0]}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h2 className="section-title">My requests</h2>
        {!requests ? <div className="skeleton" /> : requests.length === 0
          ? <Empty>No requests yet — consultants reply here once you send one.</Empty>
          : requests.map(r => (
            <div className="list-row" key={r.id}>
              <div>
                <div className="title">{(TYPES.find(t => t[0] === r.request_type) || [null, r.request_type])[1]}</div>
                <div className="sub">{r.consultant_name} · {new Date(r.created_at).toLocaleDateString()}
                  {r.details ? ` · ${r.details}` : ''}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Badge status={r.status} />
                {r.status === 'pending' && <button className="btn btn-danger btn-sm" onClick={() => cancel(r.id)}>Cancel</button>}
              </div>
            </div>
          ))}
      </div>

      {target !== undefined && (
        <RequestModal consultant={target} onDone={() => { setTarget(undefined); load() }} onClose={() => setTarget(undefined)} />
      )}
    </div>
  )
}

function RequestModal({ consultant, onClose, onDone }) {
  const [type, setType] = useState('routine_planning')
  const [details, setDetails] = useState('')
  const [date, setDate] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const send = async () => {
    setBusy(true); setError('')
    try {
      await api.post('/consultation-requests', {
        consultant_user_id: consultant?.user_id ?? null,
        request_type: type, details,
        preferred_date: date || null,
      })
      onDone()
    } catch (e) { setError(e.message); setBusy(false) }
  }

  return (
    <Modal open onClose={onClose}
      title={consultant ? `Request ${consultant.full_name}` : 'Request a consultation'}
      sub={consultant ? consultant.expertise : 'Sent to all available consultants — the first to accept takes it.'}>
      {error && <div className="alert error">{error}</div>}
      <div className="field">
        <label htmlFor="rtype">What do you need?</label>
        <select id="rtype" className="input" value={type} onChange={e => setType(e.target.value)}>
          {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="rdate">Preferred date (optional)</label>
        <input id="rdate" className="input" type="date" value={date}
          min={new Date().toLocaleDateString('en-CA')}
          onChange={e => setDate(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="rdetails">Tell them about your skin</label>
        <textarea id="rdetails" className="input" value={details} onChange={e => setDetails(e.target.value)}
          placeholder="Your skin profile is shared automatically — add anything extra here." />
      </div>
      <button className="btn btn-primary" style={{ width: '100%' }} onClick={send} disabled={busy}>
        {busy ? 'Sending…' : 'Send request'}
      </button>
    </Modal>
  )
}
