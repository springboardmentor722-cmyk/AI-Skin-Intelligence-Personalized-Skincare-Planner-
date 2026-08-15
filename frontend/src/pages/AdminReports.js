// frontend/src/pages/AdminReports.js

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import AdminSidebar from '../components/AdminSidebar';
import '../styles/admin-theme.css';
import Chart from 'chart.js/auto';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function AdminReports() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState('/admin/reports');
  const [userName, setUserName] = useState('');
  const [reportData, setReportData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30days');

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
    const name = localStorage.getItem('userName');
    setUserName(name || 'Admin');
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');

    try {
      const res = await api.get('/admin/reports/data', { params: { token } });
      setReportData(res.data);
    } catch (err) {
      console.error('Failed to fetch report data:', err);
      setError('Could not load report data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && reportData && reportData.user_growth && reportData.user_growth.length > 0) {
      setTimeout(() => renderGrowthChart(), 100);
    }
  }, [loading, reportData]);

  useEffect(() => {
    if (!loading && reportData && reportData.top_concerns && reportData.top_concerns.length > 0) {
      setTimeout(() => renderConcernsChart(), 100);
    }
  }, [loading, reportData]);

  useEffect(() => {
    if (!loading && reportData) {
      setTimeout(() => {
        renderRoleChart();
        renderAssessmentsChart();
      }, 100);
    }
  }, [loading, reportData]);

  const renderGrowthChart = () => {
    if (growthChartInstance.current) {
      growthChartInstance.current.destroy();
    }

    const ctx = growthChartRef.current?.getContext('2d');
    if (!ctx) return;

    const data = reportData.user_growth || [];
    const labels = data.map(d => {
      if (d.date) {
        const date = new Date(d.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      return '';
    });
    const values = data.map(d => d.count);

    growthChartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'New Users',
          data: values,
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

    const data = reportData.top_concerns || [];
    const labels = data.map(d => d.name);
    const values = data.map(d => d.count);
    const colors = ['#0d9488', '#0f766e', '#F59E0B', '#DC2626', '#3B82F6'];

    concernsChartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Occurrences',
          data: values,
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
      reportData.total_customers || 0,
      reportData.total_consultants || 0,
      reportData.total_dermatologists || 0,
      reportData.total_admins || 0
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
      reportData.completed_assessments || 0,
      reportData.in_progress_assessments || 0,
      reportData.not_started_assessments || 0
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

  const generatePDF = () => {
    setGenerating(true);
    setError('');

    try {
      const data = reportData;
      if (!data) {
        setError('No data available to generate report.');
        setGenerating(false);
        return;
      }

      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 15;

      const primaryColor = [13, 148, 136];
      const darkColor = [31, 41, 55];
      const grayColor = [107, 114, 128];
      const lightBg = [249, 250, 251];

      doc.setFontSize(28);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('🌿', 15, y + 5);

      doc.setFontSize(20);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text('Skin Intelligence', 30, y + 5);

      doc.setFontSize(12);
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.text('Admin Report', 30, y + 10);

      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(1);
      doc.line(15, y + 15, pageWidth - 15, y + 15);

      y += 22;

      doc.setFontSize(10);
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 15, y);
      doc.text(`Period: ${selectedPeriod === '7days' ? 'Last 7 Days' : selectedPeriod === '30days' ? 'Last 30 Days' : 'All Time'}`, 15, y + 5);
      y += 15;

      const stats = [
        { label: 'Total Users', value: data.total_users || 0 },
        { label: 'Assessments', value: data.total_assessments || 0 },
        { label: 'Active Routines', value: data.active_routines || 0 },
        { label: 'Products', value: data.total_products || 0 }
      ];

      const cardWidth = (pageWidth - 30) / 4;
      stats.forEach((stat, index) => {
        const x = 15 + (index * cardWidth);
        doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
        doc.roundedRect(x, y, cardWidth - 4, 25, 3, 3, 'F');
        doc.setFontSize(18);
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        doc.text(stat.value.toString(), x + (cardWidth - 4) / 2, y + 10, { align: 'center' });
        doc.setFontSize(9);
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        doc.text(stat.label, x + (cardWidth - 4) / 2, y + 20, { align: 'center' });
      });

      y += 32;

      doc.setFontSize(14);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text('User Breakdown', 15, y);
      y += 8;

      const userData = [
        ['Customers', data.total_customers || 0],
        ['Consultants', data.total_consultants || 0],
        ['Dermatologists', data.total_dermatologists || 0],
        ['Admins', data.total_admins || 0],
        ['Pending Consultants', data.pending_consultant || 0],
        ['Pending Dermatologists', data.pending_dermatologist || 0]
      ];

      doc.autoTable({
        startY: y,
        head: [['Role', 'Count']],
        body: userData,
        theme: 'striped',
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontSize: 11,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 10,
          textColor: darkColor
        },
        alternateRowStyles: {
          fillColor: lightBg
        },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 40, halign: 'center' }
        },
        margin: { left: 15, right: 15 }
      });

      y = doc.lastAutoTable.finalY + 10;

      doc.setFontSize(14);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text('Assessment Status', 15, y);
      y += 8;

      const assessmentData = [
        ['✅ Completed', data.completed_assessments || 0],
        ['⏳ In Progress', data.in_progress_assessments || 0],
        ['❌ Not Started', data.not_started_assessments || 0]
      ];

      doc.autoTable({
        startY: y,
        head: [['Status', 'Count']],
        body: assessmentData,
        theme: 'striped',
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontSize: 11,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 10,
          textColor: darkColor
        },
        alternateRowStyles: {
          fillColor: lightBg
        },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 40, halign: 'center' }
        },
        margin: { left: 15, right: 15 }
      });

      y = doc.lastAutoTable.finalY + 10;

      doc.setFontSize(14);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text('Top Skin Concerns', 15, y);
      y += 8;

      if (data.top_concerns && data.top_concerns.length > 0) {
        const concernsData = data.top_concerns.map(c => [c.name, `${c.count} occurrences`]);
        doc.autoTable({
          startY: y,
          head: [['Concern', 'Occurrences']],
          body: concernsData,
          theme: 'striped',
          headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontSize: 11,
            fontStyle: 'bold'
          },
          bodyStyles: {
            fontSize: 10,
            textColor: darkColor
          },
          alternateRowStyles: {
            fillColor: lightBg
          },
          columnStyles: {
            0: { cellWidth: 80 },
            1: { cellWidth: 40, halign: 'center' }
          },
          margin: { left: 15, right: 15 }
        });

        y = doc.lastAutoTable.finalY + 10;
      } else {
        doc.setFontSize(10);
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        doc.text('No concerns data available', 15, y);
        y += 10;
      }

      doc.setFontSize(14);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text('Recent Activity', 15, y);
      y += 8;

      if (data.recent_activity && data.recent_activity.length > 0) {
        const activityData = data.recent_activity.slice(0, 8).map(a => [
          a.name || 'Unknown',
          a.role || 'User',
          a.action || 'registered',
          a.created_at ? new Date(a.created_at).toLocaleDateString() : ''
        ]);
        doc.autoTable({
          startY: y,
          head: [['User', 'Role', 'Action', 'Date']],
          body: activityData,
          theme: 'striped',
          headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontSize: 10,
            fontStyle: 'bold'
          },
          bodyStyles: {
            fontSize: 9,
            textColor: darkColor
          },
          alternateRowStyles: {
            fillColor: lightBg
          },
          columnStyles: {
            0: { cellWidth: 45 },
            1: { cellWidth: 35 },
            2: { cellWidth: 40 },
            3: { cellWidth: 30, halign: 'center' }
          },
          margin: { left: 15, right: 15 }
        });

        y = doc.lastAutoTable.finalY + 10;
      } else {
        doc.setFontSize(10);
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        doc.text('No recent activity', 15, y);
        y += 10;
      }

      const pageHeight = doc.internal.pageSize.getHeight();
      if (y > pageHeight - 20) {
        doc.addPage();
        y = 15;
      }

      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(15, y, pageWidth - 15, y);
      y += 8;

      doc.setFontSize(9);
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.text(`Generated by Skin Intelligence Platform • © ${new Date().getFullYear()}`, pageWidth / 2, y, { align: 'center' });

      doc.save(`admin_report_${new Date().toISOString().split('T')[0]}.pdf`);
      alert('✅ PDF Report downloaded successfully!');

    } catch (err) {
      console.error('PDF Generation Error:', err);
      setError('Failed to generate PDF: ' + (err.message || 'Unknown error'));
    } finally {
      setGenerating(false);
    }
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
        <p>Loading report data...</p>
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
            <div className="admin-kicker">REPORTS & ANALYTICS</div>
            <h1 className="admin-title">📄 Reports & Analytics</h1>
            <p className="admin-subtitle">Generate and download platform reports as PDF.</p>
          </div>
          <div style={styles.headerRight}>
            <button className="admin-primary-button" onClick={generatePDF} disabled={generating}>
              {generating ? '⏳ Generating...' : '📥 Export PDF'}
            </button>
            <button className="admin-secondary-button" onClick={fetchReportData}>
              🔄 Refresh
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

        <div style={styles.filterCard}>
          <div style={styles.filterRow}>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Period:</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                style={styles.select}
              >
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>
        </div>

        {reportData && (
          <>
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <h3 className="admin-stat-number">{reportData.total_users || 0}</h3>
                <p className="admin-stat-label">Total Users</p>
              </div>
              <div className="admin-stat-card">
                <h3 className="admin-stat-number">{reportData.total_assessments || 0}</h3>
                <p className="admin-stat-label">Assessments</p>
              </div>
              <div className="admin-stat-card">
                <h3 className="admin-stat-number">{reportData.active_routines || 0}</h3>
                <p className="admin-stat-label">Active Routines</p>
              </div>
              <div className="admin-stat-card">
                <h3 className="admin-stat-number">{reportData.total_products || 0}</h3>
                <p className="admin-stat-label">Products</p>
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
              <h3 style={styles.cardTitle}>User Breakdown</h3>
              <div style={styles.userBreakdown}>
                <div style={styles.breakdownItem}>
                  <span style={styles.breakdownLabel}>Customers</span>
                  <span style={styles.breakdownValue}>{reportData.total_customers || 0}</span>
                </div>
                <div style={styles.breakdownItem}>
                  <span style={styles.breakdownLabel}>Consultants</span>
                  <span style={styles.breakdownValue}>{reportData.total_consultants || 0}</span>
                </div>
                <div style={styles.breakdownItem}>
                  <span style={styles.breakdownLabel}>Dermatologists</span>
                  <span style={styles.breakdownValue}>{reportData.total_dermatologists || 0}</span>
                </div>
                <div style={styles.breakdownItem}>
                  <span style={styles.breakdownLabel}>Admins</span>
                  <span style={styles.breakdownValue}>{reportData.total_admins || 0}</span>
                </div>
                <div style={styles.breakdownItem}>
                  <span style={styles.breakdownLabel}>Pending Consultants</span>
                  <span style={styles.breakdownValue}>{reportData.pending_consultant || 0}</span>
                </div>
                <div style={styles.breakdownItem}>
                  <span style={styles.breakdownLabel}>Pending Dermatologists</span>
                  <span style={styles.breakdownValue}>{reportData.pending_dermatologist || 0}</span>
                </div>
              </div>
            </div>

            <div className="admin-surface">
              <h3 style={styles.cardTitle}>Assessment Status</h3>
              <div style={styles.userBreakdown}>
                <div style={{...styles.breakdownItem, color: '#10B981'}}>
                  <span style={styles.breakdownLabel}>✅ Completed</span>
                  <span style={styles.breakdownValue}>{reportData.completed_assessments || 0}</span>
                </div>
                <div style={{...styles.breakdownItem, color: '#F59E0B'}}>
                  <span style={styles.breakdownLabel}>⏳ In Progress</span>
                  <span style={styles.breakdownValue}>{reportData.in_progress_assessments || 0}</span>
                </div>
                <div style={{...styles.breakdownItem, color: '#DC2626'}}>
                  <span style={styles.breakdownLabel}>❌ Not Started</span>
                  <span style={styles.breakdownValue}>{reportData.not_started_assessments || 0}</span>
                </div>
              </div>
            </div>

            <div className="admin-surface">
              <h3 style={styles.cardTitle}>Top Skin Concerns</h3>
              {reportData.top_concerns && reportData.top_concerns.length > 0 ? (
                reportData.top_concerns.map((concern, i) => (
                  <div key={i} style={styles.concernItem}>
                    <span>{concern.name}</span>
                    <span>{concern.count} occurrences</span>
                  </div>
                ))
              ) : (
                <p style={styles.emptyText}>No concerns data available</p>
              )}
            </div>

            <div className="admin-surface">
              <h3 style={styles.cardTitle}>Recent Activity</h3>
              {reportData.recent_activity && reportData.recent_activity.length > 0 ? (
                reportData.recent_activity.slice(0, 5).map((activity, i) => (
                  <div key={i} style={styles.activityItem}>
                    <span>{activity.name} ({activity.role}) - {activity.action}</span>
                    <span style={styles.activityTime}>
                      {activity.created_at ? new Date(activity.created_at).toLocaleDateString() : ''}
                    </span>
                  </div>
                ))
              ) : (
                <p style={styles.emptyText}>No recent activity</p>
              )}
            </div>
          </>
        )}
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
    flexWrap: 'wrap',
    gap: '16px',
    width: '100%'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flexWrap: 'wrap',
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
  filterCard: {
    background: '#FFFFFF',
    padding: '24px',
    borderRadius: '20px',
    border: '1px solid #E7EAF1',
    boxShadow: '0 14px 38px rgba(23, 35, 60, 0.07)',
    marginBottom: '20px'
  },
  filterRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '20px',
    alignItems: 'flex-end'
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  filterLabel: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#17233C'
  },
  select: {
    padding: '10px 14px',
    border: '1px solid #DCE1EC',
    borderRadius: '12px',
    fontSize: '14px',
    fontFamily: 'inherit',
    backgroundColor: '#FFFFFF',
    minWidth: '150px'
  },
  cardTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#17233C',
    marginTop: 0,
    marginBottom: '16px',
    borderBottom: '1px solid #F0F2F6',
    paddingBottom: '12px'
  },
  userBreakdown: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '8px'
  },
  breakdownItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 12px',
    backgroundColor: '#F9FAFB',
    borderRadius: '6px',
    fontSize: '14px'
  },
  breakdownLabel: {
    color: '#778198'
  },
  breakdownValue: {
    fontWeight: '600',
    color: '#17233C'
  },
  concernItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #F0F2F6',
    fontSize: '14px'
  },
  activityItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #F0F2F6',
    fontSize: '14px'
  },
  activityTime: {
    fontSize: '12px',
    color: '#778198'
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

export default AdminReports;