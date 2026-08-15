// frontend/src/pages/ConsultantClients.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ProfessionalSidebar from '../components/ProfessionalSidebar';
import '../styles/professional-theme.css';

function ConsultantClients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('consultant');

  const statuses = ['All', 'Active', 'Follow-up Due', 'Needs Attention', 'Pending'];

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
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role') || 'consultant';

    try {
      // Use different endpoints based on role
      let endpoint = '/consultant/reviews';
      if (role === 'dermatologist') {
        endpoint = '/dermatologist/patients';
      }

      const clientsRes = await api.get(endpoint, { params: { token } });
      let clientList = clientsRes.data || [];

      const enrichedClients = [];

      for (const client of clientList) {
        try {
          const profileRes = await api.get('/user/profile', {
            params: { token, user_id: client.user_id }
          });
          const profile = profileRes.data;

          let assessment = null;
          let score = null;
          let detectedConcerns = [];
          let createdAt = null;
          try {
            const scoreRes = await api.get('/api/v1/assessment/score', {
              params: { token, user_id: client.user_id }
            });
            if (scoreRes.data && scoreRes.data.score) {
              assessment = scoreRes.data;
              score = assessment.score;
              detectedConcerns = assessment.detected_concerns || [];
              createdAt = assessment.created_at;
            }
          } catch (e) {}

          let aiResults = null;
          try {
            const aiRes = await api.get('/api/v1/ai-analysis/latest', {
              params: { token, user_id: client.user_id }
            });
            if (aiRes.data && aiRes.data.has_results) {
              aiResults = aiRes.data;
            }
          } catch (e) {}

          enrichedClients.push({
            ...client,
            profile,
            assessment,
            score,
            detectedConcerns,
            aiResults,
            createdAt,
            status: score >= 70 ? 'Active' : score >= 50 ? 'Follow-up Due' : 'Needs Attention'
          });

        } catch (err) {
          console.error('Error fetching client data:', err);
          enrichedClients.push({
            ...client,
            profile: null,
            assessment: null,
            score: null,
            detectedConcerns: [],
            aiResults: null,
            status: 'Pending'
          });
        }
      }

      setClients(enrichedClients);
      setFilteredClients(enrichedClients);

    } catch (err) {
      console.error('Failed to fetch clients:', err);
      setError('Could not load clients. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    applyFilters(term, statusFilter);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    applyFilters(searchTerm, status);
  };

  const applyFilters = (term, status) => {
    let filtered = clients;

    if (term) {
      filtered = filtered.filter(c =>
        (c.user_name || c.profile?.full_name || '').toLowerCase().includes(term)
      );
    }

    if (status !== 'All') {
      filtered = filtered.filter(c => c.status === status);
    }

    setFilteredClients(filtered);
  };

  const openDetail = (client) => {
    setSelectedClient(client);
    setShowDetailModal(true);
  };

  const closeDetail = () => {
    setShowDetailModal(false);
    setSelectedClient(null);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const navigateTo = (path) => {
    navigate(path);
  };

  // Dynamic labels based on role
  const pageTitle = userRole === 'dermatologist' ? '👤 My Patients' : '👤 My Clients';
  const pageSubtitle = userRole === 'dermatologist' ? 'Manage all your patients in one place.' : 'Manage all your clients in one place.';
  const tableHeader = userRole === 'dermatologist' ? 'Patient' : 'Client';
  const profileLabel = userRole === 'dermatologist' ? 'Patient Profile' : 'Client Profile';

  if (loading) {
    return (
      <div className="professional-loading-page">
        <div className="professional-loading-spinner"></div>
        <p>Loading {userRole === 'dermatologist' ? 'patients' : 'clients'}...</p>
      </div>
    );
  }

  return (
    <div className={`professional-page role-${userRole}`}>
      <ProfessionalSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main className={`professional-main ${sidebarOpen ? '' : 'is-collapsed'}`}>
        <div className="professional-header">
          <div>
            <div className="professional-kicker">{userRole === 'dermatologist' ? 'PATIENTS' : 'CLIENTS'}</div>
            <h1 className="professional-title">{pageTitle}</h1>
            <p className="professional-subtitle">{pageSubtitle}</p>
          </div>
        </div>

        {error && <div className="professional-alert-error">{error}</div>}

        <div className="professional-surface">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '10px' }}>
            <input
              type="text"
              placeholder={`Search by ${userRole === 'dermatologist' ? 'patient' : 'client'} name...`}
              value={searchTerm}
              onChange={handleSearch}
              style={{ flex: 1, padding: '10px 14px', border: '1px solid #DCE1EC', borderRadius: '12px', fontSize: '14px', fontFamily: 'inherit', minWidth: '200px', outline: 'none' }}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {statuses.map(status => (
                <button
                  key={status}
                  style={{ 
                    padding: '6px 14px', 
                    backgroundColor: statusFilter === status ? (userRole === 'dermatologist' ? '#6c63d9' : '#0d9488') : '#F5F7FB', 
                    color: statusFilter === status ? '#FFFFFF' : '#778198',
                    border: 'none', 
                    borderRadius: '20px', 
                    cursor: 'pointer', 
                    fontSize: '12px', 
                    fontFamily: 'inherit' 
                  }}
                  onClick={() => handleStatusFilter(status)}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
          <div style={{ fontSize: '13px', color: '#778198' }}>
            <span>Showing {filteredClients.length} of {clients.length} {userRole === 'dermatologist' ? 'patients' : 'clients'}</span>
          </div>
        </div>

        <div className="professional-surface">
          <table className="professional-table">
            <thead>
              <tr>
                <th>{tableHeader}</th>
                <th>Skin Type</th>
                <th>Top Concern</th>
                <th>Score</th>
                <th>Last Assessment</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: '#778198', padding: '20px 0' }}>
                    No {userRole === 'dermatologist' ? 'patients' : 'clients'} found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.request_id || client.user_id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: '500', color: '#17233C' }}>{client.user_name || client.profile?.full_name || 'Unknown'}</div>
                        {client.profile?.age && (
                          <div style={{ fontSize: '11px', color: '#778198' }}>{client.profile.age} yrs • {client.profile.gender || 'N/A'}</div>
                        )}
                      </div>
                    </td>
                    <td>{client.profile?.skin_type || '—'}</td>
                    <td>
                      {client.detectedConcerns?.length > 0
                        ? client.detectedConcerns.slice(0, 2).join(', ')
                        : client.profile?.skin_concerns || '—'}
                    </td>
                    <td>
                      <span className={client.score >= 70 ? 'score-good' : client.score >= 50 ? 'score-fair' : 'score-bad'}>
                        {client.score ? `${client.score}/100` : '—'}
                      </span>
                    </td>
                    <td>
                      {client.createdAt
                        ? new Date(client.createdAt).toLocaleDateString()
                        : '—'}
                    </td>
                    <td>
                      <span className={client.status === 'Active' ? 'status-active' : client.status === 'Follow-up Due' ? 'status-followup' : 'status-pending'}>
                        {client.status}
                      </span>
                    </td>
                    <td>
                      <button 
                        onClick={() => openDetail(client)} 
                        style={{ padding: '6px 14px', backgroundColor: userRole === 'dermatologist' ? '#6c63d9' : '#0d9488', color: '#FFFFFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit', fontWeight: '600' }}
                      >
                        View Profile →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Detail Modal */}
      {showDetailModal && selectedClient && (
        <div style={styles.modalOverlay} onClick={closeDetail}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button style={styles.modalClose} onClick={closeDetail}>✕</button>
            <h2 style={styles.modalTitle}>{profileLabel} — {selectedClient.user_name}</h2>

            {selectedClient.profile && (
              <div style={styles.modalSection}>
                <h4 style={styles.sectionTitle}>👤 Profile</h4>
                <div style={styles.profileGrid}>
                  <div><strong>Name:</strong> {selectedClient.profile.full_name}</div>
                  <div><strong>Age:</strong> {selectedClient.profile.age}</div>
                  <div><strong>Gender:</strong> {selectedClient.profile.gender}</div>
                  <div><strong>Skin Type:</strong> {selectedClient.profile.skin_type}</div>
                  <div><strong>Concerns:</strong> {selectedClient.profile.skin_concerns || 'None'}</div>
                  <div><strong>Water Intake:</strong> {selectedClient.profile.water_intake}L</div>
                  <div><strong>Sleep:</strong> {selectedClient.profile.sleep_duration}h</div>
                  <div><strong>Stress Level:</strong> {selectedClient.profile.stress_level}</div>
                </div>
              </div>
            )}

            {selectedClient.aiResults && selectedClient.aiResults.image_url && (
              <div style={styles.modalSection}>
                <h4 style={styles.sectionTitle}>📸 AI Analysis</h4>
                <img
                  src={selectedClient.aiResults.image_url}
                  alt="AI Analysis"
                  style={styles.aiPhoto}
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/200x200/0d9488/ffffff?text=No+Image'; }}
                />
                {selectedClient.aiResults.predicted_concern && (
                  <p style={styles.aiResultText}>
                    <strong>AI Detected:</strong> {selectedClient.aiResults.predicted_concern}
                    ({selectedClient.aiResults.confidence}% confidence)
                  </p>
                )}
              </div>
            )}

            {selectedClient.assessment && (
              <div style={styles.modalSection}>
                <h4 style={styles.sectionTitle}>📊 Assessment</h4>
                <p style={styles.scoreDisplay}>{selectedClient.assessment.score}/100</p>
                {selectedClient.assessment.breakdown && (
                  <div style={styles.breakdownList}>
                    {Object.entries(selectedClient.assessment.breakdown).map(([key, value]) => (
                      <div key={key} style={styles.breakdownRow}>
                        <span>{key.replace(/_/g, ' ')}</span>
                        <div style={styles.breakdownBar}><div style={{...styles.breakdownFill, width: `${value}%`}} /></div>
                        <span>{Math.round(value)}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={styles.modalSection}>
              <button style={{ ...styles.modalActionBtn, backgroundColor: userRole === 'dermatologist' ? '#6c63d9' : '#0d9488' }} onClick={() => {
                closeDetail();
                navigate(userRole === 'dermatologist' ? '/dermatologist/treatment-plans' : '/consultant/routines');
              }}>
                {userRole === 'dermatologist' ? '📋 Manage Treatment' : '📋 Manage Routine'}
              </button>
              <button style={{ ...styles.modalActionBtn, backgroundColor: userRole === 'dermatologist' ? '#6c63d9' : '#0d9488' }} onClick={() => {
                closeDetail();
                navigate('/consultant/progress');
              }}>
                📈 View Progress
              </button>
              <button style={{ ...styles.modalActionBtn, backgroundColor: userRole === 'dermatologist' ? '#6c63d9' : '#0d9488' }} onClick={() => {
                closeDetail();
                navigate('/consultant/recommend');
              }}>
                🛍️ Recommend Product
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
  profileGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    fontSize: '13px',
    color: '#17233C',
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
  aiPhoto: {
    maxWidth: '200px',
    maxHeight: '200px',
    borderRadius: '12px',
    border: '1px solid #E7EAF1',
    objectFit: 'cover',
    marginBottom: '8px',
  },
  aiResultText: {
    fontSize: '13px',
    color: '#17233C',
    margin: 0,
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
    marginRight: '10px',
    marginBottom: '10px',
  },
};

export default ConsultantClients;