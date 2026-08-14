import React, { useEffect, useState } from 'react'
import { userApi } from '../api/endpoints'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    userApi.listAll().then((res) => setUsers(res.data)).finally(() => setLoading(false))
  }

  useEffect(load, [])

  const toggleActive = async (u) => {
    if (u.is_active) await userApi.deactivate(u.id)
    else await userApi.activate(u.id)
    load()
  }

  if (loading) return <div className="max-w-5xl mx-auto px-6 py-10 text-ink-faint">Loading...</div>

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="font-display text-2xl font-semibold text-ink mb-1">User Management</h1>
      <p className="text-ink-soft mb-8 text-sm">Activate or deactivate accounts across all roles.</p>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ink-faint border-b border-stone-200">
              <th className="pb-3">Name</th>
              <th className="pb-3">Email</th>
              <th className="pb-3">Role</th>
              <th className="pb-3">Status</th>
              <th className="pb-3">Joined</th>
              <th className="pb-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-stone-100">
                <td className="py-3 font-medium text-ink">{u.name}</td>
                <td className="py-3 text-ink-soft">{u.email}</td>
                <td className="py-3 capitalize">{u.role}</td>
                <td className="py-3">
                  <span className={`badge ${u.is_active ? 'bg-sage-100 text-sage-700' : 'bg-rose-100 text-rose-600'}`}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-3 text-ink-faint">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="py-3">
                  <button onClick={() => toggleActive(u)} className="text-brand-600 font-medium text-xs">
                    {u.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
