// frontend/src/pages/ConsultantAssessments.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ProfessionalSidebar from '../components/ProfessionalSidebar';
import '../styles/professional-theme.css';

function ConsultantAssessments() {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [filteredAssessments, setFilteredAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('consultant');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

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
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role') || 'consultant';

    try {
      // Use different endpoints based on role
      let endpoint = '/consultant/assessments';
      if (role === 'dermatologist') {
        endpoint = '/dermatologist/assessments';
      }

      const response = await api.get(endpoint, { params: { token } });
      const assessmentList = response.data || [];

      const allAssessments = assessmentList.map(item => ({
        id: item.id || `assess_${item.user_id}`,
        clientId: item.user_id,
        clientName: item.client_name || item.patient_name || 'Unknown',
        date: item.created_at || new Date().toISOString(),
        score: item.score,
        primaryConcern: item.primary_concern || item.detected_concerns?.[0] || 'No concern detected',
        breakdown: item.breakdown || {},
        detectedConcerns: item.detected_concerns || [],
        status: item.status || 'Awaiting Review'
      }));

      allAssessments.sort((a, b) => new Date(b.date) - new Date(a.date));
      setAssessments(allAssessments);
      setFilteredAssessments(allAssessments);

    } catch (err) {
      console.error('Failed to fetch assessments:', err);
      setError('Could not load assessments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    const filtered = assessments.filter(a => 
      a.clientName.toLowerCase().includes(term)
    );
    setFilteredAssessments(filtered);
  };

  const openDetail = (assessment) => {
    setSelectedAssessment(assessment);
    setShowDetailModal(true);
  };

  const closeDetail = () => {
    setShowDetailModal(false);
    setSelectedAssessment(null);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const navigateTo = (path) => {
    navigate(path);
  };

  // Dynamic labels
  const pageTitle = userRole === 'dermatologist' ? '🔍 Patient Assessments' : '🔍 Assessments';
  const pageSubtitle = userRole === 'dermatologist' ? 'Review all patient skin assessments in one place.' : 'Review all client skin assessments in one place.';
  const tableHeader = userRole === 'dermatologist' ? 'Patient' : 'Client';
  const profileLabel = userRole === 'dermatologist' ? 'Patient Profile' : 'Client Profile';

  if (loading) {
    return (
      <div className="professional-loading-page">
        <div className="professional-loading-spinner"></div>
        <p>Loading assessments...</p>
      </div>
    );
  }

  return (
    <div className={`professional-page role-${userRole}`}>
      <ProfessionalSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main className={`professional-main ${sidebarOpen ? '' : 'is-collapsed'}`}>
        <div className="professional-header">
          <div>
            <div className="professional-kicker">{userRole === 'dermatologist' ? 'PATIENT ASSESSMENTS' : 'ASSESSMENTS'}</div>
            <h1 className="professional-title">{pageTitle}</h1>
            <p className="professional-subtitle">{pageSubtitle}</p>
          </div>
        </div>

        {error && <div className="professional-alert-error">{error}</div>}

        <div className="professional-surface">
          <input
            type="text"
            placeholder={`Search by ${userRole === 'dermatologist' ? 'patient' : 'client'} name...`}
            value={searchTerm}
            onChange={handleSearch}
            style={{ width: '100%', padding: '10px 14px', border: '1px solid #DCE1EC', borderRadius: '12px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
          />
          <div style={{ marginTop: '10px', fontSize: '13px', color: '#778198' }}>
            <span>Showing {filteredAssessments.length} of {assessments.length} assessments</span>
          </div>
        </div>

        <div className="professional-surface">
          {assessments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ fontSize: '48px', marginBottom: '10px' }}>📋</p>
              <p style={{ fontSize: '18px', fontWeight: '600', color: '#17233C' }}>No assessments found</p>
              <p style={{ fontSize: '14px', color: '#778198' }}>
                {userRole === 'dermatologist' ? "Your patients haven't completed any assessments yet." : "Your clients haven't completed any assessments yet."}
              </p>
            </div>
          ) : (
            <table className="professional-table">
              <thead>
                <tr>
                  <th>{tableHeader}</th>
                  <th>Date</th>
                  <th>Score</th>
                  <th>Primary Concern</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssessments.map((assessment) => (
                  <tr key={assessment.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: userRole === 'dermatologist' ? '#6c63d9' : '#0d9488', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '13px', flexShrink: 0 }}>
                          {assessment.clientName?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <span style={{ fontWeight: '500', color: '#17233C' }}>{assessment.clientName}</span>
                      </div>
                    </td>
                    <td>{new Date(assessment.date).toLocaleDateString()}</td>
                    <td>
                      <span className={assessment.score >= 70 ? 'score-good' : assessment.score >= 50 ? 'score-fair' : 'score-bad'}>
                        {assessment.score}/100
                      </span>
                    </td>
                    <td>{assessment.primaryConcern}</td>
                    <td>
                      <span className={assessment.status === 'Reviewed' ? 'status-active' : 'status-pending'}>
                        {assessment.status}
                      </span>
                    </td>
                    <td>
                      <button 
                        onClick={() => openDetail(assessment)} 
                        style={{ padding: '6px 14px', backgroundColor: userRole === 'dermatologist' ? '#6c63d9' : '#0d9488', color: '#FFFFFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit', fontWeight: '600' }}
                      >
                        View Details →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Detail Modal */}
      {showDetailModal && selectedAssessment && (
        <div style={styles.modalOverlay} onClick={closeDetail}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button style={styles.modalClose} onClick={closeDetail}>✕</button>
            <h2 style={styles.modalTitle}>Assessment Details — {selectedAssessment.clientName}</h2>

            <div style={styles.modalSection}>
              <h4 style={styles.sectionTitle}>📊 Score Breakdown</h4>
              <p style={styles.scoreDisplay}>{selectedAssessment.score}/100</p>
              {selectedAssessment.breakdown && Object.keys(selectedAssessment.breakdown).length > 0 && (
                <div style={styles.breakdownList}>
                  {Object.entries(selectedAssessment.breakdown).map(([key, value]) => (
                    <div key={key} style={styles.breakdownRow}>
                      <span>{key.replace(/_/g, ' ')}</span>
                      <div style={styles.breakdownBar}><div style={{...styles.breakdownFill, width: `${value}%`}} /></div>
                      <span>{Math.round(value)}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={styles.modalSection}>
              <h4 style={styles.sectionTitle}>🔬 Detected Concerns</h4>
              {selectedAssessment.detectedConcerns?.length > 0 ? (
                <div style={styles.concernTags}>
                  {selectedAssessment.detectedConcerns.map((concern, i) => (
                    <span key={i} style={styles.concernTag}>{concern}</span>
                  ))}
                </div>
              ) : (
                <p style={styles.emptyText}>No concerns detected</p>
              )}
            </div>

            <div style={styles.modalSection}>
              <button style={{ ...styles.modalActionBtn, backgroundColor: userRole === 'dermatologist' ? '#6c63d9' : '#0d9488' }} onClick={() => {
                closeDetail();
                navigate(userRole === 'dermatologist' ? '/dermatologist/patients' : '/consultant/clients');
              }}>
                👤 View {userRole === 'dermatologist' ? 'Patient' : 'Client'} Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(23,35,60,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '20px',
    backdropFilter: 'blur(4px)',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    maxWidth: '720px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    padding: '30px',
    position: 'relative',
    border: '1px solid #E7EAF1',
    boxShadow: '0 24px 60px rgba(23,35,60,0.15)',
  },
  modalClose: {
    position: 'absolute',
    top: '12px',
    right: '16px',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#778198',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#17233C',
    marginBottom: '20px',
  },
  modalSection: {
    marginBottom: '20px',
    paddingBottom: '18px',
    borderBottom: '1px solid #F0F2F6',
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#778198',
    marginBottom: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  scoreDisplay: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#0d9488',
    margin: '0 0 12px',
  },
  breakdownList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  breakdownRow: {
    display: 'grid',
    gridTemplateColumns: '130px 1fr 40px',
    alignItems: 'center',
    gap: '10px',
    fontSize: '12px',
    color: '#34415B',
    textTransform: 'capitalize',
  },
  breakdownBar: {
    height: '6px',
    backgroundColor: '#E7EAF1',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  breakdownFill: {
    height: '100%',
    backgroundColor: '#0d9488',
    borderRadius: '3px',
  },
  concernTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  concernTag: {
    padding: '4px 12px',
    backgroundColor: '#F5F7FB',
    borderRadius: '20px',
    fontSize: '13px',
    color: '#17233C',
  },
  modalActionBtn: {
    padding: '10px 20px',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontFamily: 'inherit',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#778198',
    padding: '12px 0',
    fontSize: '14px',
  },
};

export default ConsultantAssessments;