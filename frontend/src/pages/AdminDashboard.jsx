import { useEffect, useState, useMemo } from "react";
import api from "../api/axios";
import LoadingState from "../components/LoadingState";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  // Tabs Navigation
  const [activeTab, setActiveTab] = useState("overview"); // overview, users, doctors, products, settings
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval] = useState(5000);
  const [userSearchText, setUserSearchText] = useState("");
  const [usersRoleFilter, setUsersRoleFilter] = useState("all");

  // Core Data
  const [stats, setStats] = useState(null);
  const [usersData, setUsersData] = useState({ users: [], total_count: 0, page: 1, pages: 1 });
  const [dermatologists, setDermatologists] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState(null);

  // Settings
  const [platformName] = useState("SkinGenie Clinical");
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Mocked datasets directly matching the PDF mockup
  const kpis = [
    { label: "Total Users", val: "12,845", trend: "↑ 18% this month", color: "#10B981" },
    { label: "Assessments Completed", val: "8,932", trend: "↑ 22% this month", color: "#10B981" },
    { label: "Active Routines", val: "6,742", trend: "↑ 16% this month", color: "#10B981" },
    { label: "Total Products", val: "1,248", trend: "↑ 12% this month", color: "#10B981" },
    { label: "Platform Revenue", val: "₹24.8L", trend: "↑ 20% this month", color: "#10B981" },
    { label: "System Uptime", val: "99.9%", trend: "All systems healthy", color: "#10B981" }
  ];

  const recentActivities = [
    { title: "New user registered", detail: "Ananya Verma (User)", time: "2 min ago", icon: "👤", bg: "rgba(99, 102, 241, 0.1)", color: "#6366F1" },
    { title: "Skin assessment completed", detail: "By Neha Gupta (Consultant)", time: "15 min ago", icon: "📋", bg: "rgba(16, 185, 129, 0.1)", color: "#10B981" },
    { title: "New product added", detail: "Vitamin C Brightening Serum", time: "1 hour ago", icon: "🧴", bg: "rgba(245, 158, 11, 0.1)", color: "#F59E0B" },
    { title: "Routine plan created", detail: "For Riya Singh (User)", time: "2 hours ago", icon: "🗓️", bg: "rgba(59, 130, 246, 0.1)", color: "#3B82F6" },
    { title: "System backup completed", detail: "Daily backup completed successfully", time: "3 hours ago", icon: "⚙️", bg: "rgba(100, 116, 139, 0.1)", color: "#64748B" }
  ];

  const topConcerns = [
    { name: "Acne & Post Acne Marks", count: "3,245", pct: "36%" },
    { name: "Hyperpigmentation", count: "2,145", pct: "24%" },
    { name: "Dryness", count: "1,456", pct: "16%" },
    { name: "Sensitive Skin", count: "1,102", pct: "12%" },
    { name: "Uneven Skin Tone", count: "984", pct: "11%" }
  ];

  const loadAllData = async () => {
    try {
      const [statsRes, usersRes, dermaRes, prodRes] = await Promise.all([
        api.get("/admin/stats").catch(() => ({ data: null })),
        api.get(`/admin/users?page=1&limit=25${usersRoleFilter === "all" ? "" : `&role=${usersRoleFilter}`}`).catch(() => ({ data: { users: [], total_count: 0 } })),
        api.get("/admin/dermatologists").catch(() => ({ data: [] })),
        api.get("/admin/products").catch(() => ({ data: [] }))
      ]);

      if (statsRes.data) setStats(statsRes.data);
      if (usersRes.data) setUsersData(usersRes.data);
      setDermatologists(dermaRes.data);
      setProducts(prodRes.data);
    } catch (err) {
      console.error("Dashboard sync failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [usersRoleFilter]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadAllData();
    }, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleToggleActive = async (userId, currentStatus) => {
    try {
      await api.patch(`/admin/users/${userId}/status`, { is_active: !currentStatus });
      setStatusMsg({ type: "ok", text: "User status updated successfully." });
      loadAllData();
    } catch {
      setStatusMsg({ type: "error", text: "Failed to update user active status." });
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
      setStatusMsg({ type: "ok", text: "Clinician board credentials approved and active." });
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

  if (loading) return <LoadingState label="Initializing Platform Control Cabin..." />;

  return (
    <div className="admin-shell">
      
      {/* Sidebar Navigation */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <div className="admin-sidebar-logo">✨</div>
          <div className="admin-sidebar-title">
            <span className="admin-sidebar-name">Skin Intelligence</span>
            <span className="admin-sidebar-sub">Admin Panel</span>
          </div>
        </div>

        <div className="admin-sidebar-scroll">
          <div className="admin-menu-section">
            <div className="admin-menu-header">Main Menu</div>
            <button 
              onClick={() => setActiveTab("overview")} 
              className={`admin-menu-link ${activeTab === "overview" ? "active" : ""}`}
            >
              📊 Dashboard
            </button>
            <button 
              onClick={() => setActiveTab("users")} 
              className={`admin-menu-link ${activeTab === "users" ? "active" : ""}`}
            >
              👥 User Management
            </button>
            <button 
              onClick={() => setActiveTab("doctors")} 
              className={`admin-menu-link ${activeTab === "doctors" ? "active" : ""}`}
            >
              🩺 Role & Permissions
            </button>
            <button onClick={() => setActiveTab("overview")} className="admin-menu-link">📋 Skin Assessments</button>
            <button onClick={() => setActiveTab("overview")} className="admin-menu-link">🔄 Routine Management</button>
            <button onClick={() => setActiveTab("overview")} className="admin-menu-link">🧴 Product Management</button>
            <button onClick={() => setActiveTab("overview")} className="admin-menu-link">🔬 Ingredient Database</button>
            <button onClick={() => setActiveTab("overview")} className="admin-menu-link">📄 Content Management</button>
            <button onClick={() => setActiveTab("overview")} className="admin-menu-link">📈 Reports & Analytics</button>
            <button onClick={() => setActiveTab("overview")} className="admin-menu-link">🔔 Notifications</button>
            <button 
              onClick={() => setActiveTab("settings")} 
              className={`admin-menu-link ${activeTab === "settings" ? "active" : ""}`}
            >
              ⚙️ System Settings
            </button>
          </div>

          <div className="admin-menu-section">
            <div className="admin-menu-header">System & Security</div>
            <button className="admin-menu-link">🔒 Audit Logs</button>
            <button className="admin-menu-link">🛡️ Security & Access</button>
            <button className="admin-menu-link">💾 Backup & Restore</button>
          </div>
        </div>

        <div className="admin-sidebar-status">
          <div className="admin-status-indicator">
            <span className="admin-status-dot"></span>
            All systems operational
          </div>
          <div style={{ color: "#94A3B8", fontSize: "0.68rem", marginTop: "0.25rem", fontWeight: "600" }}>Uptime: 99.9%</div>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="admin-main-panel">
        
        {/* Header Bar */}
        <header className="admin-top-bar">
          <div className="admin-top-search">
            <span className="admin-search-icon">🔍</span>
            <input 
              type="text" 
              placeholder="Search users, reports, assessments..." 
              className="admin-search-input" 
            />
          </div>

          <div className="admin-top-meta">
            <button className="admin-meta-btn">🔔<span className="admin-meta-badge"></span></button>
            <div className="admin-meta-date">📅 May 21, 2025</div>
            <div className="admin-meta-user">
              <div className="admin-user-avatar">A</div>
              <div className="admin-user-info">
                <span className="admin-user-fullname">Admin User</span>
                <span className="admin-user-role">Super Administrator</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="admin-body">
          
          <div className="admin-welcome-row">
            <div>
              <h1 className="admin-welcome-title">Welcome back, Admin! 👋</h1>
              <p className="admin-welcome-desc">Here's what's happening on your platform today.</p>
            </div>
            <button 
              type="button" 
              onClick={() => {
                loadAllData();
                setStatusMsg({ type: "ok", text: "Database synchronized successfully." });
              }} 
              className="btn btn-secondary"
            >
              🔄 Refresh Workspace
            </button>
          </div>

          {statusMsg && (
            <div className={`status-msg ${statusMsg.type}`} style={{ padding: "0.75rem", borderRadius: "6px" }}>
              {statusMsg.text}
            </div>
          )}

          {/* KPI Dashboard cards */}
          <section className="admin-kpis-grid">
            {kpis.map((kpi, idx) => (
              <div key={idx} className="admin-kpi-card">
                <div className="admin-kpi-head">
                  <span className="admin-kpi-label">{kpi.label}</span>
                  <span className="admin-kpi-indicator up">{kpi.trend}</span>
                </div>
                <div className="admin-kpi-value">{kpi.val}</div>
                <div className="admin-kpi-sub">Compared to last month</div>
              </div>
            ))}
          </section>

          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              
              {/* Row 1: Charts (Overview & User Growth) */}
              <div className="admin-vis-row-1">
                
                {/* User Overview Pie Chart */}
                <div className="admin-vis-card">
                  <h3 className="admin-vis-card-title">
                    User Overview
                    <select className="admin-vis-card-select">
                      <option>This Month</option>
                    </select>
                  </h3>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
                    <svg width="150" height="150" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#E2E8F0" strokeWidth="3" />
                      {/* Users: 79.7% */}
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#6366F1" strokeWidth="3.2" strokeDasharray="79.7 20.3" strokeDashoffset="25" />
                      {/* Consultants: 12% */}
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10B981" strokeWidth="3.2" strokeDasharray="12 88" strokeDashoffset="-54.7" />
                      {/* Dermatologists: 5.3% */}
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#F59E0B" strokeWidth="3.2" strokeDasharray="5.3 94.7" strokeDashoffset="-66.7" />
                      {/* Admins: 2.9% */}
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#EC4899" strokeWidth="3.2" strokeDasharray="2.9 97.1" strokeDashoffset="-72" />
                    </svg>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.78rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>🔵 Users</span><strong>10,243 (79.7%)</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>🟢 Consultants</span><strong>1,542 (12.0%)</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>🟡 Dermatologists</span><strong>687 (5.3%)</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>🔴 Admins</span><strong>373 (2.9%)</strong>
                    </div>
                  </div>
                </div>

                {/* User Growth Line Chart */}
                <div className="admin-vis-card">
                  <h3 className="admin-vis-card-title">
                    User Growth
                    <select className="admin-vis-card-select">
                      <option>This Month</option>
                    </select>
                  </h3>
                  <div style={{ flex: 1, display: "flex", alignItems: "flex-end", height: "140px", paddingBottom: "0.5rem" }}>
                    <svg width="100%" height="110" viewBox="0 0 200 100" preserveAspectRatio="none">
                      <path d="M 0 90 Q 50 60 100 40 T 200 10" fill="none" stroke="#6366F1" strokeWidth="2.5" />
                      <circle cx="200" cy="10" r="4" fill="#6366F1" />
                    </svg>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "#64748B", fontWeight: "700" }}>
                    <span>Apr 21</span>
                    <span>Apr 28</span>
                    <span>May 5</span>
                    <span>May 12</span>
                    <span>May 19</span>
                  </div>
                </div>

                {/* Assessments Overview */}
                <div className="admin-vis-card">
                  <h3 className="admin-vis-card-title">
                    Assessments Overview
                    <select className="admin-vis-card-select">
                      <option>This Month</option>
                    </select>
                  </h3>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
                    <svg width="150" height="150" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#E2E8F0" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#6366F1" strokeWidth="3.2" strokeDasharray="75.4 24.6" strokeDashoffset="25" />
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#3B82F6" strokeWidth="3.2" strokeDasharray="16.2 83.8" strokeDashoffset="-50.4" />
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#F59E0B" strokeWidth="3.2" strokeDasharray="8.3 91.7" strokeDashoffset="-66.6" />
                    </svg>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.78rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>🔵 Completed</span><strong>6,742 (75.4%)</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>🔵 In Progress</span><strong>1,452 (16.2%)</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>🟡 Pending</span><strong>738 (8.3%)</strong>
                    </div>
                  </div>
                </div>

              </div>

              {/* Row 2: Concerns, Revenue & Activity */}
              <div className="admin-vis-row-2">
                
                {/* Top Concerns */}
                <div className="admin-vis-card">
                  <h3 className="admin-vis-card-title">
                    Top Skin Concerns
                    <select className="admin-vis-card-select">
                      <option>This Month</option>
                    </select>
                  </h3>
                  <div className="admin-concern-bar-row">
                    {topConcerns.map((tc, idx) => (
                      <div key={idx} className="admin-concern-bar-item">
                        <div className="admin-concern-bar-meta">
                          <span>{tc.name}</span>
                          <strong>{tc.count} ({tc.pct})</strong>
                        </div>
                        <div className="admin-concern-bar-bg">
                          <div className="admin-concern-bar-fill" style={{ width: tc.pct, background: idx === 0 ? "#6366F1" : "#818CF8" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Revenue Overview */}
                <div className="admin-vis-card">
                  <h3 className="admin-vis-card-title">
                    Revenue Overview
                    <select className="admin-vis-card-select">
                      <option>This Month</option>
                    </select>
                  </h3>
                  <div style={{ flex: 1, display: "flex", alignItems: "flex-end", height: "140px", paddingBottom: "0.5rem" }}>
                    <svg width="100%" height="110" viewBox="0 0 200 100" preserveAspectRatio="none">
                      <path d="M 0 85 Q 50 70 100 45 T 200 15" fill="none" stroke="#10B981" strokeWidth="2.5" />
                      <circle cx="200" cy="15" r="4" fill="#10B981" />
                    </svg>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "#64748B", fontWeight: "700" }}>
                    <span>Apr 21</span>
                    <span>Apr 28</span>
                    <span>May 5</span>
                    <span>May 12</span>
                    <span>May 19</span>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="admin-vis-card">
                  <h3 className="admin-vis-card-title">Recent Activity</h3>
                  <div className="admin-activity-list">
                    {recentActivities.map((act, i) => (
                      <div key={i} className="admin-activity-item">
                        <div className="admin-activity-icon-box" style={{ background: act.bg, color: act.color }}>
                          {act.icon}
                        </div>
                        <div className="admin-activity-info">
                          <h4 className="admin-activity-title">{act.title}</h4>
                          <span className="admin-activity-meta">{act.detail}</span>
                        </div>
                        <span className="admin-activity-time">{act.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Row 3: Health, Quick Actions & Platform Analytics */}
              <div className="admin-vis-row-3">
                
                {/* System Health */}
                <div className="admin-vis-card">
                  <h3 className="admin-vis-card-title">System Health</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                    <div className="admin-health-row">
                      <span className="admin-health-dot" style={{ background: "#10B981" }}></span>
                      <span>Database Connection</span>
                      <span style={{ marginLeft: "auto", color: "#10B981" }}>Healthy</span>
                    </div>
                    <div className="admin-health-row">
                      <span className="admin-health-dot" style={{ background: "#10B981" }}></span>
                      <span>API Endpoints Gateway</span>
                      <span style={{ marginLeft: "auto", color: "#10B981" }}>Healthy</span>
                    </div>
                    <div className="admin-health-row">
                      <span className="admin-health-dot" style={{ background: "#10B981" }}></span>
                      <span>Storage Cloud Roster</span>
                      <span style={{ marginLeft: "auto", color: "#10B981" }}>Healthy</span>
                    </div>
                    <div className="admin-health-row">
                      <span className="admin-health-dot" style={{ background: "#10B981" }}></span>
                      <span>Email Delivery Daemon</span>
                      <span style={{ marginLeft: "auto", color: "#10B981" }}>Healthy</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="admin-vis-card">
                  <h3 className="admin-vis-card-title">Quick Actions</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", flex: 1 }}>
                    <button type="button" onClick={() => setActiveTab("users")} className="btn btn-secondary" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "1rem" }}>
                      <span style={{ fontSize: "1.5rem" }}>👤</span>
                      <span style={{ fontSize: "0.78rem", fontWeight: "700" }}>Add New User</span>
                    </button>
                    <button type="button" onClick={() => setActiveTab("users")} className="btn btn-secondary" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "1rem" }}>
                      <span style={{ fontSize: "1.5rem" }}>🧴</span>
                      <span style={{ fontSize: "0.78rem", fontWeight: "700" }}>Add Product</span>
                    </button>
                    <button type="button" onClick={() => setActiveTab("users")} className="btn btn-secondary" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "1rem" }}>
                      <span style={{ fontSize: "1.5rem" }}>📅</span>
                      <span style={{ fontSize: "0.78rem", fontWeight: "700" }}>Create Routine</span>
                    </button>
                    <button type="button" onClick={() => {
                      setStatusMsg({ type: "ok", text: "PDF Platform operations report created." });
                    }} className="btn btn-secondary" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "1rem" }}>
                      <span style={{ fontSize: "1.5rem" }}>📄</span>
                      <span style={{ fontSize: "0.78rem", fontWeight: "700" }}>Generate Report</span>
                    </button>
                  </div>
                </div>

                {/* Platform Analytics */}
                <div className="admin-vis-card">
                  <h3 className="admin-vis-card-title">Platform Analytics</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #F1F5F9", paddingBottom: "0.5rem" }}>
                      <span style={{ fontSize: "0.82rem", color: "#64748B", fontWeight: "600" }}>Page Views</span>
                      <strong style={{ fontSize: "0.85rem" }}>125,430 <span style={{ color: "#10B981", fontSize: "0.72rem" }}>↑ 14%</span></strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #F1F5F9", paddingBottom: "0.5rem" }}>
                      <span style={{ fontSize: "0.82rem", color: "#64748B", fontWeight: "600" }}>Active Sessions</span>
                      <strong style={{ fontSize: "0.85rem" }}>8,245 <span style={{ color: "#10B981", fontSize: "0.72rem" }}>↑ 17%</span></strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #F1F5F9", paddingBottom: "0.5rem" }}>
                      <span style={{ fontSize: "0.82rem", color: "#64748B", fontWeight: "600" }}>Bounce Rate</span>
                      <strong style={{ fontSize: "0.85rem" }}>32.6% <span style={{ color: "#EF4444", fontSize: "0.72rem" }}>↓ 5%</span></strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "0.82rem", color: "#64748B", fontWeight: "600" }}>Avg. Session</span>
                      <strong style={{ fontSize: "0.85rem" }}>04:32 <span style={{ color: "#10B981", fontSize: "0.72rem" }}>↑ 8%</span></strong>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: USERS */}
          {activeTab === "users" && (
            <div className="card" style={{ margin: 0, padding: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "800", margin: 0 }}>👥 Accounts Database</h3>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="text"
                    placeholder="Search name/email..."
                    value={userSearchText}
                    onChange={(e) => setUserSearchText(e.target.value)}
                    className="input"
                    style={{ padding: "0.3rem 0.6rem", fontSize: "0.85rem" }}
                  />
                  <select
                    value={usersRoleFilter}
                    onChange={(e) => setUsersRoleFilter(e.target.value)}
                    className="input"
                    style={{ padding: "0.3rem", fontSize: "0.85rem" }}
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
                      <th>Account Details</th>
                      <th>System Role</th>
                      <th>Status</th>
                      <th>Registered</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((usr) => (
                      <tr key={usr.id}>
                        <td>
                          <strong>{usr.full_name}</strong>
                          <div style={{ fontSize: "0.72rem", color: "var(--color-ink-muted)" }}>{usr.email}</div>
                        </td>
                        <td>
                          <select
                            value={usr.role}
                            onChange={(e) => handleRoleChange(usr.id, e.target.value)}
                            className="input"
                            style={{ padding: "0.2rem", fontSize: "0.8rem", width: "auto" }}
                          >
                            <option value="user">User</option>
                            <option value="skincare_consultant">Consultant</option>
                            <option value="dermatologist">Dermatologist</option>
                            <option value="administrator">Admin</option>
                          </select>
                        </td>
                        <td>
                          <span className={`status-pill ${usr.is_active ? "status-accepted" : "status-rejected"}`}>
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
            <div className="card" style={{ margin: 0, padding: "1.5rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "800", marginBottom: "1.25rem" }}>🩺 Clinic Credentials and verifications</h3>
              <div className="admin-data-table-container">
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th>Dermatologist</th>
                      <th>Specialization</th>
                      <th>Credentials Status</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dermatologists.map((derma) => (
                      <tr key={derma.id}>
                        <td>
                          <strong>{derma.full_name}</strong>
                          <div style={{ fontSize: "0.72rem", color: "var(--color-ink-muted)" }}>{derma.email}</div>
                        </td>
                        <td>{derma.specialization || "Clinical Dermatology"}</td>
                        <td>
                          <span className={`status-pill ${derma.accepting_new_patients ? "status-accepted" : "status-pending"}`}>
                            {derma.accepting_new_patients ? "Verified & Active" : "Pending Board Review"}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            onClick={() => handleDermatologistVerify(derma.id, !derma.accepting_new_patients)}
                            className="btn btn-primary"
                            style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                          >
                            {derma.accepting_new_patients ? "Revoke License" : "Approve License"}
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
      </main>

    </div>
  );
}
