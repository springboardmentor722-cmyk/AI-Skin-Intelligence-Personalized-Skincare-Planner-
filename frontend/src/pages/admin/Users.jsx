import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { Avatar, Badge, Empty, Icon, Modal } from '../../components/ui'

const ROLES = ['user', 'dermatologist', 'consultant', 'admin']

export default function AdminUsers() {
  const [users, setUsers] = useState(null)
  const [role, setRole] = useState('')
  const [q, setQ] = useState('')
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'user' })

  const load = () => {
    const params = new URLSearchParams()
    if (role) params.set('role', role)
    if (q) params.set('q', q)
    api.get(`/admin/users${params.toString() ? `?${params}` : ''}`)
      .then(setUsers).catch(e => { setUsers([]); setError(e.message) })
  }
  useEffect(() => { load() }, [role])

  const patch = async (id, body) => {
    setError('')
    try { await api.patch(`/admin/users/${id}`, body); load() }
    catch (e) { setError(e.message) }
  }
  const remove = async (u) => {
    if (!window.confirm(`Delete ${u.full_name} (${u.email})? This cannot be undone.`)) return
    setError('')
    try { await api.del(`/admin/users/${u.id}`); load() } catch (e) { setError(e.message) }
  }
  const approveProvider = async (u, approve) => {
    setError('')
    const path = u.role === 'dermatologist' ? 'dermatologists' : 'consultants'
    try { await api.post(`/admin/${path}/${u.id}/approve?approve=${approve}`); load() }
    catch (e) { setError(e.message) }
  }
  const create = async (e) => {
    e.preventDefault(); setError('')
    try {
      await api.post('/admin/users', form)
      setCreating(false); setForm({ full_name: '', email: '', password: '', role: 'user' }); load()
    } catch (err) { setError(err.message) }
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        <h2 className="section-title" style={{ marginBottom: 0, marginRight: 'auto' }}>User management</h2>
        <input className="input" style={{ width: 200 }} placeholder="Search name or email"
          value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} />
        <select className="input" style={{ width: 170 }} value={role} onChange={e => setRole(e.target.value)}>
          <option value="">All roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <button className="btn btn-primary btn-sm" onClick={() => setCreating(true)}>
          <Icon name="plus" size={15} /> New user
        </button>
      </div>
      {error && <div className="alert error">{error}</div>}

      {!users ? <div className="skeleton" /> : users.length === 0 ? <Empty>No users match.</Empty> : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>User</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <Avatar name={u.full_name} />
                      <div>
                        <div style={{ fontWeight: 600 }}>{u.full_name}</div>
                        <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <select className="input" style={{ width: 140, padding: '6px 10px' }} value={u.role}
                      onChange={e => patch(u.id, { role: e.target.value })}>
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Badge status={u.is_active ? 'success' : 'cancelled'} />
                      {u.is_verified && <Badge status="neutral" />}
                    </div>
                  </td>
                  <td style={{ color: 'var(--ink-soft)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-ok'}`}
                        onClick={() => patch(u.id, { is_active: !u.is_active })}>
                        {u.is_active ? 'Suspend' : 'Reactivate'}
                      </button>
                      {(u.role === 'dermatologist' || u.role === 'consultant') && (
                        <button className={`btn btn-sm ${u.is_verified ? 'btn-ghost' : 'btn-ok'}`}
                          onClick={() => approveProvider(u, !u.is_verified)}>
                          {u.is_verified ? 'Revoke approval' : 'Approve'}
                        </button>
                      )}
                      <button className="btn btn-ghost btn-sm" onClick={() => remove(u)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="Create user"
        sub="Accounts created here are verified immediately.">
        <form onSubmit={create}>
          <div className="field"><label>Full name</label>
            <input className="input" required value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} /></div>
          <div className="field"><label>Email</label>
            <input className="input" type="email" required value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
          <div className="field"><label>Password (8+ characters)</label>
            <input className="input" type="password" required minLength={8} value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} /></div>
          <div className="field"><label>Role</label>
            <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select></div>
          <button className="btn btn-primary" style={{ width: '100%' }}>Create user</button>
        </form>
      </Modal>
    </div>
  )
}
