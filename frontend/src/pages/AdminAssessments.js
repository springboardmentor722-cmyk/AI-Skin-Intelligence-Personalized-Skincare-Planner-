// frontend/src/pages/AdminAssessments.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import AdminSidebar from '../components/AdminSidebar';
import '../styles/admin-theme.css';

function AdminAssessments() {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [filteredAssessments, setFilteredAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState('/admin/assessments');
  const [userName, setUserName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    const name = localStorage.getItem('userName');
    setUserName(name || 'Admin');
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');

    try {
      const res = await api.get('/admin/assessments/all', { params: { token, limit: 200 } });
      setAssessments(res.data.assessments || []);
      setFilteredAssessments(res.data.assessments || []);
      setTotalCount(res.data.total || 0);
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
    if (term) {
      const filtered = assessments.filter(a =>
        a.user_name.toLowerCase().includes(term) ||
        a.user_email.toLowerCase().includes(term) ||
        (a.detected_concerns || []).some(c => c.toLowerCase().includes(term))
      );
      setFilteredAssessments(filtered);
    } else {
      setFilteredAssessments(assessments);
    }
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
    setActiveMenu(path);
    navigate(path);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#DC2626';
  };

  if (loading) {
    return (
      <div className="admin-loading-page">
        <div className="admin-loading-spinner"></div>
        <p>Loading assessments...</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <AdminSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main className={`admin-main ${sidebarOpen ? '' : 'is-collapsed'}`}>
        <div className="admin-header">
          <div>
            <div className="admin-kicker">SKIN ASSESSMENTS</div>
            <h1 className="admin-title">🔍 Skin Assessments</h1>
            <p className="admin-subtitle">View all assessments across the platform. Total: {totalCount}</p>
          </div>
          <div style={styles.topBarRight}>
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
            <input
              type="text"
              placeholder="Search by user name, email, or concern..."
              value={searchTerm}
              onChange={handleSearch}
              style={styles.searchInput}
            />
          </div>
          <div style={styles.filterStats}>
            <span>Showing {filteredAssessments.length} of {totalCount} assessments</span>
          </div>
        </div>

        <div className="admin-surface">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Skin Type</th>
                <th>Score</th>
                <th>Concerns</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssessments.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{...styles.td, textAlign: 'center', color: '#778198' }}>
                    No assessments found.
                  </td>
                </tr>
              ) : (
                filteredAssessments.map((assessment) => (
                  <tr key={assessment.id}>
                    <td style={styles.td}>
                      <div>
                        <div style={styles.userName}>{assessment.user_name}</div>
                        <div style={styles.userEmail}>{assessment.user_email}</div>
                      </div>
                    </td>
                    <td style={styles.td}>{assessment.skin_type || 'Unknown'}</td>
                    <td style={styles.td}>
                      <span style={{...styles.scoreBadge, backgroundColor: getScoreColor(assessment.score)}}>
                        {assessment.score}/100
                      </span>
                    </td>
                    <td style={styles.td}>
                      {assessment.detected_concerns?.length > 0 ? (
                        <div style={styles.concernTags}>
                          {assessment.detected_concerns.slice(0, 3).map((c, i) => (
                            <span key={i} style={styles.concernTag}>{c}</span>
                          ))}
                          {assessment.detected_concerns.length > 3 && (
                            <span style={styles.concernTag}>+{assessment.detected_concerns.length - 3}</span>
                          )}
                        </div>
                      ) : (
                        <span style={styles.noConcern}>No concerns</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      {assessment.created_at ? new Date(assessment.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={styles.td}>
                      <button style={{...styles.viewBtn, backgroundColor: '#0d9488' }} onClick={() => openDetail(assessment)}>
                        View Details →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {showDetailModal && selectedAssessment && (
        <div style={styles.modalOverlay} onClick={closeDetail}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button style={styles.modalClose} onClick={closeDetail}>✕</button>
            <h2 style={styles.modalTitle}>Assessment Details — {selectedAssessment.user_name}</h2>

            <div style={styles.modalSection}>
              <div style={styles.modalGrid}>
                <div><strong>User:</strong> {selectedAssessment.user_name}</div>
                <div><strong>Email:</strong> {selectedAssessment.user_email}</div>
                <div><strong>Skin Type:</strong> {selectedAssessment.skin_type || 'Unknown'}</div>
                <div><strong>Score:</strong> <span style={{color: getScoreColor(selectedAssessment.score)}}>{selectedAssessment.score}/100</span></div>
                <div><strong>Date:</strong> {selectedAssessment.created_at ? new Date(selectedAssessment.created_at).toLocaleString() : 'N/A'}</div>
              </div>
            </div>

            {selectedAssessment.breakdown && Object.keys(selectedAssessment.breakdown).length > 0 && (
              <div style={styles.modalSection}>
                <h4 style={styles.sectionTitle}>Score Breakdown</h4>
                <div style={styles.breakdownList}>
                  {Object.entries(selectedAssessment.breakdown).map(([key, value]) => {
                    if (key === 'overall' || key === 'trend') return null;
                    return (
                      <div key={key} style={styles.breakdownRow}>
                        <span style={styles.breakdownLabel}>{key.replace(/_/g, ' ')}</span>
                        <div style={styles.breakdownBar}>
                          <div style={{...styles.breakdownFill, backgroundColor: '#0d9488', width: `${value}%`}} />
                        </div>
                        <span style={styles.breakdownValue}>{Math.round(value)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedAssessment.detected_concerns?.length > 0 && (
              <div style={styles.modalSection}>
                <h4 style={styles.sectionTitle}>Detected Concerns</h4>
                <div style={styles.concernTags}>
                  {selectedAssessment.detected_concerns.map((c, i) => (
                    <span key={i} style={styles.concernTagLarge}>{c}</span>
                  ))}
                </div>
              </div>
            )}

            <div style={styles.modalActions}>
              <button style={styles.closeModalBtn} onClick={closeDetail}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  topBarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flexWrap: 'wrap'
  },
  dateChip: {
    background: '#FFFFFF',
    border: '1px solid #E7EAF1',
    borderRadius: '12px',
    padding: '8px 14px',
    fontSize: '13px',
    color: '#374151'
  },
  profileChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
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
    fontSize: '15px'
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
    boxShadow: '0 14px 38px rgba(23,35,60,0.07)',
    marginBottom: '20px'
  },
  filterRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    alignItems: 'center'
  },
  searchInput: {
    flex: 1,
    padding: '10px 14px',
    border: '1px solid #DCE1EC',
    borderRadius: '12px',
    fontSize: '14px',
    fontFamily: 'inherit',
    minWidth: '200px',
    outline: 'none',
    backgroundColor: '#FBFCFE'
  },
  filterStats: {
    fontSize: '13px',
    color: '#778198',
    marginTop: '10px'
  },
  td: {
    padding: '12px 8px',
    borderBottom: '1px solid #F0F2F6',
    color: '#17233C',
    verticalAlign: 'middle'
  },
  userName: {
    fontWeight: '500',
    color: '#17233C'
  },
  userEmail: {
    fontSize: '11px',
    color: '#778198'
  },
  scoreBadge: {
    padding: '2px 10px',
    borderRadius: '12px',
    fontSize: '13px',
    color: '#FFFFFF',
    fontWeight: '600'
  },
  concernTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px'
  },
  concernTag: {
    padding: '2px 8px',
    backgroundColor: '#F5F7FB',
    borderRadius: '12px',
    fontSize: '11px',
    color: '#17233C'
  },
  concernTagLarge: {
    padding: '4px 12px',
    backgroundColor: '#F5F7FB',
    borderRadius: '12px',
    fontSize: '13px',
    color: '#17233C'
  },
  noConcern: {
    color: '#9CA3AF',
    fontSize: '12px'
  },
  viewBtn: {
    padding: '6px 14px',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '12px',
    fontFamily: 'inherit',
    fontWeight: '600'
  },
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
    backdropFilter: 'blur(4px)'
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    maxWidth: '600px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    padding: '30px',
    position: 'relative',
    border: '1px solid #E7EAF1',
    boxShadow: '0 24px 60px rgba(23,35,60,0.15)'
  },
  modalClose: {
    position: 'absolute',
    top: '12px',
    right: '16px',
    background: 'none',
    border: 'none',
    fontSize: '22px',
    cursor: 'pointer',
    color: '#778198'
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#17233C',
    marginBottom: '20px'
  },
  modalSection: {
    marginBottom: '20px',
    paddingBottom: '18px',
    borderBottom: '1px solid #F0F2F6'
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#778198',
    marginBottom: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.3px'
  },
  modalGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    fontSize: '14px'
  },
  breakdownList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  breakdownRow: {
    display: 'grid',
    gridTemplateColumns: '130px 1fr 40px',
    alignItems: 'center',
    gap: '10px',
    fontSize: '12px',
    color: '#374151',
    textTransform: 'capitalize'
  },
  breakdownBar: {
    height: '6px',
    backgroundColor: '#E7EAF1',
    borderRadius: '3px',
    overflow: 'hidden'
  },
  breakdownFill: {
    height: '100%',
    borderRadius: '3px'
  },
  breakdownValue: {
    fontSize: '12px',
    color: '#17233C',
    textAlign: 'right'
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '16px'
  },
  closeModalBtn: {
    padding: '10px 20px',
    backgroundColor: '#F5F7FB',
    color: '#778198',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontFamily: 'inherit'
  }
};

export default AdminAssessments;