// frontend/src/pages/ConsultantReports.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ProfessionalSidebar from '../components/ProfessionalSidebar';
import '../styles/professional-theme.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

function ConsultantReports() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('consultant');
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [reportData, setReportData] = useState({
    totalClients: 0,
    avgScore: 0,
    totalAssessments: 0,
    activeRoutines: 0,
    adherenceRate: 0,
    topConcerns: [],
    scoreDistribution: { excellent: 0, good: 0, fair: 0, poor: 0 }
  });
  const [selectedPeriod, setSelectedPeriod] = useState('7days');
  const [reportType, setReportType] = useState('summary');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    const name = localStorage.getItem('userName');
    const role = localStorage.getItem('role') || 'consultant';
    setUserName(name || 'Consultant');
    setUserRole(role);
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role') || 'consultant';

    try {
      let endpoint = '/consultant/reviews';
      if (role === 'dermatologist') {
        endpoint = '/dermatologist/patients';
      }

      const clientsRes = await api.get(endpoint, { params: { token } });
      const clientList = clientsRes.data || [];

      let totalClients = clientList.length;
      let totalScore = 0;
      let scoredClients = 0;
      let totalAssessments = 0;
      let activeRoutines = 0;
      let totalAdherence = 0;
      let adherenceCount = 0;
      const concerns = {};
      const scoreDist = { excellent: 0, good: 0, fair: 0, poor: 0 };
      const enrichedClients = [];

      for (const client of clientList) {
        let clientData = {
          ...client,
          score: null,
          assessmentDate: null,
          detectedConcerns: [],
          hasRoutine: false,
          adherence: 0
        };

        try {
          const scoreRes = await api.get('/api/v1/assessment/score', {
            params: { token, user_id: client.user_id }
          });

          if (scoreRes.data && scoreRes.data.score) {
            const score = scoreRes.data.score;
            clientData.score = score;
            clientData.assessmentDate = scoreRes.data.created_at;
            clientData.detectedConcerns = scoreRes.data.detected_concerns || [];
            
            totalScore += score;
            scoredClients += 1;
            totalAssessments += 1;

            if (score >= 80) scoreDist.excellent += 1;
            else if (score >= 60) scoreDist.good += 1;
            else if (score >= 40) scoreDist.fair += 1;
            else scoreDist.poor += 1;

            const detected = scoreRes.data.detected_concerns || [];
            detected.forEach(c => {
              concerns[c] = (concerns[c] || 0) + 1;
            });
          }

          const routineRes = await api.get('/api/v1/routine', {
            params: { token, user_id: client.user_id }
          });
          if (routineRes.data && (routineRes.data.AM?.length > 0 || routineRes.data.PM?.length > 0)) {
            clientData.hasRoutine = true;
            activeRoutines += 1;
          }

          const adherenceRes = await api.get('/api/v1/progress/adherence', {
            params: { token, user_id: client.user_id, days: 7 }
          });
          if (adherenceRes.data && adherenceRes.data.adherence) {
            clientData.adherence = adherenceRes.data.adherence.adherence_percentage || 0;
            totalAdherence += clientData.adherence;
            adherenceCount += 1;
          }

        } catch (e) {
          console.error('Error fetching client data for report:', e);
        }
        enrichedClients.push(clientData);
      }

      const sortedConcerns = Object.entries(concerns).sort((a, b) => b[1] - a[1]).slice(0, 5);

      setReportData({
        totalClients: totalClients,
        avgScore: scoredClients > 0 ? Math.round(totalScore / scoredClients) : 0,
        totalAssessments: totalAssessments,
        activeRoutines: activeRoutines,
        adherenceRate: adherenceCount > 0 ? Math.round(totalAdherence / adherenceCount) : 0,
        topConcerns: sortedConcerns.map(([name, count]) => ({ name, count })),
        scoreDistribution: scoreDist
      });

      setClients(enrichedClients);
      setFilteredClients(enrichedClients);

    } catch (err) {
      console.error('Failed to fetch report data:', err);
      setError('Could not load report data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...clients];

    if (searchTerm) {
      filtered = filtered.filter(c => 
        (c.user_name || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedPeriod !== 'all') {
      const days = parseInt(selectedPeriod);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      filtered = filtered.filter(c => {
        if (!c.assessmentDate) return false;
        return new Date(c.assessmentDate) >= cutoffDate;
      });
    }

    if (reportType === 'clients') {
      filtered = filtered;
    } else if (reportType === 'assessments') {
      filtered = filtered.filter(c => c.score !== null);
    } else {
      filtered = filtered;
    }

    setFilteredClients(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [searchTerm, selectedPeriod, reportType, clients]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const navigateTo = (path) => {
    navigate(path);
  };

  // PDF Export Function
  const exportPDF = () => {
    const roleLabel = userRole === 'dermatologist' ? 'Dermatologist' : 'Consultant';
    const clientLabel = userRole === 'dermatologist' ? 'Patients' : 'Clients';
    const routineLabel = userRole === 'dermatologist' ? 'Treatments' : 'Routines';
    const accentColor = userRole === 'dermatologist' ? '#6c63d9' : '#0d9488';

    // Create a temporary div for PDF content
    const reportContent = document.createElement('div');
    reportContent.style.padding = '40px';
    reportContent.style.fontFamily = 'Arial, sans-serif';
    reportContent.style.backgroundColor = '#ffffff';
    reportContent.style.width = '800px';
    reportContent.innerHTML = `
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: ${accentColor}; font-size: 28px; margin-bottom: 5px;">📄 ${roleLabel} Report</h1>
        <p style="color: #778198; font-size: 14px; margin: 0;">
          Generated: ${new Date().toLocaleString()}
        </p>
        <p style="color: #778198; font-size: 14px; margin: 0;">
          ${roleLabel}: ${userName}
        </p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 30px;">
        <div style="background: #F5F7FB; padding: 15px; border-radius: 8px; border: 1px solid #E7EAF1; text-align: center;">
          <div style="font-size: 24px; font-weight: bold; color: #17233C;">${reportData.totalClients}</div>
          <div style="color: #778198; font-size: 13px;">Total ${clientLabel}</div>
        </div>
        <div style="background: #F5F7FB; padding: 15px; border-radius: 8px; border: 1px solid #E7EAF1; text-align: center;">
          <div style="font-size: 24px; font-weight: bold; color: #17233C;">${reportData.avgScore}</div>
          <div style="color: #778198; font-size: 13px;">Average Score</div>
        </div>
        <div style="background: #F5F7FB; padding: 15px; border-radius: 8px; border: 1px solid #E7EAF1; text-align: center;">
          <div style="font-size: 24px; font-weight: bold; color: #17233C;">${reportData.adherenceRate}%</div>
          <div style="color: #778198; font-size: 13px;">Avg Adherence</div>
        </div>
        <div style="background: #F5F7FB; padding: 15px; border-radius: 8px; border: 1px solid #E7EAF1; text-align: center;">
          <div style="font-size: 24px; font-weight: bold; color: #17233C;">${reportData.totalAssessments}</div>
          <div style="color: #778198; font-size: 13px;">Total Assessments</div>
        </div>
        <div style="background: #F5F7FB; padding: 15px; border-radius: 8px; border: 1px solid #E7EAF1; text-align: center;">
          <div style="font-size: 24px; font-weight: bold; color: #17233C;">${reportData.activeRoutines}</div>
          <div style="color: #778198; font-size: 13px;">Active ${routineLabel}</div>
        </div>
      </div>

      <div style="margin-bottom: 30px;">
        <h2 style="color: #17233C; font-size: 18px; border-bottom: 2px solid ${accentColor}; padding-bottom: 8px;">📊 Score Distribution</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; margin-top: 10px;">
          <div style="background: #F5F7FB; padding: 12px; border-radius: 8px; text-align: center;">
            <div style="font-weight: bold; color: ${accentColor};">${reportData.scoreDistribution.excellent}</div>
            <div style="font-size: 12px; color: #778198;">Excellent (80-100)</div>
          </div>
          <div style="background: #F5F7FB; padding: 12px; border-radius: 8px; text-align: center;">
            <div style="font-weight: bold; color: #6c63d9;">${reportData.scoreDistribution.good}</div>
            <div style="font-size: 12px; color: #778198;">Good (60-79)</div>
          </div>
          <div style="background: #F5F7FB; padding: 12px; border-radius: 8px; text-align: center;">
            <div style="font-weight: bold; color: #d97706;">${reportData.scoreDistribution.fair}</div>
            <div style="font-size: 12px; color: #778198;">Fair (40-59)</div>
          </div>
          <div style="background: #F5F7FB; padding: 12px; border-radius: 8px; text-align: center;">
            <div style="font-weight: bold; color: #dc2626;">${reportData.scoreDistribution.poor}</div>
            <div style="font-size: 12px; color: #778198;">Poor (0-39)</div>
          </div>
        </div>
      </div>

      <div style="margin-bottom: 30px;">
        <h2 style="color: #17233C; font-size: 18px; border-bottom: 2px solid ${accentColor}; padding-bottom: 8px;">📋 ${clientLabel} Summary</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px;">
          <thead>
            <tr>
              <th style="background: ${accentColor}; color: white; padding: 10px; text-align: left;">${userRole === 'dermatologist' ? 'Patient' : 'Client'}</th>
              <th style="background: ${accentColor}; color: white; padding: 10px; text-align: left;">Status</th>
              <th style="background: ${accentColor}; color: white; padding: 10px; text-align: left;">Score</th>
              <th style="background: ${accentColor}; color: white; padding: 10px; text-align: left;">Adherence</th>
              <th style="background: ${accentColor}; color: white; padding: 10px; text-align: left;">Assessments</th>
            </tr>
          </thead>
          <tbody>
            ${filteredClients.slice(0, 15).map(c => `
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #E7EAF1;">${c.user_name || 'Unknown'}</td>
                <td style="padding: 8px; border-bottom: 1px solid #E7EAF1;">${c.status || 'Pending'}</td>
                <td style="padding: 8px; border-bottom: 1px solid #E7EAF1;">${c.score ? c.score + '/100' : 'N/A'}</td>
                <td style="padding: 8px; border-bottom: 1px solid #E7EAF1;">${c.adherence || 0}%</td>
                <td style="padding: 8px; border-bottom: 1px solid #E7EAF1;">${c.assessmentDate ? '✅' : '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${filteredClients.length > 15 ? `<p style="color: #778198; font-size: 12px; margin-top: 5px;">* Showing 15 of ${filteredClients.length} ${clientLabel.toLowerCase()}</p>` : ''}
      </div>

      <div style="text-align: center; color: #778198; font-size: 11px; border-top: 1px solid #E7EAF1; padding-top: 15px; margin-top: 10px;">
        Generated by Skin Intelligence Platform • ${new Date().getFullYear()}
      </div>
    `;

    document.body.appendChild(reportContent);

    html2canvas(reportContent, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`report_${new Date().toISOString().split('T')[0]}.pdf`);
      
      document.body.removeChild(reportContent);
    }).catch((err) => {
      console.error('PDF generation failed:', err);
      alert('Failed to generate PDF. Please try again.');
      document.body.removeChild(reportContent);
    });
  };

  // Dynamic labels
  const roleLabel = userRole === 'dermatologist' ? 'Dermatologist' : 'Consultant';
  const clientLabel = userRole === 'dermatologist' ? 'Patients' : 'Clients';
  const routineLabel = userRole === 'dermatologist' ? 'Treatments' : 'Routines';
  const pageTitle = userRole === 'dermatologist' ? '📄 Clinical Reports' : '📄 Reports';
  const pageSubtitle = userRole === 'dermatologist' ? 'View and export patient analytics reports.' : 'View and export client analytics reports.';

  if (loading) {
    return (
      <div className="professional-loading-page">
        <div className="professional-loading-spinner"></div>
        <p>Generating report...</p>
      </div>
    );
  }

  return (
    <div className={`professional-page role-${userRole}`}>
      <ProfessionalSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main className={`professional-main ${sidebarOpen ? '' : 'is-collapsed'}`}>
        <div className="professional-header">
          <div>
            <div className="professional-kicker">{userRole === 'dermatologist' ? 'CLINICAL REPORTS' : 'REPORTS'}</div>
            <h1 className="professional-title">{pageTitle}</h1>
            <p className="professional-subtitle">{pageSubtitle}</p>
          </div>
          <button className="professional-primary-button" onClick={exportPDF}>
            📥 Export PDF
          </button>
        </div>

        {error && <div className="professional-alert-error">{error}</div>}

        <div className="professional-surface">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '150px' }}>
              <label style={{ fontSize: '13px', fontWeight: '500', color: '#17233C' }}>Report Type:</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                style={{ padding: '8px 14px', border: '1px solid #DCE1EC', borderRadius: '12px', fontSize: '14px', fontFamily: 'inherit', backgroundColor: '#FFFFFF', width: '100%' }}
              >
                <option value="summary">Summary Report</option>
                <option value="clients">{clientLabel} Report</option>
                <option value="assessments">Assessment Report</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '150px' }}>
              <label style={{ fontSize: '13px', fontWeight: '500', color: '#17233C' }}>Period:</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                style={{ padding: '8px 14px', border: '1px solid #DCE1EC', borderRadius: '12px', fontSize: '14px', fontFamily: 'inherit', backgroundColor: '#FFFFFF', width: '100%' }}
              >
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '150px' }}>
              <label style={{ fontSize: '13px', fontWeight: '500', color: '#17233C' }}>Search:</label>
              <input
                type="text"
                placeholder={`Search ${clientLabel.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: '8px 14px', border: '1px solid #DCE1EC', borderRadius: '12px', fontSize: '14px', fontFamily: 'inherit', width: '100%' }}
              />
            </div>
          </div>
        </div>

        <div className="professional-stats-grid">
          <div className="professional-stat-card">
            <h3 className="professional-stat-number">{reportData.totalClients}</h3>
            <p className="professional-stat-label">Total {clientLabel}</p>
          </div>
          <div className="professional-stat-card">
            <h3 className="professional-stat-number">{reportData.avgScore}</h3>
            <p className="professional-stat-label">Average Score</p>
          </div>
          <div className="professional-stat-card">
            <h3 className="professional-stat-number">{reportData.totalAssessments}</h3>
            <p className="professional-stat-label">Total Assessments</p>
          </div>
          <div className="professional-stat-card">
            <h3 className="professional-stat-number">{reportData.adherenceRate}%</h3>
            <p className="professional-stat-label">Avg Adherence (7 days)</p>
          </div>
          <div className="professional-stat-card">
            <h3 className="professional-stat-number">{reportData.activeRoutines}</h3>
            <p className="professional-stat-label">Active {routineLabel}</p>
          </div>
        </div>

        <div className="professional-surface">
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#17233C', marginTop: 0, marginBottom: '16px', borderBottom: '1px solid #E7EAF1', paddingBottom: '12px' }}>
            Score Distribution
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ height: '8px', borderRadius: '4px', minWidth: '4px', flex: 1, backgroundColor: userRole === 'dermatologist' ? '#6c63d9' : '#0d9488', width: `${(reportData.scoreDistribution.excellent / Math.max(1, reportData.totalClients)) * 100}%` }}></div>
              <span style={{ fontSize: '13px', color: '#17233C', minWidth: '200px' }}>Excellent (80-100): {reportData.scoreDistribution.excellent}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ height: '8px', borderRadius: '4px', minWidth: '4px', flex: 1, backgroundColor: '#6c63d9', width: `${(reportData.scoreDistribution.good / Math.max(1, reportData.totalClients)) * 100}%` }}></div>
              <span style={{ fontSize: '13px', color: '#17233C', minWidth: '200px' }}>Good (60-79): {reportData.scoreDistribution.good}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ height: '8px', borderRadius: '4px', minWidth: '4px', flex: 1, backgroundColor: '#d97706', width: `${(reportData.scoreDistribution.fair / Math.max(1, reportData.totalClients)) * 100}%` }}></div>
              <span style={{ fontSize: '13px', color: '#17233C', minWidth: '200px' }}>Fair (40-59): {reportData.scoreDistribution.fair}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ height: '8px', borderRadius: '4px', minWidth: '4px', flex: 1, backgroundColor: '#dc2626', width: `${(reportData.scoreDistribution.poor / Math.max(1, reportData.totalClients)) * 100}%` }}></div>
              <span style={{ fontSize: '13px', color: '#17233C', minWidth: '200px' }}>Poor (0-39): {reportData.scoreDistribution.poor}</span>
            </div>
          </div>
        </div>

        <div className="professional-surface">
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#17233C', marginTop: 0, marginBottom: '16px', borderBottom: '1px solid #E7EAF1', paddingBottom: '12px' }}>
            Top Skin {userRole === 'dermatologist' ? 'Conditions' : 'Concerns'}
          </h3>
          {reportData.topConcerns.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {reportData.topConcerns.map((concern, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '13px', color: '#17233C', minWidth: '150px' }}>{concern.name}</span>
                  <div style={{ flex: 1, height: '8px', backgroundColor: '#F5F7FB', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', backgroundColor: userRole === 'dermatologist' ? '#6c63d9' : '#0d9488', borderRadius: '4px', width: `${(concern.count / Math.max(1, reportData.totalClients)) * 100}%` }}></div>
                  </div>
                  <span style={{ fontSize: '12px', color: '#778198', minWidth: '70px', textAlign: 'right' }}>{concern.count} {clientLabel.toLowerCase()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#778198', padding: '20px 0', fontSize: '14px' }}>No concerns data available.</p>
          )}
        </div>

        <div className="professional-surface">
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#17233C', marginTop: 0, marginBottom: '16px', borderBottom: '1px solid #E7EAF1', paddingBottom: '12px' }}>
            {clientLabel} Summary ({filteredClients.length} {clientLabel.toLowerCase()})
          </h3>
          <table className="professional-table">
            <thead>
              <tr>
                <th>{userRole === 'dermatologist' ? 'Patient' : 'Client'}</th>
                <th>Status</th>
                <th>Score</th>
                <th>Adherence</th>
                <th>Assessments</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.slice(0, 10).map((client) => (
                <tr key={client.request_id || client.user_id}>
                  <td>{client.user_name || 'Unknown'}</td>
                  <td>
                    <span className={client.status === 'Active' ? 'status-active' : client.status === 'Follow-up Due' ? 'status-followup' : 'status-pending'}>
                      {client.status || 'Pending'}
                    </span>
                  </td>
                  <td>
                    <span className={client.score >= 70 ? 'score-good' : client.score >= 50 ? 'score-fair' : 'score-bad'}>
                      {client.score ? `${client.score}/100` : '—'}
                    </span>
                  </td>
                  <td>{client.adherence || 0}%</td>
                  <td>{client.assessmentDate ? '✅' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredClients.length > 10 && (
            <button style={{ background: 'none', border: 'none', color: userRole === 'dermatologist' ? '#6c63d9' : '#0d9488', fontSize: '13px', cursor: 'pointer', padding: '8px 0 0', fontWeight: '600', fontFamily: 'inherit' }} onClick={() => navigateTo(userRole === 'dermatologist' ? '/dermatologist/patients' : '/consultant/clients')}>
              View All {clientLabel} →
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

export default ConsultantReports;