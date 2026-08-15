// frontend/src/components/ProfessionalSidebar.js

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/professional-theme.css';

export default function ProfessionalSidebar({ open = true, onToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [userRole, setUserRole] = useState('consultant');
  const [userName, setUserName] = useState('');

  useEffect(() => {
const role = localStorage.getItem('role') || 'consultant';
    const name = localStorage.getItem('userName') || 'Professional';
    setUserRole(role);
    setUserName(name);
  }, []);

  const isConsultant = userRole === 'consultant';
  const roleDisplay = isConsultant ? 'Consultant' : 'Dermatologist';

  // Menu items for Consultant
  const consultantMenu = [
    { path: '/dashboard/consultant', icon: '▦', label: 'Dashboard' },
    { path: '/consultant/clients', icon: '⌁', label: 'Clients' },
    { path: '/consultant/assessments', icon: '◌', label: 'Assessments' },
    { path: '/consultant/routines', icon: '≡', label: 'Routine Plans' },
    { path: '/consultant/recommend', icon: '◇', label: 'Product Recommendations' },
    { path: '/consultant/progress', icon: '↗', label: 'Progress Tracking' },
    { path: '/consultant/reports', icon: '▤', label: 'Reports' },
    { path: '/consultant/followups', icon: '◷', label: 'Follow-ups & Notes' },
    { path: '/consultant/reminders', icon: '◉', label: 'Reminders' },
    { path: '/consultant/skin-concerns-guide', icon: '◈', label: 'Skin Concerns Guide' },
  ];

  // Menu items for Dermatologist
  const dermatologistMenu = [
    { path: '/dashboard/dermatologist', icon: '▦', label: 'Dashboard' },
    { path: '/dermatologist/patients', icon: '⌁', label: 'Patients' },
    { path: '/dermatologist/assessments', icon: '◌', label: 'Assessments' },
    { path: '/dermatologist/treatment-plans', icon: '≡', label: 'Treatment Plans' },
    { path: '/dermatologist/prescriptions', icon: '◇', label: 'Prescriptions' },
    { path: '/dermatologist/progress', icon: '↗', label: 'Progress Tracking' },
    { path: '/dermatologist/reports', icon: '▤', label: 'Reports' },
    { path: '/dermatologist/consultations', icon: '◌', label: 'Consultations' },
    { path: '/dermatologist/followups', icon: '◷', label: 'Follow-ups' },
    { path: '/dermatologist/reminders', icon: '◉', label: 'Reminders' },
    { path: '/dermatologist/skin-conditions-guide', icon: '◈', label: 'Skin Conditions Guide' },
  ];

  const menuItems = isConsultant ? consultantMenu : dermatologistMenu;

  const isActive = (path) => {
    if (path === '/dashboard/consultant' || path === '/dashboard/dermatologist') {
      return location.pathname === path;
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  // Determine which dashboard path to use for brand click
  const dashboardPath = isConsultant ? '/dashboard/consultant' : '/dashboard/dermatologist';

  return (
    <aside className={`professional-sidebar ${open ? 'is-open' : 'is-collapsed'} role-${userRole}`}>
      <button type="button" className="professional-brand" onClick={() => handleNavigate(dashboardPath)}>
        <span className="professional-brand-mark">✦</span>
        {open && (
          <span>
            <strong>Skin Intelligence</strong>
            <small>{roleDisplay} Panel</small>
          </span>
        )}
      </button>

      {open && <div className="professional-sidebar-label">{roleDisplay.toUpperCase()} PORTAL</div>}

      <nav className="professional-sidebar-nav" aria-label={`${roleDisplay} navigation`}>
        {menuItems.map((item) => (
          <button
            key={item.path}
            type="button"
            title={item.label}
            className={`professional-nav-item ${isActive(item.path) ? 'is-active' : ''}`}
            onClick={() => handleNavigate(item.path)}
          >
            <span className="professional-nav-icon">{item.icon}</span>
            {open && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      <button type="button" className="professional-logout" onClick={handleLogout} title="Logout">
        <span className="professional-nav-icon">↪</span>
        {open && <span>Logout</span>}
      </button>

      {onToggle && (
        <button
          type="button"
          className="professional-sidebar-toggle"
          onClick={onToggle}
          aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {open ? '◀' : '▶'}
        </button>
      )}
    </aside>
  );
}