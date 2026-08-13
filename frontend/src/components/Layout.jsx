import { useEffect, useState } from 'react'
import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'
import { Icon, Logo } from './ui'

/* Role → navigation map. A page not listed for a role is unreachable in the UI,
   and the API enforces the same matrix server-side. */
const NAV = {
  user: [
    { to: '/app', label: 'Dashboard', icon: 'home', end: true },
    { to: '/app/skin-profile', label: 'Skin Profile', icon: 'face' },
    { to: '/app/assessment', label: 'Skin Assessment', icon: 'clipboard' },
    { to: '/app/planner', label: 'Daily Planner', icon: 'check' },
    { to: '/app/lifestyle', label: 'Lifestyle', icon: 'drop' },
    { to: '/app/routines', label: 'My Routines', icon: 'routine' },
    { to: '/app/dermatologists', label: 'Dermatologists', icon: 'stethoscope' },
    { to: '/app/appointments', label: 'Appointments', icon: 'calendar' },
    { to: '/app/consultants', label: 'Consultants', icon: 'chat' },
    { to: '/app/products', label: 'Products', icon: 'cart' },
    { to: '/app/progress', label: 'Progress', icon: 'chart' },
    { to: '/app/notifications', label: 'Notifications', icon: 'bell' },
  ],
  dermatologist: [
    { to: '/app', label: 'Dashboard', icon: 'home', end: true },
    { to: '/app/derm/appointments', label: 'Appointments', icon: 'calendar' },
    { to: '/app/derm/availability', label: 'Availability', icon: 'clock' },
    { to: '/app/derm/profile', label: 'My Practice', icon: 'stethoscope' },
    { to: '/app/notifications', label: 'Notifications', icon: 'bell' },
  ],
  consultant: [
    { to: '/app', label: 'Dashboard', icon: 'home', end: true },
    { to: '/app/consultant/requests', label: 'Requests', icon: 'clipboard' },
    { to: '/app/consultant/routine-builder', label: 'Routine Builder', icon: 'routine' },
    { to: '/app/notifications', label: 'Notifications', icon: 'bell' },
  ],
  admin: [
    { to: '/app', label: 'Dashboard', icon: 'home', end: true },
    { to: '/app/admin/users', label: 'Users', icon: 'users' },
    { to: '/app/admin/appointments', label: 'Appointments', icon: 'calendar' },
    { to: '/app/admin/products', label: 'Products', icon: 'cart' },
    { to: '/app/admin/broadcast', label: 'Broadcast', icon: 'megaphone' },
    { to: '/app/admin/audit-logs', label: 'Audit Logs', icon: 'shield' },
    { to: '/app/notifications', label: 'Notifications', icon: 'bell' },
  ],
}

const ROLE_LABEL = {
  user: 'User', dermatologist: 'Dermatologist',
  consultant: 'Skincare Consultant', admin: 'Administrator',
}

export function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('lumen_theme') || 'light')
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('lumen_theme', theme)
  }, [theme])
  return [theme, () => setTheme(t => (t === 'light' ? 'dark' : 'light'))]
}

export function Protected({ roles, children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div style={{ padding: 40 }}><div className="skeleton" /></div>
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/app" replace />
  return children
}

export default function Layout() {
  const { user, logout } = useAuth()
  const [theme, toggleTheme] = useTheme()
  const [hasUnread, setHasUnread] = useState(false)

  useEffect(() => {
    api.get('/notifications/me')
      .then(list => setHasUnread(list.some(n => !n.is_read)))
      .catch(() => {})
  }, [])

  const nav = NAV[user.role] || NAV.user
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <Logo size={32} />
          <span className="brand-name">lumen</span>
        </div>
        <span className="role-chip">{ROLE_LABEL[user.role]}</span>
        {nav.map(item => (
          <NavLink key={item.to} to={item.to} end={item.end} className="nav-link">
            <Icon name={item.icon} /><span>{item.label}</span>
          </NavLink>
        ))}
        <div className="sidebar-footer">
          <button className="nav-link" style={{ width: '100%', background: 'none', border: 'none' }} onClick={logout}>
            <Icon name="logout" /><span>Sign out</span>
          </button>
        </div>
      </aside>
      <main className="main">
        <div className="topbar">
          <div>
            <h1>Hello, {user.full_name.split(' ')[0]}</h1>
            <div className="topbar-sub">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>
          <div className="topbar-actions">
            <NavLink to="/app/notifications" className="icon-btn" aria-label="Notifications">
              <Icon name="bell" />
              {hasUnread && <span className="notif-dot" />}
            </NavLink>
            <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
              <Icon name={theme === 'light' ? 'moon' : 'sun'} />
            </button>
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  )
}
