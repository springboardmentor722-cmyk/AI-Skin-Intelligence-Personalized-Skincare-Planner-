// frontend/src/components/AdminSidebar.js

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/admin-theme.css';

const ADMIN_MENU = [
  { path: '/dashboard/admin', icon: '▦', label: 'Dashboard' },
  { path: '/admin/users', icon: '⌁', label: 'User Management' },
  { path: '/admin/role-permissions', icon: '◇', label: 'Role & Permissions' },
  { path: '/admin/assessments', icon: '◌', label: 'Skin Assessments' },
  { path: '/admin/routines', icon: '≡', label: 'Routine Management' },
  { path: '/admin/products', icon: '◇', label: 'Product Management' },
  { path: '/admin/reports', icon: '▤', label: 'Reports & Analytics' },
];

export default function AdminSidebar({ open = true, onToggle }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/dashboard/admin') {
      return location.pathname === '/dashboard/admin';
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <aside className={`admin-sidebar ${open ? 'is-open' : 'is-collapsed'}`}>
      <button type="button" className="admin-brand" onClick={() => navigate('/dashboard/admin')}>
        <span className="admin-brand-mark">✦</span>
        {open && (
          <span>
            <strong>Skin Intelligence</strong>
            <small>Admin Panel</small>
          </span>
        )}
      </button>

      {open && <div className="admin-sidebar-label">ADMIN PORTAL</div>}

      <nav className="admin-sidebar-nav" aria-label="Admin navigation">
        {ADMIN_MENU.map((item) => (
          <button
            key={item.path}
            type="button"
            title={item.label}
            className={`admin-nav-item ${isActive(item.path) ? 'is-active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="admin-nav-icon">{item.icon}</span>
            {open && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {open && (
        <div className="admin-status-widget">
          <div className="admin-status-header">
            <span className="admin-status-dot">●</span>
            <span className="admin-status-title">Platform Status</span>
          </div>
          <div className="admin-status-body">
            <span className="admin-status-text">All systems operational</span>
            <span className="admin-status-time">
              Last checked: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}

      <button type="button" className="admin-logout" onClick={handleLogout} title="Logout">
        <span className="admin-nav-icon">↪</span>
        {open && <span>Logout</span>}
      </button>

      {onToggle && (
        <button
          type="button"
          className="admin-sidebar-toggle"
          onClick={onToggle}
          aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {open ? '◀' : '▶'}
        </button>
      )}
    </aside>
  );
}

export { ADMIN_MENU };