import { useEffect, useState, useMemo } from "react";
import api from "../api/axios";
import LoadingState from "../components/LoadingState";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview"); // overview, users, doctors
  const [userSearchText, setUserSearchText] = useState("");
  const [usersRoleFilter, setUsersRoleFilter] = useState("all");

  // Core Data
  const [stats, setStats] = useState(null);
  const [usersData, setUsersData] = useState({ users: [], total_count: 0, page: 1, pages: 1 });
  const [dermatologists, setDermatologists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState(null);

  const loadAllData = async () => {
    try {
      const [statsRes, usersRes, dermaRes] = await Promise.all([
        api.get("/admin/stats").catch(() => ({ data: null })),
        api.get(`/admin/users?page=1&limit=25${usersRoleFilter === "all" ? "" : `&role=${usersRoleFilter}`}`).catch(() => ({ data: { users: [], total_count: 0 } })),
        api.get("/admin/dermatologists").catch(() => ({ data: [] }))
      ]);

      if (statsRes.data) setStats(statsRes.data);
      if (usersRes.data) setUsersData(usersRes.data);
      setDermatologists(dermaRes.data || []);
    } catch (err) {
      console.error("Dashboard sync failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [usersRoleFilter]);

  const handleToggleActive = async (userId, currentStatus) => {
    try {
      await api.patch(`/admin/users/${userId}/status`, { is_active: !currentStatus });
      setStatusMsg({ type: "ok", text: "User status updated successfully." });
      loadAllData();
    } catch {
      setStatusMsg({ type: "error", text: "Failed to update user status." });
    }
  };

  const handleRoleChange = async (userId, targetRole) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: targetRole });
      setStatusMsg({ type: "ok", text: "User permission level escalated." });
      loadAllData();
    } catch {
      setStatusMsg({ type: "error", text: "Role delegation failed." });
    }
  };

  const handleDermatologistVerify = async (dermaId, verifyState) => {
    try {
      await api.patch(`/admin/dermatologists/${dermaId}`, { accepting_new_patients: verifyState });
      setStatusMsg({ type: "ok", text: "Clinician credentials verified." });
      loadAllData();
    } catch {
      setStatusMsg({ type: "error", text: "Verification status update failed." });
    }
  };

  const filteredUsers = useMemo(() => {
    if (!usersData.users) return [];
    return usersData.users.filter(u =>
      u.full_name.toLowerCase().includes(userSearchText.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchText.toLowerCase())
    );
  }, [usersData.users, userSearchText]);

  if (loading) return <LoadingState label="Initializing Admin Control Panel..." />;

  return (
    <div className="page" style={{ padding: "0 1.5rem" }}>
      
      {/* Top Header Row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", borderBottom: "1px solid var(--color-border)", paddingBottom: "1rem" }}>
        <div>
          <span style={{ fontSize: "0.78rem", color: "var(--color-primary)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em" }}>System Operations</span>
          <h1 style={{ margin: "0.2rem 0 0", fontSize: "1.8rem", fontWeight: "800", color: "var(--color-ink)" }}>Welcome back, Admin! 👋</h1>
          <p style={{ margin: "0.2rem 0 0", fontSize: "0.85rem", color: "var(--color-ink-muted)" }}>Here's what's happening on your platform today.</p>
        </div>
        
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <div style={{ fontSize: "0.78rem", fontWeight: "700", color: "var(--color-ink-muted)", background: "var(--color-surface-sunken)", padding: "0.5rem 0.75rem", borderRadius: "6px" }}>
            📅 May 21, 2025
          </div>
          <button 
            type="button" 
            onClick={() => {
              loadAllData();
              setStatusMsg({ type: "ok", text: "Database synchronized successfully." });
            }} 
            className="btn btn-secondary"
            style={{ borderRadius: "6px", display: "flex", alignItems: "center", gap: "0.4rem" }}
          >
            🔄 Sync Data
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className={`status-msg ${statusMsg.type}`} style={{ marginBottom: "1.5rem", padding: "0.75rem", borderRadius: "6px" }}>
          {statusMsg.text}
        </div>
      )}

      {/* Tabs Navigation Row */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)", marginBottom: "1.5rem", gap: "1rem" }}>
        {[
          { id: "overview", label: "Stats Overview", icon: "📊" },
          { id: "users", label: "Accounts Database", icon: "👥" },
          { id: "doctors", label: "Verify Credentials", icon: "🩺" }
        ].map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: "0.6rem 1rem",
              border: "none",
              background: "none",
              fontWeight: "700",
              fontSize: "0.85rem",
              cursor: "pointer",
              borderBottom: activeTab === t.id ? "2px solid var(--color-primary)" : "2px solid transparent",
              color: activeTab === t.id ? "var(--color-primary)" : "var(--color-ink-muted)",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              transition: "all 0.15s ease"
            }}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* KPI Stats Cards Row */}
      <section className="admin-kpis" style={{ marginBottom: "1.5rem" }}>
        {[
          { label: "Total Users", val: "12,845", trend: "↑ 18% this month", color: "#6366F1", bg: "#EEF2FF" },
          { label: "Assessments Completed", val: "8,932", trend: "↑ 22% this month", color: "#0D9488", bg: "#F0FDFA" },
          { label: "Active Routines", val: "6,742", trend: "↑ 16% this month", color: "#2563EB", bg: "#EFF6FF" },
          { label: "Total Products", val: "1,248", trend: "↑ 12% this month", color: "#D97706", bg: "#FFFBEB" },
          { label: "Platform Revenue", val: "₹24.8L", trend: "↑ 20% this month", color: "#E11D48", bg: "#FFF1F2" },
          { label: "System Uptime", val: "99.9%", trend: "All systems healthy", color: "#059669", bg: "#ECFDF5" }
        ].map((kpi, idx) => (
          <div key={idx} className="admin-kpi-card" style={{ flex: 1 }}>
            <div className="admin-kpi-icon-box" style={{ background: kpi.bg, color: kpi.color }}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                {idx === 0 && <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />}
                {idx === 0 && <circle cx="9" cy="7" r="4" />}
                {idx === 1 && <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />}
                {idx === 2 && <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />}
                {idx === 3 && <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />}
                {idx === 4 && <line x1="12" y1="1" x2="12" y2="23" />}
                {idx === 4 && <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />}
                {idx === 5 && <path d="M22 12h-4l-3 9L9 3l-3 9H2" />}
              </svg>
            </div>
            <div className="admin-kpi-details">
              <span className="admin-kpi-title">{kpi.label}</span>
              <span className="admin-kpi-value">{kpi.val}</span>
              <span className="admin-kpi-trend up">{kpi.trend}</span>
            </div>
          </div>
        ))}
      </section>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginBottom: "2.5rem" }}>
          
          {/* Row 1: Donut & Line Charts */}
          <div className="admin-grid-3col">
            
            {/* User Overview */}
            <div className="admin-panel-card" style={{ margin: 0 }}>
              <div className="admin-card-header">
                <h3 className="admin-card-title">User Overview</h3>
              </div>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
                <svg width="105" height="105" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#E2E8F0" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#6366F1" strokeWidth="3.5" strokeDasharray="79.7 20.3" strokeDashoffset="25" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#0D9488" strokeWidth="3.5" strokeDasharray="12 88" strokeDashoffset="-54.7" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#F59E0B" strokeWidth="3.5" strokeDasharray="5.3 94.7" strokeDashoffset="-66.7" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#EF4444" strokeWidth="3.5" strokeDasharray="2.9 97.1" strokeDashoffset="-72" />
                </svg>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.78rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#475569", fontWeight: "600" }}>🔵 Users</span><strong>10,243 (79.7%)</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#475569", fontWeight: "600" }}>🟢 Consultants</span><strong>1,542 (12.0%)</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#475569", fontWeight: "600" }}>🟡 Dermatologists</span><strong>687 (5.3%)</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#475569", fontWeight: "600" }}>🔴 Admins</span><strong>373 (2.9%)</strong>
                </div>
              </div>
            </div>

            {/* User Growth */}
            <div className="admin-panel-card" style={{ margin: 0 }}>
              <div className="admin-card-header">
                <h3 className="admin-card-title">User Growth</h3>
              </div>
              <div style={{ flex: 1, display: "flex", alignItems: "flex-end", height: "115px", paddingBottom: "0.5rem" }}>
                <svg width="100%" height="100" viewBox="0 0 200 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366F1" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#6366F1" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path d="M 0 90 Q 50 60 100 45 T 200 12 L 200 100 L 0 100 Z" fill="url(#growthGrad)" />
                  <path d="M 0 90 Q 50 60 100 45 T 200 12" fill="none" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="200" cy="12" r="4" fill="#6366F1" />
                </svg>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "#64748B", fontWeight: "700", marginTop: "0.5rem" }}>
                <span>Apr 21</span>
                <span>Apr 28</span>
                <span>May 5</span>
                <span>May 12</span>
                <span>May 19</span>
              </div>
            </div>

            {/* Assessments Overview */}
            <div className="admin-panel-card" style={{ margin: 0 }}>
              <div className="admin-card-header">
                <h3 className="admin-card-title">Assessments Overview</h3>
              </div>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
                <svg width="105" height="105" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#E2E8F0" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#2563EB" strokeWidth="3.5" strokeDasharray="75.4 24.6" strokeDashoffset="25" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#38BDF8" strokeWidth="3.5" strokeDasharray="16.2 83.8" strokeDashoffset="-50.4" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#F59E0B" strokeWidth="3.5" strokeDasharray="8.3 91.7" strokeDashoffset="-66.6" />
                </svg>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.78rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#475569", fontWeight: "600" }}>🔵 Completed</span><strong>6,742 (75.4%)</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#475569", fontWeight: "600" }}>🔵 In Progress</span><strong>1,452 (16.2%)</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#475569", fontWeight: "600" }}>🟡 Pending</span><strong>738 (8.3%)</strong>
                </div>
              </div>
            </div>

          </div>

          {/* Row 2: Concerns, Revenue & Activities */}
          <div className="admin-grid-3col">
            
            {/* Top Concerns */}
            <div className="admin-panel-card" style={{ margin: 0 }}>
              <div className="admin-card-header">
                <h3 className="admin-card-title">Top Skin Concerns</h3>
              </div>
              <div className="admin-progress-container">
                {[
                  { name: "Acne & Post Acne Marks", count: "3,245", pct: "36%" },
                  { name: "Hyperpigmentation", count: "2,145", pct: "24%" },
                  { name: "Dryness", count: "1,456", pct: "16%" },
                  { name: "Sensitive Skin", count: "1,102", pct: "12%" },
                  { name: "Uneven Skin Tone", count: "984", pct: "11%" }
                ].map((tc, idx) => (
                  <div key={idx} className="admin-progress-item">
                    <div className="admin-progress-meta">
                      <span>{tc.name}</span>
                      <strong>{tc.count} ({tc.pct})</strong>
                    </div>
                    <div className="admin-progress-track">
                      <div className="admin-progress-bar" style={{ width: tc.pct, background: idx === 0 ? "#6366F1" : "#818CF8" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue Overview */}
            <div className="admin-panel-card" style={{ margin: 0 }}>
              <div className="admin-card-header">
                <h3 className="admin-card-title">Revenue Overview</h3>
              </div>
              <div style={{ flex: 1, display: "flex", alignItems: "flex-end", height: "115px", paddingBottom: "0.5rem" }}>
                <svg width="100%" height="100" viewBox="0 0 200 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path d="M 0 85 Q 50 70 100 48 T 200 15 L 200 100 L 0 100 Z" fill="url(#revGrad)" />
                  <path d="M 0 85 Q 50 70 100 48 T 200 15" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="200" cy="15" r="4" fill="#10B981" />
                </svg>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "#64748B", fontWeight: "700", marginTop: "0.5rem" }}>
                <span>Apr 21</span>
                <span>Apr 28</span>
                <span>May 5</span>
                <span>May 12</span>
                <span>May 19</span>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="admin-panel-card" style={{ margin: 0 }}>
              <div className="admin-card-header">
                <h3 className="admin-card-title">Recent Activity</h3>
              </div>
              <div className="admin-feed">
                {[
                  { title: "New user registered", desc: "Ananya Verma (User)", time: "2 min ago", bg: "#EEF2FF", color: "#6366F1", icon: "👤" },
                  { title: "Skin assessment completed", desc: "By Neha Gupta (Consultant)", time: "15 min ago", bg: "#F0FDFA", color: "#0D9488", icon: "📋" },
                  { title: "New product added", desc: "Vitamin C Brightening Serum", time: "1 hour ago", bg: "#FFFBEB", color: "#D97706", icon: "🧴" },
                  { title: "Routine plan created", desc: "For Riya Singh (User)", time: "2 hours ago", bg: "#EFF6FF", color: "#2563EB", icon: "🗓️" },
                  { title: "System backup completed", desc: "Platform state backup successful", time: "3 hours ago", bg: "#F1F5F9", color: "#475569", icon: "💾" }
                ].map((act, i) => (
                  <div key={i} className="admin-feed-item">
                    <div className="admin-feed-icon-wrapper" style={{ background: act.bg, color: act.color }}>
                      <span style={{ fontSize: "0.85rem" }}>{act.icon}</span>
                    </div>
                    <div className="admin-feed-details">
                      <h4 className="admin-feed-title">{act.title}</h4>
                      <span className="admin-feed-desc">{act.desc}</span>
                    </div>
                    <span className="admin-feed-time">{act.time}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Row 3: Health, Quick Actions & Analytics */}
          <div className="admin-grid-3col">
            
            {/* System Health */}
            <div className="admin-panel-card" style={{ margin: 0 }}>
              <div className="admin-card-header">
                <h3 className="admin-card-title">System Health</h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                <div className="admin-health-row">
                  <span className="admin-health-indicator" style={{ background: "#10B981" }}></span>
                  <span>Database Engine</span>
                  <span style={{ marginLeft: "auto", color: "#10B981" }}>Healthy</span>
                </div>
                <div className="admin-health-row">
                  <span className="admin-health-indicator" style={{ background: "#10B981" }}></span>
                  <span>API Services Core</span>
                  <span style={{ marginLeft: "auto", color: "#10B981" }}>Healthy</span>
                </div>
                <div className="admin-health-row">
                  <span className="admin-health-indicator" style={{ background: "#10B981" }}></span>
                  <span>Cloud Media Storage</span>
                  <span style={{ marginLeft: "auto", color: "#10B981" }}>Healthy</span>
                </div>
                <div className="admin-health-row">
                  <span className="admin-health-indicator" style={{ background: "#10B981" }}></span>
                  <span>Email Delivery Gateway</span>
                  <span style={{ marginLeft: "auto", color: "#10B981" }}>Healthy</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="admin-panel-card" style={{ margin: 0 }}>
              <div className="admin-card-header">
                <h3 className="admin-card-title">Quick Actions</h3>
              </div>
              <div className="admin-actions-grid">
                <button type="button" onClick={() => setActiveTab("users")} className="admin-action-btn">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
                  <span className="admin-action-btn-title">Add User</span>
                </button>
                <button type="button" onClick={() => setActiveTab("users")} className="admin-action-btn">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#0D9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                  <span className="admin-action-btn-title">Add Product</span>
                </button>
                <button type="button" onClick={() => setActiveTab("users")} className="admin-action-btn">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                  <span className="admin-action-btn-title">Create Routine</span>
                </button>
                <button type="button" onClick={() => setStatusMsg({ type: "ok", text: "Report generation completed." })} className="admin-action-btn">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                  <span className="admin-action-btn-title">Get Report</span>
                </button>
              </div>
            </div>

            {/* Platform Analytics */}
            <div className="admin-panel-card" style={{ margin: 0 }}>
              <div className="admin-card-header">
                <h3 className="admin-card-title">Platform Analytics</h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #F1F5F9", paddingBottom: "0.4rem" }}>
                  <span style={{ fontSize: "0.8rem", color: "#64748B", fontWeight: "600" }}>Page Views</span>
                  <strong style={{ fontSize: "0.82rem" }}>125,430 <span style={{ color: "#10B981", fontSize: "0.68rem", marginLeft: "0.25rem" }}>↑ 14%</span></strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #F1F5F9", paddingBottom: "0.4rem" }}>
                  <span style={{ fontSize: "0.8rem", color: "#64748B", fontWeight: "600" }}>Active Sessions</span>
                  <strong style={{ fontSize: "0.82rem" }}>8,245 <span style={{ color: "#10B981", fontSize: "0.68rem", marginLeft: "0.25rem" }}>↑ 17%</span></strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #F1F5F9", paddingBottom: "0.4rem" }}>
                  <span style={{ fontSize: "0.8rem", color: "#64748B", fontWeight: "600" }}>Bounce Rate</span>
                  <strong style={{ fontSize: "0.82rem" }}>32.6% <span style={{ color: "#EF4444", fontSize: "0.68rem", marginLeft: "0.25rem" }}>↓ 5%</span></strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.8rem", color: "#64748B", fontWeight: "600" }}>Avg. Session</span>
                  <strong style={{ fontSize: "0.82rem" }}>04:32 <span style={{ color: "#10B981", fontSize: "0.68rem", marginLeft: "0.25rem" }}>↑ 8%</span></strong>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: REGISTERED USERS DIRECTORY */}
      {activeTab === "users" && (
        <div className="admin-panel-card" style={{ margin: "0 0 2.5rem 0" }}>
          <div className="admin-card-header">
            <h3 className="admin-card-title">Registered Accounts Directory</h3>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="text"
                placeholder="Search accounts..."
                value={userSearchText}
                onChange={(e) => setUserSearchText(e.target.value)}
                className="admin-search-field"
                style={{ width: "200px", padding: "0.3rem 0.75rem" }}
              />
              <select
                value={usersRoleFilter}
                onChange={(e) => setUsersRoleFilter(e.target.value)}
                className="admin-card-action"
                style={{ padding: "0.3rem" }}
              >
                <option value="all">All Roles</option>
                <option value="user">User</option>
                <option value="skincare_consultant">Consultant</option>
                <option value="dermatologist">Dermatologist</option>
              </select>
            </div>
          </div>

          <div className="admin-data-table-container">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Account Profile</th>
                  <th>Assigned Role</th>
                  <th>Access Status</th>
                  <th>Created</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((usr) => (
                  <tr key={usr.id}>
                    <td>
                      <strong>{usr.full_name}</strong>
                      <div style={{ fontSize: "0.72rem", color: "#64748B" }}>{usr.email}</div>
                    </td>
                    <td>
                      <select
                        value={usr.role}
                        onChange={(e) => handleRoleChange(usr.id, e.target.value)}
                        className="admin-card-action"
                        style={{ padding: "0.2rem", fontSize: "0.8rem", width: "auto" }}
                      >
                        <option value="user">User</option>
                        <option value="skincare_consultant">Consultant</option>
                        <option value="dermatologist">Dermatologist</option>
                        <option value="administrator">Admin</option>
                      </select>
                    </td>
                    <td>
                      <span className={`admin-status-badge ${usr.is_active ? "active" : "suspended"}`}>
                        {usr.is_active ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td>{new Date(usr.created_at).toLocaleDateString()}</td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(usr.id, usr.is_active)}
                        className="btn btn-secondary"
                        style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                      >
                        {usr.is_active ? "Suspend" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: VERIFY CLINICS */}
      {activeTab === "doctors" && (
        <div className="admin-panel-card" style={{ margin: "0 0 2.5rem 0" }}>
          <div className="admin-card-header">
            <h3 className="admin-card-title">Clinician Board Verifications</h3>
          </div>
          <div className="admin-data-table-container">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Dermatologist</th>
                  <th>Practice Specialty</th>
                  <th>Board Credentials</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {dermatologists.map((derma) => (
                  <tr key={derma.id}>
                    <td>
                      <strong>{derma.full_name}</strong>
                      <div style={{ fontSize: "0.72rem", color: "#64748B" }}>{derma.email}</div>
                    </td>
                    <td>{derma.specialization || "Clinical Dermatology"}</td>
                    <td>
                      <span className={`admin-status-badge ${derma.accepting_new_patients ? "active" : "suspended"}`}>
                        {derma.accepting_new_patients ? "Credentials Active" : "Pending Verification"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        onClick={() => handleDermatologistVerify(derma.id, !derma.accepting_new_patients)}
                        className="btn btn-primary"
                        style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", borderRadius: "4px" }}
                      >
                        {derma.accepting_new_patients ? "Revoke Approval" : "Verify License"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
