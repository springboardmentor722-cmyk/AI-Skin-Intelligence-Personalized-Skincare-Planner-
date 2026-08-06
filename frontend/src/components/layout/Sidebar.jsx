import { useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/Authcontext";
import {
  LayoutDashboard, User, Heart, ScanFace, CalendarCheck,
  ShoppingBag, Beaker, TrendingUp, BarChart3, Stethoscope,
  UserCheck, ShieldAlert, Settings, LogOut, Sparkles,
  ChevronLeft, ChevronRight, X, Layers, FileText, Bell, CheckSquare
} from "lucide-react";

const NAV_SECTIONS = [
  {
    label: "Workspace",
    items: [
      { title: "Dashboard", icon: LayoutDashboard, path: "/dashboard", roles: ["user", "consultant", "dermatologist", "admin"] },
      { title: "Consultant Workspace", icon: UserCheck, path: "/consultant-dashboard", roles: ["consultant"] },
      { title: "Doctor Workspace", icon: Stethoscope, path: "/dermatologist-dashboard", roles: ["dermatologist"] },
      { title: "Admin Portal", icon: ShieldAlert, path: "/admin-dashboard", roles: ["admin"] },
    ],
  },
  {
    label: "Skincare Intelligence",
    items: [
      { title: "AI Assessment", icon: ScanFace, path: "/skin-assessment", roles: ["user", "admin"] },
      { title: "AI Image Scanner", icon: ScanFace, path: "/image-analysis", roles: ["user", "admin"] },
      { title: "My Routine", icon: CalendarCheck, path: "/routine", roles: ["user", "admin"] },
      { title: "Daily Checklist", icon: CheckSquare, path: "/lifestyle", roles: ["user", "admin"] },
      { title: "Products Engine", icon: ShoppingBag, path: "/product-recommendation", roles: ["user", "admin"] },
      { title: "Ingredient Intelligence", icon: Beaker, path: "/ingredients", roles: ["user", "admin"] },
      { title: "Progress Tracker", icon: TrendingUp, path: "/progress", roles: ["user", "admin"] },
      { title: "Before & After", icon: Layers, path: "/before-after", roles: ["user", "consultant", "dermatologist", "admin"] },
      { title: "Analytics", icon: BarChart3, path: "/analytics", roles: ["user", "consultant", "dermatologist", "admin"] },
      { title: "Clinical Reports", icon: FileText, path: "/reports", roles: ["user", "consultant", "dermatologist", "admin"] },
      { title: "Skin Journal", icon: Heart, path: "/analysis-history", roles: ["user", "consultant", "dermatologist", "admin"] },
    ],
  },
  {
    label: "Account & Community",
    items: [
      { title: "Profile", icon: User, path: "/profile", roles: ["user", "consultant", "dermatologist", "admin"] },
      { title: "Notifications", icon: Bell, path: "/notifications", roles: ["user", "consultant", "dermatologist", "admin"] },
      { title: "Consultants", icon: UserCheck, path: "/consultants", roles: ["user", "admin"] },
      { title: "Dermatologists", icon: Stethoscope, path: "/dermatologists", roles: ["user", "admin"] },
    ],
  },
];

const ROLE_CONFIG = {
  user: { label: "Patient / User", color: "#18C8C8", bg: "rgba(24,200,200,0.15)" },
  consultant: { label: "Consultant", color: "#8B5CF6", bg: "rgba(139,92,246,0.15)" },
  dermatologist: { label: "Dermatologist", color: "#10B981", bg: "rgba(16,185,129,0.15)" },
  admin: { label: "Platform Admin", color: "#F59E0B", bg: "rgba(245,158,11,0.15)" },
};

function NavItem({ item, isActive, onClick, collapsed }) {
  const Icon = item.icon;
  return (
    <div style={{ position: "relative", margin: "2px 8px" }}>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => onClick(item)}
        title={collapsed ? item.title : undefined}
        style={{
          display: "flex",
          alignItems: "center",
          gap: collapsed ? 0 : 12,
          padding: collapsed ? "10px 0" : "10px 14px",
          justifyContent: collapsed ? "center" : "flex-start",
          borderRadius: 12,
          fontSize: 14,
          fontWeight: isActive ? 600 : 500,
          color: isActive ? "#ffffff" : "var(--sidebar-text, rgba(255,255,255,0.7))",
          cursor: "pointer",
          border: "none",
          background: isActive ? "linear-gradient(135deg, rgba(24,200,200,0.25) 0%, rgba(91,109,255,0.2) 100%)" : "transparent",
          width: "100%",
          textAlign: "left",
          transition: "all 0.2s ease",
          position: "relative",
          overflow: "hidden",
        }}
        onMouseEnter={e => {
          if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.06)";
          e.currentTarget.style.color = "#ffffff";
        }}
        onMouseLeave={e => {
          if (!isActive) e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = isActive ? "#ffffff" : "var(--sidebar-text, rgba(255,255,255,0.7))";
        }}
      >
        {isActive && (
          <motion.div
            layoutId="active-indicator"
            style={{
              position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
              width: 4, height: 22, borderRadius: 2,
              background: "linear-gradient(180deg, #18C8C8, #5B6DFF)",
            }}
          />
        )}
        <Icon
          size={18}
          style={{
            flexShrink: 0,
            color: isActive ? "#18C8C8" : "inherit",
            marginLeft: isActive && !collapsed ? 4 : 0,
          }}
        />
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: "hidden", whiteSpace: "nowrap" }}
            >
              {item.title}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}

export default function Sidebar({ isOpen, onClose, collapsed, onCollapse }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate("/login"); };
  const handleNavClick = (item) => { if (onClose) onClose(); navigate(item.path); };

  const userRole = user?.role || "user";
  const roleConf = ROLE_CONFIG[userRole] || ROLE_CONFIG.user;

  const isItemVisible = (item) => !item.roles || item.roles.includes(userRole);

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 99, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
            className="lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 80 : 260 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: "fixed", top: 0, left: 0, height: "100vh",
          background: "linear-gradient(180deg, #0F172A 0%, #0B0F17 100%)",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          zIndex: 100, display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}
        className={isOpen ? "open" : ""}
      >
        {/* Logo Area */}
        <div style={{
          padding: collapsed ? "20px 0" : "20px 18px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex", alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: collapsed ? 0 : 12, cursor: "pointer" }} onClick={() => navigate("/dashboard")}>
            <div style={{
              width: 38, height: 38, borderRadius: 12, flexShrink: 0,
              background: "linear-gradient(135deg, #18C8C8, #5B6DFF, #8B5CF6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 6px 16px rgba(24,200,200,0.35)",
            }}>
              <Sparkles size={20} color="white" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.18 }}
                >
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.1 }}>Skin Intel</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>Enterprise SaaS</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {!collapsed && (
            <button onClick={onClose} className="lg:hidden" style={{
              width: 28, height: 28, borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)",
              background: "none", cursor: "pointer", color: "white",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* User Badge */}
        <div style={{
          padding: collapsed ? "14px 8px" : "14px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.08)", flexShrink: 0,
        }}>
          <div style={{
            background: "rgba(255,255,255,0.04)", borderRadius: 14,
            padding: collapsed ? "8px" : "12px 12px",
            display: "flex", alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: collapsed ? 0 : 12,
            border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
              background: `linear-gradient(135deg, ${roleConf.color}, #5B6DFF)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontWeight: 700, fontSize: 14,
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
            }}>
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                  style={{ flex: 1, minWidth: 0 }}
                >
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#f8fafc", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                    {user?.name || "User"}
                  </div>
                  <div style={{
                    display: "inline-flex", alignItems: "center", marginTop: 3,
                    fontSize: 11, fontWeight: 600, color: roleConf.color,
                    background: roleConf.bg, padding: "2px 8px", borderRadius: 20,
                  }}>
                    {roleConf.label}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden", paddingBottom: 12, paddingTop: 8 }}>
          {NAV_SECTIONS.map((section) => {
            const visibleItems = section.items.filter(isItemVisible);
            if (visibleItems.length === 0) return null;
            return (
              <div key={section.label} style={{ marginBottom: 8 }}>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                      style={{
                        fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                        letterSpacing: "0.08em", color: "rgba(255,255,255,0.4)",
                        padding: "12px 20px 6px",
                      }}
                    >
                      {section.label}
                    </motion.div>
                  )}
                </AnimatePresence>
                {visibleItems.map((item) => {
                  const isActive = location.pathname === item.path ||
                    (item.path !== "/dashboard" && location.pathname.startsWith(item.path));
                  return (
                    <NavItem
                      key={item.path}
                      item={item}
                      isActive={isActive}
                      onClick={handleNavClick}
                      collapsed={collapsed}
                    />
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", padding: "10px" }}>
          <button
            onClick={() => { navigate("/settings"); if (onClose) onClose(); }}
            title={collapsed ? "Settings" : undefined}
            style={{
              display: "flex", alignItems: "center", gap: collapsed ? 0 : 12,
              padding: collapsed ? "10px 0" : "10px 14px",
              justifyContent: collapsed ? "center" : "flex-start",
              borderRadius: 12, fontSize: 14, fontWeight: 500,
              color: "rgba(255,255,255,0.7)", cursor: "pointer",
              border: "none", background: "none", width: "100%",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
          >
            <Settings size={18} style={{ flexShrink: 0 }} />
            {!collapsed && <span>Settings</span>}
          </button>

          <button
            onClick={handleLogout}
            title={collapsed ? "Sign Out" : undefined}
            style={{
              display: "flex", alignItems: "center", gap: collapsed ? 0 : 12,
              padding: collapsed ? "10px 0" : "10px 14px",
              justifyContent: collapsed ? "center" : "flex-start",
              borderRadius: 12, fontSize: 14, fontWeight: 500,
              color: "#EF4444", cursor: "pointer",
              border: "none", background: "none", width: "100%",
              transition: "all 0.2s ease", marginTop: 2,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
          >
            <LogOut size={18} style={{ flexShrink: 0 }} />
            {!collapsed && <span>Sign out</span>}
          </button>

          {/* Desktop collapse toggle */}
          <div className="lg:block hidden" style={{ marginTop: 6, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 8 }}>
            <button
              onClick={onCollapse}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              style={{
                display: "flex", alignItems: "center", gap: collapsed ? 0 : 10,
                padding: collapsed ? "8px 0" : "8px 14px",
                justifyContent: collapsed ? "center" : "flex-start",
                borderRadius: 10, fontSize: 13, fontWeight: 500,
                color: "rgba(255,255,255,0.4)", cursor: "pointer",
                border: "none", background: "none", width: "100%",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = "rgba(255,255,255,0.8)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.4)"; e.currentTarget.style.background = "none"; }}
            >
              {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Collapse</span></>}
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
