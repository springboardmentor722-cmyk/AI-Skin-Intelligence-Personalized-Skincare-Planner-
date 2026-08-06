import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/Authcontext";
import {
  Menu, Search, Bell, Sun, Moon, ChevronDown,
  User, Settings, LogOut, Sparkles, X,
} from "lucide-react";

const PAGE_TITLES = {
  "/dashboard": "Dashboard",
  "/skin-profile": "Skin Profile",
  "/lifestyle": "Lifestyle Tracking",
  "/skin-assessment": "Skin Assessment",
  "/routine": "My Routine",
  "/product-recommendation": "Product Recommendations",
  "/ingredients": "Ingredient Intelligence",
  "/progress": "Progress Tracker",
  "/analysis-history": "Analysis History",
  "/consultant-dashboard": "Consultant Dashboard",
  "/dermatologist-dashboard": "Dermatologist Dashboard",
  "/admin-dashboard": "Admin Panel",
  "/settings": "Settings",
};

const NOTIFICATIONS = [
  { id: 1, icon: "💧", title: "Hydration Reminder", desc: "Time to drink water — you've had 4/8 cups today.", time: "2 min ago", unread: true, color: "#3b82f6" },
  { id: 2, icon: "🌙", title: "Evening Routine", desc: "Don't forget your PM skincare routine tonight.", time: "1 hr ago", unread: true, color: "#8b5cf6" },
  { id: 3, icon: "📊", title: "Weekly Report Ready", desc: "Your skin score improved +8 points this week!", time: "3 hrs ago", unread: false, color: "#14b8a6" },
];

export default function Navbar({ onMenuToggle }) {
  const { user, logout, isDark, toggleTheme } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const searchRef = useRef(null);

  const pageTitle = PAGE_TITLES[location.pathname] || "AI Skin Intelligence";
  const unreadCount = NOTIFICATIONS.filter(n => n.unread).length;

  useEffect(() => {
    function handler(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header style={{
      position: "fixed", top: 0, right: 0, left: 0,
      height: "var(--navbar-height)",
      background: isDark ? "rgba(9,14,26,0.92)" : "rgba(255,255,255,0.88)",
      backdropFilter: "blur(20px) saturate(180%)",
      WebkitBackdropFilter: "blur(20px) saturate(180%)",
      borderBottom: "1px solid var(--border-color)",
      zIndex: 90, display: "flex", alignItems: "center",
      padding: "0 24px", gap: 12,
    }}
    className="dashboard-navbar"
    >
      {/* Hamburger (mobile) */}
      <button
        onClick={onMenuToggle}
        style={{
          width: 36, height: 36, borderRadius: 8, border: "1px solid var(--border-color)",
          background: "var(--bg-secondary)", cursor: "pointer", display: "flex",
          alignItems: "center", justifyContent: "center", color: "var(--text-secondary)",
          transition: "all 0.15s", flexShrink: 0,
        }}
        className="lg:hidden"
        onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-tertiary)"; e.currentTarget.style.borderColor = "var(--teal-500)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "var(--bg-secondary)"; e.currentTarget.style.borderColor = "var(--border-color)"; }}
      >
        <Menu size={16} />
      </button>

      {/* Page title */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {pageTitle}
        </h2>
      </div>

      {/* Search */}
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <Search size={14} style={{ position: "absolute", left: 11, color: "var(--text-muted)", pointerEvents: "none", zIndex: 1 }} />
        <motion.input
          type="text"
          value={searchVal}
          onChange={e => setSearchVal(e.target.value)}
          placeholder="Search..."
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          animate={{ width: searchFocused ? 220 : 160 }}
          transition={{ duration: 0.2 }}
          style={{
            paddingLeft: 34, paddingRight: searchVal ? 32 : 12, paddingTop: 7, paddingBottom: 7,
            border: `1px solid ${searchFocused ? "var(--teal-500)" : "var(--border-color)"}`,
            borderRadius: 8, fontSize: 13,
            background: searchFocused ? "var(--bg-secondary)" : "var(--bg-tertiary)",
            color: "var(--text-primary)", outline: "none",
            boxShadow: searchFocused ? "0 0 0 3px rgba(20,184,166,0.12)" : "none",
            transition: "border-color 0.2s, box-shadow 0.2s, background 0.2s",
          }}
          ref={searchRef}
        />
        {searchVal && (
          <button onClick={() => setSearchVal("")} style={{
            position: "absolute", right: 8, background: "none", border: "none",
            cursor: "pointer", color: "var(--text-muted)", padding: 0,
          }}>
            <X size={12} />
          </button>
        )}
      </div>

      {/* Dark mode toggle */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={toggleTheme}
        style={{
          width: 36, height: 36, borderRadius: 8, border: "1px solid var(--border-color)",
          background: "var(--bg-secondary)", cursor: "pointer", display: "flex",
          alignItems: "center", justifyContent: "center", color: "var(--text-secondary)",
          transition: "all 0.15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-tertiary)"; e.currentTarget.style.color = "var(--text-primary)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "var(--bg-secondary)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isDark ? "sun" : "moon"}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </motion.div>
        </AnimatePresence>
      </motion.button>

      {/* Notifications */}
      <div style={{ position: "relative" }} ref={notifRef}>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setNotifOpen(!notifOpen)}
          style={{
            width: 36, height: 36, borderRadius: 8, border: "1px solid var(--border-color)",
            background: "var(--bg-secondary)", cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center", color: "var(--text-secondary)",
            position: "relative", transition: "all 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-tertiary)"; e.currentTarget.style.color = "var(--text-primary)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "var(--bg-secondary)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span style={{
              position: "absolute", top: 6, right: 6, width: 8, height: 8,
              borderRadius: "50%", background: "#14b8a6",
              border: "2px solid var(--bg-secondary)",
            }} />
          )}
        </motion.button>

        <AnimatePresence>
          {notifOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              style={{
                position: "absolute", right: 0, top: "calc(100% + 8px)",
                width: 340, borderRadius: 14,
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
                boxShadow: "var(--shadow-xl)", zIndex: 200, overflow: "hidden",
              }}
            >
              <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>Notifications</span>
                  {unreadCount > 0 && (
                    <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, color: "#14b8a6", background: "rgba(20,184,166,0.12)", padding: "2px 7px", borderRadius: 20 }}>
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <button style={{ fontSize: 12, color: "var(--teal-600)", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>Mark all read</button>
              </div>
              {NOTIFICATIONS.map(n => (
                <div key={n.id} style={{
                  padding: "12px 16px", display: "flex", gap: 12, alignItems: "flex-start",
                  background: n.unread ? "rgba(20,184,166,0.025)" : "transparent",
                  borderBottom: "1px solid var(--border-subtle)", cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--bg-tertiary)"}
                onMouseLeave={e => e.currentTarget.style.background = n.unread ? "rgba(20,184,166,0.025)" : "transparent"}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: `${n.color}18`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                  }}>
                    {n.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)", display: "flex", justifyContent: "space-between" }}>
                      <span>{n.title}</span>
                      {n.unread && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#14b8a6", flexShrink: 0, marginTop: 4, marginLeft: 6 }} />}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2, lineHeight: 1.4 }}>{n.desc}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>{n.time}</div>
                  </div>
                </div>
              ))}
              <div style={{ padding: "10px 16px", textAlign: "center" }}>
                <button style={{ fontSize: 13, color: "var(--teal-600)", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
                  View all notifications
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Profile menu */}
      <div style={{ position: "relative" }} ref={profileRef}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setProfileOpen(!profileOpen)}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "5px 10px 5px 5px",
            border: "1px solid var(--border-color)", borderRadius: 10,
            background: "var(--bg-secondary)", cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-tertiary)"; e.currentTarget.style.borderColor = "var(--teal-500)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "var(--bg-secondary)"; e.currentTarget.style.borderColor = "var(--border-color)"; }}
        >
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "linear-gradient(135deg, #14b8a6, #6366f1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontWeight: 700, fontSize: 12,
          }}>
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", maxWidth: 80, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
            {user?.name?.split(" ")[0] || "User"}
          </span>
          <motion.div animate={{ rotate: profileOpen ? 180 : 0 }} transition={{ duration: 0.15 }}>
            <ChevronDown size={13} style={{ color: "var(--text-muted)" }} />
          </motion.div>
        </motion.button>

        <AnimatePresence>
          {profileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              style={{
                position: "absolute", right: 0, top: "calc(100% + 8px)",
                width: 210, borderRadius: 12,
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
                boxShadow: "var(--shadow-xl)",
                zIndex: 200, overflow: "hidden", padding: 6,
              }}
            >
              <div style={{ padding: "10px 12px", borderRadius: 8, marginBottom: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{user?.name || "User"}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{user?.email || ""}</div>
              </div>
              <div style={{ height: 1, background: "var(--border-color)", margin: "4px 0" }} />
              {[
                { icon: User, label: "Profile", action: () => navigate("/skin-profile") },
                { icon: Settings, label: "Settings", action: () => navigate("/settings") },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={() => { item.action(); setProfileOpen(false); }}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 12px", borderRadius: 8, border: "none",
                    background: "none", cursor: "pointer", fontSize: 13, fontWeight: 500,
                    color: "var(--text-secondary)", transition: "all 0.12s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-tertiary)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                >
                  <item.icon size={14} />
                  {item.label}
                </button>
              ))}
              <div style={{ height: 1, background: "var(--border-color)", margin: "4px 0" }} />
              <button
                onClick={() => { logout(); navigate("/login"); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 12px", borderRadius: 8, border: "none",
                  background: "none", cursor: "pointer", fontSize: 13, fontWeight: 500,
                  color: "#ef4444", transition: "all 0.12s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}
              >
                <LogOut size={14} />
                Sign out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
