// frontend/src/components/PatientSidebar.js

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/patient-theme.css';

const PATIENT_MENU = [
  { path: '/dashboard', icon: '▦', label: 'Dashboard' },
  { path: '/profile', icon: '◉', label: 'My Skin Profile' },
  { path: '/assessment', icon: '⌁', label: 'Skin Assessment' },
  { path: '/routine', icon: '✓', label: 'My Routine' },
  { path: '/products', icon: '▣', label: 'Product Recommendations' },
  { path: '/ingredient-analyzer', icon: '✧', label: 'Ingredient Analyzer' },
  { path: '/progress', icon: '↗', label: 'Progress Tracking' },
  { path: '/photo-upload', icon: '▧', label: 'Photo Upload' },
  { path: '/ai-analysis', icon: '◎', label: 'AI Analysis' },
  { path: '/professionals', icon: '＋', label: 'Find Professionals' }
];

export default function PatientSidebar({ open = true, onToggle }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <aside className={`patient-sidebar ${open ? 'is-open' : 'is-collapsed'}`}>
      <button type="button" className="patient-brand" onClick={() => navigate('/dashboard')}>
        <span className="patient-brand-mark">✦</span>
        {open && (
          <span>
            <strong>Skin Intelligence</strong>
            <small>Patient portal</small>
          </span>
        )}
      </button>

      {open && <div className="patient-sidebar-label">PATIENT PORTAL</div>}

      <nav className="patient-sidebar-nav" aria-label="Patient navigation">
        {PATIENT_MENU.map((item) => (
          <button
            key={item.path}
            type="button"
            title={item.label}
            className={`patient-nav-item ${isActive(item.path) ? 'is-active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="patient-nav-icon">{item.icon}</span>
            {open && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      <button type="button" className="patient-logout" onClick={handleLogout} title="Logout">
        <span className="patient-nav-icon">↪</span>
        {open && <span>Logout</span>}
      </button>

      {onToggle && (
        <button
          type="button"
          className="patient-sidebar-toggle"
          onClick={onToggle}
          aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {open ? '‹' : '›'}
        </button>
      )}
    </aside>
  );
}

export { PATIENT_MENU };