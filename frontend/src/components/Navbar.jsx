import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const USER_LINKS = [
  { to: "/dashboard", label: "Dashboard", icon: "✨" },
  { to: "/skin-profile", label: "Skin Profile", icon: "🧴" },
  { to: "/skin-assessment", label: "Assessment", icon: "📝" },
  { to: "/dermatologist", label: "Dermatologist", icon: "🩺" },
  { to: "/recommendations", label: "Recommendations", icon: "🛍️" },
  { to: "/progress", label: "Progress Logs", icon: "📈" },
];

const CONSULTANT_LINKS = [
  { to: "/consultant/dashboard", label: "Dashboard", icon: "✨" },
  { to: "/consultant/profile", label: "Profile", icon: "🧴" },
  { to: "/consultant/customers", label: "Customers", icon: "👥" },
  { to: "/consultant/recommendations", label: "Recommendations", icon: "🛍️" },
  { to: "/consultant/dermatologists", label: "Dermatologists", icon: "🩺" },
];

const DERMATOLOGIST_LINKS = [
  { to: "/dermatologist/dashboard", label: "Dashboard", icon: "✨" },
  { to: "/dermatologist/profile", label: "Profile", icon: "🩺" },
  { to: "/dermatologist/patients", label: "Patients", icon: "👥" },
  { to: "/dermatologist/appointments", label: "Appointments", icon: "📅" },
  { to: "/dermatologist/consultants", label: "Consultants", icon: "💬" },
];

const ADMIN_LINKS = [
  { to: "/admin", label: "Admin Panel", icon: "🛠️" },
];

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
      <div className="brand" style={{ display: "flex", gap: "0.75rem", alignItems: "center", fontStyle: "normal", padding: "0 0.5rem 0.5rem 0.5rem", marginBottom: "1.5rem" }}>
        <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--color-primary)" }}>
          <path d="M12 2a5 5 0 0 0-5 5v1a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5z" />
          <path d="M17 16c.4-.3.8-.5 1.2-.8A8 8 0 0 0 6.8 12c0 2.2.9 4.2 2.4 5.7M12 12v3m-2-1.5h4" strokeLinecap="round" />
        </svg>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontWeight: "700", fontSize: "1.2rem", letterSpacing: "-0.01em", color: "var(--color-ink)" }}>SkinGenie</span>
          <span style={{ display: "block", fontSize: "0.62rem", letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--color-ink-faint)" }}>Clinical Skincare</span>
        </div>
      </div>
      
      <button 
        type="button" 
        onClick={toggleTheme} 
        style={{
          background: "var(--color-surface-sunken)",
          border: "none",
          color: "var(--color-ink)",
          padding: "0.5rem",
          borderRadius: "var(--radius-sm)",
          fontSize: "0.82rem",
          cursor: "pointer",
          marginBottom: "1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          fontWeight: "500"
        }}
      >
        {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
      </button>

      <nav className="nav-links" aria-label="Main navigation">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
          >
            <span className="nav-icon" aria-hidden="true">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>
      {token && (
        <div className="sidebar-footer">
          <button className="btn-logout" onClick={handleLogout}>Log out</button>
        </div>
      )}
    </aside>
  );
}
