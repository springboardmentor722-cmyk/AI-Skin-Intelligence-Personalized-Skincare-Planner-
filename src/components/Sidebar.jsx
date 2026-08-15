import { NavLink, useNavigate } from "react-router-dom";
import { LogOut, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./Sidebar.css";

/**
 * Reusable role-aware sidebar. `items` is an array of
 * { label, to, icon, comingSoon }, where `icon` is a lucide-react
 * component. Each dashboard page supplies its own menu (from
 * src/config/sidebarConfig.js) so the sidebar stays a dumb, reusable shell.
 */
export default function Sidebar({ items, roleLabel }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-mark" aria-hidden="true">
          <Sparkles size={18} />
        </span>
        <div>
          <p className="sidebar-brand-name">Skin Intelligence</p>
          <p className="sidebar-role-label">{roleLabel} Panel</p>
        </div>
      </div>

      <p className="sidebar-section-label">Main Menu</p>
      <nav className="sidebar-nav">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
              end={item.to.endsWith("dashboard")}
            >
              <span className="sidebar-link-content">
                {Icon && <Icon size={17} className="sidebar-link-icon" />}
                <span>{item.label}</span>
              </span>
              {/* {item.comingSoon && <span className="badge badge-coming-soon">Soon</span>} */}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer-card">
        <p className="sidebar-footer-name">{user?.full_name}</p>
        <p className="sidebar-footer-email">{user?.email}</p>
        <button className="btn btn-ghost btn-block sidebar-logout" onClick={handleLogout}>
          <LogOut size={15} /> Logout
        </button>
      </div>
    </aside>
  );
}
