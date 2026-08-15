// frontend/src/pages/AdminRolePermissions.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import AdminSidebar from '../components/AdminSidebar';
import '../styles/admin-theme.css';

function AdminRolePermissions() {
  const navigate = useNavigate();
  const [pendingProfessionals, setPendingProfessionals] = useState([]);
  const [filteredProfessionals, setFilteredProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState('/admin/role-permissions');
  const [userName, setUserName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [approving, setApproving] = useState(null);
  const [rejecting, setRejecting] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    const name = localStorage.getItem('userName');
    setUserName(name || 'Admin');
    fetchPendingProfessionals();
  }, []);

  const fetchPendingProfessionals = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');

    try {
      const res = await api.get('/admin/professionals/pending', { params: { token } });
      setPendingProfessionals(res.data || []);
      setFilteredProfessionals(res.data || []);
    } catch (err) {
      console.error('Failed to fetch pending professionals:', err);
      setError('Could not load pending professionals. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    applyFilters(term, typeFilter);
  };

  const handleTypeFilter = (type) => {
    setTypeFilter(type);
    applyFilters(searchTerm, type);
  };

  const applyFilters = (term, type) => {
    let filtered = pendingProfessionals;

    if (term) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.email.toLowerCase().includes(term) ||
        p.specialization.toLowerCase().includes(term)
      );
    }

    if (type !== 'All') {
      filtered = filtered.filter(p => p.type === type);
    }

    setFilteredProfessionals(filtered);
  };

  const handleApprove = async (profile) => {
    setApproving(profile.id);
    try {
      const token = localStorage.getItem('token');
      await api.put(`/admin/approve-professional/${profile.id}`, {}, { params: { token } });
      alert(`✅ ${profile.name} approved successfully!`);
      fetchPendingProfessionals();
    } catch (err) {
      alert('Failed to approve: ' + (err.response?.data?.detail || 'Unknown error'));
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async (profile) => {
    if (!window.confirm(`Are you sure you want to reject ${profile.name}?`)) return;
    
    setRejecting(profile.id);
    try {
      const token = localStorage.getItem('token');
      await api.put(`/admin/reject-professional/${profile.id}`, {}, { params: { token } });
      alert(`❌ ${profile.name} rejected successfully!`);
      fetchPendingProfessionals();
    } catch (err) {
      alert('Failed to reject: ' + (err.response?.data?.detail || 'Unknown error'));
    } finally {
      setRejecting(null);
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
        <p>Loading pending professionals...</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <AdminSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main className={`admin-main ${sidebarOpen ? '' : 'is-collapsed'}`}>
        <div className="admin-header">
          <div>
            <div className="admin-kicker">ROLE & PERMISSIONS</div>
            <h1 className="admin-title">🔑 Role & Permissions</h1>
            <p className="admin-subtitle">Review and approve professional registrations.</p>
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
              placeholder="Search by name, email, or specialization..."
              value={searchTerm}
              onChange={handleSearch}
              style={styles.searchInput}
            />
            <div style={styles.typeFilters}>
              <button
                style={{...styles.typeBtn, ...(typeFilter === 'All' ? {...styles.typeBtnActive, backgroundColor: '#0d9488'} : {})}}
                onClick={() => handleTypeFilter('All')}
              >
                All
              </button>
              <button
                style={{...styles.typeBtn, ...(typeFilter === 'consultant' ? {...styles.typeBtnActive, backgroundColor: '#0d9488'} : {})}}
                onClick={() => handleTypeFilter('consultant')}
              >
                Consultants
              </button>
              <button
                style={{...styles.typeBtn, ...(typeFilter === 'dermatologist' ? {...styles.typeBtnActive, backgroundColor: '#0d9488'} : {})}}
                onClick={() => handleTypeFilter('dermatologist')}
              >
                Dermatologists
              </button>
            </div>
          </div>
          <div style={styles.filterStats}>
            <span>Showing {filteredProfessionals.length} of {pendingProfessionals.length} pending professionals</span>
          </div>
        </div>

        <div className="admin-surface">
          {filteredProfessionals.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={styles.emptyIcon}>✅</p>
              <p style={styles.emptyText}>No pending professionals</p>
              <p style={styles.emptySubtext}>All professionals have been reviewed.</p>
            </div>
          ) : (
            <div style={styles.professionalsList}>
              {filteredProfessionals.map((prof) => (
                <div key={prof.id} style={styles.professionalCard}>
                  <div style={styles.professionalHeader}>
                    <div style={styles.professionalInfo}>
                      <div style={styles.professionalName}>
                        {prof.name}
                        <span style={prof.type === 'consultant' ? styles.badgeConsultant : styles.badgeDermatologist}>
                          {prof.type === 'consultant' ? '🧴 Consultant' : '🩺 Dermatologist'}
                        </span>
                      </div>
                      <div style={styles.professionalEmail}>📧 {prof.email}</div>
                      <div style={styles.professionalPhone}>📞 {prof.phone || 'Not provided'}</div>
                    </div>
                    <div style={styles.professionalStatus}>
                      <span style={styles.statusPending}>⏳ Pending Review</span>
                    </div>
                  </div>

                  <div style={styles.professionalDetails}>
                    <div style={styles.detailGrid}>
                      <div style={styles.detailItem}>
                        <span style={styles.detailLabel}>Specialization</span>
                        <span style={styles.detailValue}>{prof.specialization || 'Not specified'}</span>
                      </div>
                      <div style={styles.detailItem}>
                        <span style={styles.detailLabel}>Years Experience</span>
                        <span style={styles.detailValue}>{prof.years_experience || 0} years</span>
                      </div>
                      {prof.type === 'consultant' ? (
                        <>
                          <div style={styles.detailItem}>
                            <span style={styles.detailLabel}>Certification</span>
                            <span style={styles.detailValue}>{prof.qualification || 'Not provided'}</span>
                          </div>
                          <div style={styles.detailItem}>
                            <span style={styles.detailLabel}>Certificate Number</span>
                            <span style={styles.detailValue}>{prof.license_number || 'Not provided'}</span>
                          </div>
                          <div style={styles.detailItem}>
                            <span style={styles.detailLabel}>Training Institute</span>
                            <span style={styles.detailValue}>{prof.training_institute || 'Not provided'}</span>
                          </div>
                          <div style={styles.detailItem}>
                            <span style={styles.detailLabel}>Salon Affiliation</span>
                            <span style={styles.detailValue}>{prof.affiliation || 'Not provided'}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={styles.detailItem}>
                            <span style={styles.detailLabel}>Medical Degree</span>
                            <span style={styles.detailValue}>{prof.qualification || 'Not provided'}</span>
                          </div>
                          <div style={styles.detailItem}>
                            <span style={styles.detailLabel}>License Number</span>
                            <span style={styles.detailValue}>{prof.license_number || 'Not provided'}</span>
                          </div>
                          <div style={styles.detailItem}>
                            <span style={styles.detailLabel}>Issuing Council</span>
                            <span style={styles.detailValue}>{prof.training_institute || 'Not provided'}</span>
                          </div>
                          <div style={styles.detailItem}>
                            <span style={styles.detailLabel}>Clinic Affiliation</span>
                            <span style={styles.detailValue}>{prof.affiliation || 'Not provided'}</span>
                          </div>
                        </>
                      )}
                    </div>
                    {prof.bio && (
                      <div style={styles.detailItem}>
                        <span style={styles.detailLabel}>Bio</span>
                        <span style={styles.detailValue}>{prof.bio}</span>
                      </div>
                    )}
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Registered On</span>
                      <span style={styles.detailValue}>{prof.created_at ? new Date(prof.created_at).toLocaleDateString() : 'Unknown'}</span>
                    </div>
                  </div>

                  <div style={styles.professionalActions}>
                    <button
                      style={{...styles.approveBtn, backgroundColor: '#0d9488' }}
                      onClick={() => handleApprove(prof)}
                      disabled={approving === prof.id}
                    >
                      {approving === prof.id ? '⏳ Approving...' : '✅ Approve'}
                    </button>
                    <button
                      style={styles.rejectBtn}
                      onClick={() => handleReject(prof)}
                      disabled={rejecting === prof.id}
                    >
                      {rejecting === prof.id ? '⏳ Rejecting...' : '❌ Reject'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
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
    alignItems: 'center',
    marginBottom: '10px'
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
  typeFilters: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px'
  },
  typeBtn: {
    padding: '6px 14px',
    backgroundColor: '#F5F7FB',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '12px',
    fontFamily: 'inherit',
    color: '#778198'
  },
  typeBtnActive: {
    color: '#FFFFFF'
  },
  filterStats: {
    fontSize: '13px',
    color: '#778198'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px'
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '10px'
  },
  emptyText: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#17233C'
  },
  emptySubtext: {
    fontSize: '14px',
    color: '#778198'
  },
  professionalsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  professionalCard: {
    backgroundColor: '#F9FAFB',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #E7EAF1'
  },
  professionalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
    flexWrap: 'wrap',
    gap: '10px'
  },
  professionalInfo: {
    flex: 1
  },
  professionalName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#17233C',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap'
  },
  badgeConsultant: {
    fontSize: '12px',
    backgroundColor: '#0d9488',
    color: '#FFFFFF',
    padding: '2px 12px',
    borderRadius: '12px'
  },
  badgeDermatologist: {
    fontSize: '12px',
    backgroundColor: '#6c63d9',
    color: '#FFFFFF',
    padding: '2px 12px',
    borderRadius: '12px'
  },
  professionalEmail: {
    fontSize: '14px',
    color: '#778198',
    marginTop: '4px'
  },
  professionalPhone: {
    fontSize: '14px',
    color: '#778198',
    marginTop: '2px'
  },
  professionalStatus: {
    display: 'flex',
    alignItems: 'center'
  },
  statusPending: {
    padding: '4px 12px',
    backgroundColor: '#FEF3C7',
    color: '#92400E',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600'
  },
  professionalDetails: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    marginBottom: '16px',
    padding: '12px 16px',
    backgroundColor: '#FFFFFF',
    borderRadius: '8px'
  },
  detailGrid: {
    gridColumn: '1 / -1',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px'
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  detailLabel: {
    fontSize: '11px',
    color: '#778198',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  detailValue: {
    fontSize: '14px',
    color: '#17233C'
  },
  professionalActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px'
  },
  approveBtn: {
    padding: '8px 24px',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontFamily: 'inherit',
    fontWeight: '600'
  },
  rejectBtn: {
    padding: '8px 24px',
    backgroundColor: '#DC2626',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontFamily: 'inherit',
    fontWeight: '600'
  }
};

export default AdminRolePermissions;