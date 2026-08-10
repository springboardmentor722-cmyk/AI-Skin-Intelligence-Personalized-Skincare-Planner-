import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const USER_LINKS = [
  { to: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { to: "/skin-profile", label: "Skin Profile", icon: "profile" },
  { to: "/skin-assessment", label: "Assessment", icon: "assessment" },
  { to: "/dermatologist", label: "Dermatologist", icon: "dermatologist" },
  { to: "/recommendations", label: "Recommendations", icon: "recommendations" },
  { to: "/progress", label: "Progress Logs", icon: "progress" },
];

const CONSULTANT_LINKS = [
  { to: "/consultant/dashboard", label: "Dashboard", icon: "dashboard" },
  { to: "/consultant/profile", label: "Profile", icon: "profile" },
  { to: "/consultant/customers", label: "Customers", icon: "customers" },
  { to: "/consultant/recommendations", label: "Recommendations", icon: "recommendations" },
  { to: "/consultant/dermatologists", label: "Dermatologists", icon: "dermatologist" },
];

const DERMATOLOGIST_LINKS = [
  { to: "/dermatologist/dashboard", label: "Dashboard", icon: "dashboard" },
  { to: "/dermatologist/profile", label: "Profile", icon: "profile" },
  { to: "/dermatologist/patients", label: "Patients", icon: "patients" },
  { to: "/dermatologist/appointments", label: "Appointments", icon: "appointments" },
  { to: "/dermatologist/consultants", label: "Consultants", icon: "consultants" },
];

const ADMIN_LINKS = [
  { to: "/admin", label: "Admin Panel", icon: "admin" },
];

const renderIcon = (key) => {
  switch (key) {
    case "dashboard":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
      );
    case "profile":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
      );
    case "assessment":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
      );
    case "dermatologist":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
      );
    case "recommendations":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
      );
    case "progress":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
      );
    case "customers":
    case "patients":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
      );
    case "appointments":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
      );
    case "consultants":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
      );
    case "admin":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.5 1z" /></svg>
      );
    default:
      return null;
  }
};

export default function Navbar() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  const links = user?.role === "administrator"
    ? ADMIN_LINKS
    : user?.role === "dermatologist"
      ? DERMATOLOGIST_LINKS
      : user?.role === "skincare_consultant"
        ? CONSULTANT_LINKS
        : USER_LINKS;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="sidebar">
      <div className="brand" style={{ display: "flex", gap: "0.75rem", alignItems: "center", padding: "0 0.5rem 0.5rem 0.5rem", marginBottom: "1.5rem" }}>
        <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: "var(--color-primary)" }}>
          <path d="M12 2a5 5 0 0 0-5 5v1a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5z" />
          <path d="M17 16c.4-.3.8-.5 1.2-.8A8 8 0 0 0 6.8 12c0 2.2.9 4.2 2.4 5.7M12 12v3m-2-1.5h4" strokeLinecap="round" />
        </svg>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontWeight: "800", fontSize: "1.1rem", letterSpacing: "-0.02em", color: "var(--color-ink)", lineHeight: 1.1 }}>SkinGenie</span>
          <span style={{ display: "block", fontSize: "0.62rem", letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--color-ink-faint)", fontWeight: "700" }}>Clinical Platform</span>
        </div>
      </div>
      
      <button 
        type="button" 
        onClick={toggleTheme} 
        style={{
          background: "var(--color-surface-sunken)",
          border: "1px solid var(--color-border)",
          color: "var(--color-ink)",
          padding: "0.5rem",
          borderRadius: "var(--radius-sm)",
          fontSize: "0.78rem",
          cursor: "pointer",
          marginBottom: "1.25rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          fontWeight: "600",
          width: "100%"
        }}
      >
        {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
      </button>

      <nav className="nav-links" aria-label="Main navigation" style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0.75rem", borderRadius: "6px", fontSize: "0.82rem", fontWeight: "600", textDecoration: "none" }}
          >
            {renderIcon(link.icon)}
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
      {token && (
        <div className="sidebar-footer" style={{ marginTop: "auto", paddingTop: "1rem" }}>
          <button className="btn-logout" onClick={handleLogout} style={{ width: "100%", padding: "0.5rem", fontSize: "0.8rem", fontWeight: "600" }}>Log out</button>
        </div>
      )}
    </aside>
  );
}
