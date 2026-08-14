import React, { useEffect, useState } from 'react'
import { dashboardApi, userApi } from '../api/endpoints'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardApi.admin().then((res) => setStats(res.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="max-w-5xl mx-auto px-6 py-10 text-ink-faint">Loading...</div>

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="font-display text-2xl font-semibold text-ink mb-1">Admin Dashboard</h1>
      <p className="text-ink-soft mb-8 text-sm">Platform-wide analytics and system status.</p>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {[
          ['Total Users', stats.total_users],
          ['Skin Profiles', stats.total_profiles],
          ['Assessments Run', stats.total_assessments],
          ['Routines Generated', stats.total_routines],
          ['Products in Catalog', stats.total_products],
          ['Ingredients in Catalog', stats.total_ingredients],
        ].map(([label, val]) => (
          <div key={label} className="card text-center">
            <div className="text-2xl font-semibold text-brand-600">{val}</div>
            <div className="text-xs text-ink-faint">{label}</div>
          </div>
        ))}
      </div>

      <div className="card mb-8">
        <h3 className="font-medium text-ink mb-4">System Status (live)</h3>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            ['SQL Database', stats.system_status.postgres_or_sqlite],
            ['MongoDB', stats.system_status.mongodb],
            ['Redis Cache', stats.system_status.redis],
            ['XGBoost Concern Model', stats.system_status.concern_severity_model_loaded],
            ['LightGBM Product Model', stats.system_status.product_suitability_model_loaded],
          ].map(([label, ok]) => (
            <div key={label} className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${ok ? 'bg-sage-500' : 'bg-stone-300'}`} />
              <span className="text-sm text-ink-soft">{label}</span>
              <span className={`text-xs ml-auto ${ok ? 'text-sage-600' : 'text-ink-faint'}`}>{ok ? 'Connected' : 'Not connected'}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="font-medium text-ink mb-4">Users by Role</h3>
        <div className="grid grid-cols-4 gap-4">
          {Object.entries(stats.users_by_role).map(([role, count]) => (
            <div key={role} className="text-center">
              <div className="text-xl font-semibold text-sage-600">{count}</div>
              <div className="text-xs text-ink-faint capitalize">{role}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
