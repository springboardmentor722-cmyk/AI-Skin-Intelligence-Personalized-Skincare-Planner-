import { useState } from 'react'
import { api } from '../../api/client'

export default function Broadcast() {
  const [form, setForm] = useState({ title: '', body: '', role: '' })
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault(); setMsg(null); setBusy(true)
    try {
      const res = await api.post('/admin/notifications/broadcast',
        { title: form.title, body: form.body, role: form.role || null })
      setMsg({ kind: 'ok', text: `Delivered to ${res.recipients} account${res.recipients === 1 ? '' : 's'}.` })
      setForm({ title: '', body: '', role: '' })
    } catch (err) { setMsg({ kind: 'error', text: err.message }) } finally { setBusy(false) }
  }

  return (
    <div className="card" style={{ maxWidth: 620 }}>
      <h2 className="section-title">Broadcast a notification</h2>
      <p className="stat-hint" style={{ marginBottom: 16 }}>
        Sends an in-app notification to every active account, or one role only.
      </p>
      {msg && <div className={`alert ${msg.kind}`}>{msg.text}</div>}
      <form onSubmit={submit}>
        <div className="field"><label htmlFor="title">Title</label>
          <input id="title" className="input" required value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
        <div className="field"><label htmlFor="body">Message</label>
          <textarea id="body" className="input" value={form.body}
            onChange={e => setForm(f => ({ ...f, body: e.target.value }))} /></div>
        <div className="field"><label htmlFor="role">Audience</label>
          <select id="role" className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
            <option value="">Everyone</option>
            <option value="user">Users</option>
            <option value="dermatologist">Dermatologists</option>
            <option value="consultant">Consultants</option>
            <option value="admin">Administrators</option>
          </select></div>
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Sending…' : 'Send broadcast'}</button>
      </form>
    </div>
  )
}
