import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { BadgeCheck, Clock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const roleLinks = {
  user: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/profile', label: 'Skin Profile' },
    { to: '/assessment', label: 'Assessment' },
    { to: '/photo-analysis', label: 'Photo Analysis' },
    { to: '/routines', label: 'Routine' },
    { to: '/products', label: 'Products' },
    { to: '/ingredients', label: 'Ingredients' },
    { to: '/progress', label: 'Progress' },
    { to: '/notifications', label: 'Alerts' },
  ],
  consultant: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/clients', label: 'Clients' },
    { to: '/verification', label: 'Get Verified' },
  ],
  dermatologist: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/patients', label: 'Patients' },
    { to: '/verification', label: 'Get Verified' },
  ],
  admin: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/verification', label: 'Verification Queue' },
  ],
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (!user) return null
  const links = roleLinks[user.role] || roleLinks.user
  const showVerificationBadge = ['consultant', 'dermatologist'].includes(user.role)

  return (
    <nav className="bg-white border-b border-stone-200/70 sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/dashboard" className="font-display font-semibold text-ink text-lg tracking-tight">
            Skinsight
          </Link>
          <div className="hidden lg:flex gap-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-ink-soft hover:bg-stone-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {showVerificationBadge && (
            user.verification_status === 'verified' ? (
              <span className="badge bg-teal-50 text-teal-700 flex items-center gap-1"><BadgeCheck size={12} /> Verified</span>
            ) : (
              <span className="badge bg-gold-50 text-gold-600 flex items-center gap-1"><Clock size={12} /> {user.verification_status === 'rejected' ? 'Not approved' : 'Pending'}</span>
            )
          )}
          <span className="text-sm text-ink-faint hidden sm:inline">
            {user.name} · <span className="capitalize">{user.role}</span>
          </span>
          <button
            onClick={() => { logout(); navigate('/') }}
            className="btn-outline text-sm py-1.5 px-3"
          >
            Log out
          </button>
        </div>
      </div>
      <div className="lg:hidden flex overflow-x-auto gap-1 px-4 pb-2">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium ${
              location.pathname === link.to ? 'bg-teal-50 text-teal-700' : 'text-ink-soft'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
