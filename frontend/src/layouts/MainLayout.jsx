import { useState } from "react";
import { NavLink } from "react-router-dom";
import { TbLogout, TbMenu2, TbX } from "react-icons/tb";
import { useAuth } from "../context/AuthContext";

const SparklesIcon = ({ className = "w-4 h-4 text-purple-600" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L14.5 8.5L21 11L14.5 13.5L12 20L9.5 13.5L3 11L9.5 8.5L12 2Z" />
  </svg>
);

export default function MainLayout({ navItems = [], brandLabel = "Skin AI", children }) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavList = ({ onNavigate }) => (
    <nav className="flex flex-col gap-1.5">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={({ isActive }) =>
            `nav-item font-medium transition-all ${
              isActive
                ? "bg-purple-600 text-white font-semibold shadow-md shadow-purple-500/25"
                : "text-purple-900/80 hover:bg-purple-100/70 hover:text-purple-950"
            }`
          }
        >
          <span className="text-base" aria-hidden="true">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gradient-to-br from-purple-100 via-purple-50 to-indigo-100 relative">
      {/* Mobile top bar */}
      <div className="sm:hidden glass flex items-center justify-between p-3.5 mb-4 border border-purple-200/60">
        <div className="flex items-center gap-2 text-purple-950 font-bold font-display text-base">
          <SparklesIcon className="w-4 h-4 text-purple-600" />
          <span>{brandLabel}</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu" className="text-purple-900 text-xl">
          {mobileOpen ? <TbX /> : <TbMenu2 />}
        </button>
      </div>

      {mobileOpen && (
        <div className="sm:hidden glass p-4 mb-4 border border-purple-200/60 animate-in">
          <NavList onNavigate={() => setMobileOpen(false)} />
          <div className="border-t border-purple-200/60 mt-3 pt-3">
            <p className="text-xs text-purple-800/80 truncate mb-2 font-medium">{user?.sub}</p>
            <button onClick={logout} className="nav-item w-full text-rose-600 hover:bg-rose-50 font-semibold">
              <TbLogout className="text-base" /> Log out
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-6 max-w-[1240px] mx-auto">
        {/* Desktop sidebar */}
        <aside className="hidden sm:block w-52 glass p-5 h-fit sticky top-6 border border-purple-200/70 shadow-xl">
          <div className="flex items-center gap-2 font-display text-lg font-bold text-purple-950 mb-6">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/30">
              <SparklesIcon className="w-4 h-4 text-white" />
            </div>
            <span>{brandLabel}</span>
          </div>

          <NavList />

          <div className="border-t border-purple-200/60 mt-6 pt-4">
            <p className="text-xs text-purple-800/80 truncate mb-2 font-medium">{user?.sub}</p>
            <button
              onClick={logout}
              className="nav-item w-full text-rose-600 hover:bg-rose-50 font-semibold flex items-center gap-2"
            >
              <TbLogout className="text-base" aria-hidden="true" /> Log out
            </button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col gap-6 min-w-0">{children}</main>
      </div>
    </div>
  );
}
