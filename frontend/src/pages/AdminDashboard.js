// frontend/src/pages/AdminDashboard.js

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Chart from 'chart.js/auto';
import AdminSidebar from '../components/AdminSidebar';
import '../styles/admin-theme.css';

function AdminDashboard() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState('/dashboard/admin');
  
  const [stats, setStats] = useState({
    total_users: 0,
    total_customers: 0,
    total_consultants: 0,
    total_dermatologists: 0,
    total_admins: 0,
    total_all_users: 0,
    total_assessments: 0,
    completed_assessments: 0,
    in_progress_assessments: 0,
    not_started_assessments: 0,
    active_routines: 0,
    total_products: 0,
    pending_consultant: 0,
    pending_dermatologist: 0
  });
  
  const [userGrowthData, setUserGrowthData] = useState([]);
  const [topConcernsData, setTopConcernsData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  const growthChartRef = useRef(null);
  const concernsChartRef = useRef(null);
  const roleChartRef = useRef(null);
  const assessmentsChartRef = useRef(null);
  const growthChartInstance = useRef(null);
  const concernsChartInstance = useRef(null);
  const roleChartInstance = useRef(null);
  const assessmentsChartInstance = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    const storedName = localStorage.getItem('userName');
    setUserName(storedName || 'Admin');
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');

    try {
      const reportRes = await api.get('/admin/reports/data', { params: { token } });
      const data = reportRes.data;
      
      setStats({
        total_users: data.total_users || 0,
        total_customers: data.total_customers || 0,
        total_consultants: data.total_consultants || 0,
        total_dermatologists: data.total_dermatologists || 0,
        total_admins: data.total_admins || 0,
        total_all_users: data.total_users || 0,
        total_assessments: data.total_assessments || 0,
        completed_assessments: data.completed_assessments || 0,
        in_progress_assessments: data.in_progress_assessments || 0,
        not_started_assessments: data.not_started_assessments || 0,
        active_routines: data.active_routines || 0,
        total_products: data.total_products || 0,
        pending_consultant: data.pending_consultant || 0,
        pending_dermatologist: data.pending_dermatologist || 0
      });

      setUserGrowthData(data.user_growth || []);
      setTopConcernsData(data.top_concerns || []);
      setRecentActivity(data.recent_activity || []);

    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Could not load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && userGrowthData.length > 0) {
      setTimeout(() => renderGrowthChart(), 100);
    }
  }, [loading, userGrowthData]);

  useEffect(() => {
    if (!loading && topConcernsData.length > 0) {
      setTimeout(() => renderConcernsChart(), 100);
    }
  }, [loading, topConcernsData]);

  useEffect(() => {
    if (!loading) {
      setTimeout(() => {
        renderRoleChart();
        renderAssessmentsChart();
      }, 100);
    }
  }, [loading]);

  const renderGrowthChart = () => {
    if (growthChartInstance.current) {
      growthChartInstance.current.destroy();
    }

    const ctx = growthChartRef.current?.getContext('2d');
    if (!ctx) return;

    const labels = userGrowthData.map(d => {
      if (d.date) {
        const date = new Date(d.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      return '';
    });

    const data = userGrowthData.map(d => d.count);

    growthChartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'New Users',
          data: data,
          borderColor: '#0d9488',
          backgroundColor: 'rgba(13, 148, 136, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#0d9488',
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `New Users: ${context.parsed.y}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.05)' }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  };

  const renderConcernsChart = () => {
    if (concernsChartInstance.current) {
      concernsChartInstance.current.destroy();
    }

    const ctx = concernsChartRef.current?.getContext('2d');
    if (!ctx) return;

    const labels = topConcernsData.map(d => d.name);
    const data = topConcernsData.map(d => d.count);
    const colors = ['#0d9488', '#0f766e', '#F59E0B', '#DC2626', '#3B82F6'];

    concernsChartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Occurrences',
          data: data,
          backgroundColor: colors.slice(0, labels.length),
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.05)' }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  };

  const renderRoleChart = () => {
    if (roleChartInstance.current) {
      roleChartInstance.current.destroy();
    }

    const ctx = roleChartRef.current?.getContext('2d');
    if (!ctx) return;

    const labels = ['Users', 'Consultants', 'Dermatologists', 'Admins'];
    const data = [
      stats.total_customers || 0,
      stats.total_consultants || 0,
      stats.total_dermatologists || 0,
      stats.total_admins || 0
    ];
    const colors = ['#0d9488', '#0f766e', '#8B5CF6', '#F59E0B'];

    roleChartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels.map((label, i) => `${label} (${data[i]})`),
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderWidth: 3,
          borderColor: '#FFFFFF'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 14,
              padding: 14,
              font: { size: 12, weight: '500' }
            }
          }
        },
        cutout: '55%'
      }
    });
  };

  const renderAssessmentsChart = () => {
    if (assessmentsChartInstance.current) {
      assessmentsChartInstance.current.destroy();
    }

    const ctx = assessmentsChartRef.current?.getContext('2d');
    if (!ctx) return;

    const labels = ['Completed', 'In Progress', 'Not Started'];
    const data = [
      stats.completed_assessments || 0,
      stats.in_progress_assessments || 0,
      stats.not_started_assessments || 0
    ];
    const colors = ['#10B981', '#F59E0B', '#9CA3AF'];

    assessmentsChartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels.map((label, i) => `${label} (${data[i]})`),
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderWidth: 3,
          borderColor: '#FFFFFF'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 14,
              padding: 14,
              font: { size: 12, weight: '500' }
            }
          }
        },
        cutout: '55%'
      }
    });
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const navigateTo = (path) => {
    setActiveMenu(path);
    navigate(path);
  };

  if (loading) {
    return (
      <div className="admin-loading-page">
        <div className="admin-loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <AdminSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main className={`admin-main ${sidebarOpen ? '' : 'is-collapsed'}`}>
        {/* ===== HEADER - Title LEFT, Items RIGHT ===== */}
        <div className="admin-header" style={styles.headerRow}>
          <div>
            <div className="admin-kicker">DASHBOARD</div>
            <h1 className="admin-title">Welcome back, {userName}! 👋</h1>
            <p className="admin-subtitle">Here's what's happening on your platform today.</p>
          </div>
          <div style={styles.headerRight}>
            <button className="admin-primary-button" onClick={() => navigateTo('/admin/users')}>
              + Add User
            </button>
            <button className="admin-secondary-button" onClick={() => navigateTo('/admin/reports')}>
              📄 Generate Report
            </button>
            <div style={styles.dateChip}>📅 {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div style={styles.profileChip}>
              <div style={styles.avatarCircle}>{userName?.charAt(0)?.toUpperCase() || 'A'}</div>
              <div>
                <div style={styles.profileName}>{userName}</div>
                <div style={styles.profileRole}>Admin</div>
              </div>
            </div>
          </div>
        </div>

        {error && <div className="admin-alert-error">{error}</div>}

        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <h3 className="admin-stat-number">{stats.total_all_users}</h3>
            <p className="admin-stat-label">Total Users</p>
          </div>
          <div className="admin-stat-card">
            <h3 className="admin-stat-number">{stats.total_assessments}</h3>
            <p className="admin-stat-label">Assessments</p>
          </div>
          <div className="admin-stat-card">
            <h3 className="admin-stat-number">{stats.active_routines}</h3>
            <p className="admin-stat-label">Active Routines</p>
          </div>
          <div className="admin-stat-card">
            <h3 className="admin-stat-number">{stats.total_products}</h3>
            <p className="admin-stat-label">Total Products</p>
          </div>
        </div>

        <div className="admin-charts-row">
          <div className="admin-surface" style={{ height: '280px' }}>
            <h4 style={styles.chartTitle}>📈 User Growth</h4>
            <div style={{ height: '220px', position: 'relative' }}>
              <canvas ref={growthChartRef}></canvas>
            </div>
          </div>
          <div className="admin-surface" style={{ height: '280px' }}>
            <h4 style={styles.chartTitle}>👤 User Role Distribution</h4>
            <div style={{ height: '220px', position: 'relative' }}>
              <canvas ref={roleChartRef}></canvas>
            </div>
          </div>
        </div>

        <div className="admin-charts-row">
          <div className="admin-surface" style={{ height: '280px' }}>
            <h4 style={styles.chartTitle}>📊 Assessments Overview</h4>
            <div style={{ height: '220px', position: 'relative' }}>
              <canvas ref={assessmentsChartRef}></canvas>
            </div>
          </div>
          <div className="admin-surface" style={{ height: '280px' }}>
            <h4 style={styles.chartTitle}>🔬 Top Skin Concerns</h4>
            <div style={{ height: '220px', position: 'relative' }}>
              <canvas ref={concernsChartRef}></canvas>
            </div>
          </div>
        </div>

        <div className="admin-surface">
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>📋 Recent Activity</h3>
            <button style={styles.viewAllBtn} onClick={() => navigateTo('/admin/audit-logs')}>
              View All →
            </button>
          </div>
          {recentActivity.length > 0 ? (
            <div style={styles.activityList}>
              {recentActivity.slice(0, 5).map((activity, index) => (
                <div key={index} style={styles.activityItem}>
                  <span style={styles.activityDot}></span>
                  <span style={styles.activityText}>
                    <strong>{activity.name}</strong> ({activity.role}) {activity.action}
                  </span>
                  <span style={styles.activityTime}>
                    {activity.created_at ? new Date(activity.created_at).toLocaleDateString() : ''}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={styles.emptyText}>No recent activity</p>
          )}
        </div>

        <div style={styles.quickActions}>
          <button className="admin-secondary-button" onClick={() => navigateTo('/admin/users')}>
            👤 Add New User
          </button>
          <button className="admin-secondary-button" onClick={() => navigateTo('/admin/products')}>
            🛍️ Add Product
          </button>
          <button className="admin-secondary-button" onClick={() => navigateTo('/admin/routines')}>
            📋 Create Routine
          </button>
          <button className="admin-secondary-button" onClick={() => navigateTo('/admin/reports')}>
            📄 Generate Report
          </button>
        </div>
      </main>
    </div>
  );
}

const styles = {
  headerRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'nowrap',
    gap: '16px',
    width: '100%'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flexWrap: 'nowrap',
    flexShrink: 0
  },
  dateChip: {
    background: '#FFFFFF',
    border: '1px solid #E7EAF1',
    borderRadius: '12px',
    padding: '8px 14px',
    fontSize: '13px',
    color: '#374151',
    whiteSpace: 'nowrap'
  },
  profileChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    whiteSpace: 'nowrap'
  },
  avatarCircle: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    backgroundColor: '#0d9488',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '15px',
    flexShrink: 0
  },
  profileName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#17233C'
  },
  profileRole: {
    fontSize: '11px',
    color: '#778198'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
    borderBottom: '1px solid #F0F2F6',
    paddingBottom: '12px'
  },
  cardTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#17233C',
    margin: 0
  },
  viewAllBtn: {
    background: 'none',
    border: 'none',
    color: '#0d9488',
    fontSize: '13px',
    cursor: 'pointer',
    padding: '4px 0 0',
    fontWeight: '600',
    fontFamily: 'inherit'
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  activityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 14px',
    backgroundColor: '#F9FAFB',
    borderRadius: '8px'
  },
  activityDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#0d9488',
    flexShrink: 0
  },
  activityText: {
    flex: 1,
    fontSize: '14px',
    color: '#17233C'
  },
  activityTime: {
    fontSize: '12px',
    color: '#778198'
  },
  quickActions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px',
    marginBottom: '20px'
  },
  emptyText: {
    textAlign: 'center',
    color: '#778198',
    padding: '20px 0',
    fontSize: '14px'
  },
  chartTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#17233C',
    margin: '0 0 8px 0'
  }
};

export default AdminDashboard;