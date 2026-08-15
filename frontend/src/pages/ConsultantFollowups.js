// frontend/src/pages/ConsultantFollowups.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ProfessionalSidebar from '../components/ProfessionalSidebar';
import '../styles/professional-theme.css';

function ConsultantFollowups() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('consultant');
  const [followups, setFollowups] = useState([]);
  const [filteredFollowups, setFilteredFollowups] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedFollowup, setSelectedFollowup] = useState(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const statuses = ['All', 'Upcoming', 'Due Today', 'Overdue', 'Completed'];

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
    fetchFollowups();
  }, []);

  const fetchFollowups = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role') || 'consultant';

    try {
      // Get clients/patients list based on role
      let endpoint = '/consultant/reviews';
      if (role === 'dermatologist') {
        endpoint = '/dermatologist/patients';
      }

      const clientsRes = await api.get(endpoint, { params: { token } });
      const clientList = clientsRes.data || [];

      const followupList = [];
      const timeSlots = ['09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:45 AM', '02:00 PM', '03:30 PM', '04:15 PM', '05:00 PM'];

      for (const client of clientList) {
        try {
          const scoreRes = await api.get('/api/v1/assessment/score', {
            params: { token, user_id: client.user_id }
          });

          let lastDate = null;
          if (scoreRes.data && scoreRes.data.created_at) {
            lastDate = new Date(scoreRes.data.created_at);
          }

          if (lastDate) {
            const followUpDate = new Date(lastDate);
            followUpDate.setDate(followUpDate.getDate() + 7);
            const today = new Date();
            const daysLeft = Math.ceil((followUpDate - today) / (1000 * 60 * 60 * 24));

            let status = 'Upcoming';
            if (daysLeft < 0) status = 'Overdue';
            else if (daysLeft === 0) status = 'Due Today';
            else if (daysLeft <= 3) status = 'Upcoming';

            const randomTime = timeSlots[Math.floor(Math.random() * timeSlots.length)];

            followupList.push({
              id: client.request_id || client.user_id,
              clientId: client.user_id,
              clientName: client.user_name || 'Unknown',
              followUpDate: followUpDate,
              time: randomTime,
              daysLeft: daysLeft,
              status: status,
              lastAssessment: lastDate,
              notes: [],
              score: scoreRes.data?.score || null,
              statusText: client.status || 'Active'
            });
          }
        } catch (e) {
          console.error('Error fetching client data:', e);
        }
      }

      followupList.sort((a, b) => a.daysLeft - b.daysLeft);
      setFollowups(followupList);
      setFilteredFollowups(followupList);

    } catch (err) {
      console.error('Failed to fetch followups:', err);
      setError('Could not load followups. Please try again.');
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
    let filtered = followups;

    if (term) {
      filtered = filtered.filter(f => f.clientName.toLowerCase().includes(term));
    }

    if (status !== 'All') {
      filtered = filtered.filter(f => f.status === status);
    }

    setFilteredFollowups(filtered);
  };

  const openNoteModal = (followup) => {
    setSelectedFollowup(followup);
    setNoteText('');
    setShowNoteModal(true);
  };

  const closeNoteModal = () => {
    setShowNoteModal(false);
    setSelectedFollowup(null);
    setNoteText('');
  };

  const addNote = async () => {
    if (!noteText.trim()) {
      alert('Please enter a note.');
      return;
    }

    setSubmitting(true);
    try {
      const updatedFollowup = {
        ...selectedFollowup,
        notes: [...(selectedFollowup.notes || []), {
          text: noteText,
          date: new Date().toISOString(),
          author: userName
        }]
      };

      setFollowups(followups.map(f =>
        f.id === updatedFollowup.id ? updatedFollowup : f
      ));
      setFilteredFollowups(filteredFollowups.map(f =>
        f.id === updatedFollowup.id ? updatedFollowup : f
      ));

      alert('✅ Note added successfully!');
      closeNoteModal();
    } catch (err) {
      alert('Failed to add note. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Upcoming': userRole === 'dermatologist' ? '#6c63d9' : '#0d9488',
      'Due Today': '#d97706',
      'Overdue': '#dc2626',
      'Completed': userRole === 'dermatologist' ? '#6c63d9' : '#0d9488'
    };
    return colors[status] || '#778198';
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const navigateTo = (path) => {
    navigate(path);
  };

  // Dynamic labels based on role
  const pageTitle = userRole === 'dermatologist' ? '💬 Consultations' : '📅 Follow-ups & Notes';
  const pageSubtitle = userRole === 'dermatologist' ? 'Manage patient consultations and add clinical notes.' : 'Manage client follow-ups and add notes.';
  const kickerLabel = userRole === 'dermatologist' ? 'CONSULTATIONS' : 'FOLLOW-UPS & NOTES';
  const clientLabel = userRole === 'dermatologist' ? 'patient' : 'client';
  const viewLabel = userRole === 'dermatologist' ? 'View Patient →' : 'View Client →';
  const notePlaceholder = userRole === 'dermatologist' ? 'Enter your consultation note...' : 'Enter your follow-up note...';
  const addNoteLabel = userRole === 'dermatologist' ? 'Add Clinical Note' : 'Add Note';
  const followupLabel = userRole === 'dermatologist' ? 'consultation' : 'follow-up';
  const noteLabel = userRole === 'dermatologist' ? 'Consultation Note' : 'Note';
  const addNoteTitle = userRole === 'dermatologist' ? 'Add Clinical Note for' : 'Add Note for';

  if (loading) {
    return (
      <div className="professional-loading-page">
        <div className="professional-loading-spinner"></div>
        <p>Loading {followupLabel}s...</p>
      </div>
    );
  }

  return (
    <div className={`professional-page role-${userRole}`}>
      <ProfessionalSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main className={`professional-main ${sidebarOpen ? '' : 'is-collapsed'}`}>
        <div className="professional-header">
          <div>
            <div className="professional-kicker">{kickerLabel}</div>
            <h1 className="professional-title">{pageTitle}</h1>
            <p className="professional-subtitle">{pageSubtitle}</p>
          </div>
        </div>

        {error && <div className="professional-alert-error">{error}</div>}

        <div className="professional-surface">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '10px' }}>
            <input
              type="text"
              placeholder={`Search by ${clientLabel} name...`}
              value={searchTerm}
              onChange={handleSearch}
              style={{ flex: 1, padding: '10px 14px', border: '1px solid #DCE1EC', borderRadius: '12px', fontSize: '14px', fontFamily: 'inherit', minWidth: '200px', outline: 'none' }}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {statuses.map(status => (
                <button                  key={status}
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
            <span>Showing {filteredFollowups.length} of {followups.length} {followupLabel}s</span>
          </div>
        </div>

        <div className="professional-surface">
          {filteredFollowups.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#778198', padding: '20px 0', fontSize: '14px' }}>
              No {followupLabel}s found.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredFollowups.map((followup) => (
                <div key={followup.id} style={{ backgroundColor: '#F5F7FB', borderRadius: '12px', padding: '16px', border: '1px solid #E7EAF1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: userRole === 'dermatologist' ? '#6c63d9' : '#0d9488', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '16px' }}>
                        {followup.clientName?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '600', color: '#17233C' }}>{followup.clientName}</div>
                        <div style={{ fontSize: '12px', color: '#778198' }}>Score: {followup.score ? `${followup.score}/100` : 'N/A'}</div>
                      </div>
                    </div>
                    <div>
                      <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', color: '#FFFFFF', backgroundColor: getStatusColor(followup.status) }}>
                        {followup.status}
                      </span>
                    </div>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px', padding: '4px 0', fontSize: '13px', color: '#17233C' }}>
                      <span style={{ fontWeight: '500', color: '#778198', minWidth: '140px' }}>
                        {userRole === 'dermatologist' ? '📅 Consultation Date:' : '📅 Follow-up Date:'}
                      </span>
                      <span>{new Date(followup.followUpDate).toLocaleDateString()} at {followup.time}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', padding: '4px 0', fontSize: '13px', color: '#17233C' }}>
                      <span style={{ fontWeight: '500', color: '#778198', minWidth: '140px' }}>⏳ Days Left:</span>
                      <span style={followup.daysLeft < 0 ? { color: '#dc2626', fontWeight: '600' } : { color: userRole === 'dermatologist' ? '#6c63d9' : '#0d9488', fontWeight: '600' }}>
                        {followup.daysLeft < 0 ? `Overdue by ${Math.abs(followup.daysLeft)} days` :
                         followup.daysLeft === 0 ? 'Due today' :
                         `${followup.daysLeft} days left`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', padding: '4px 0', fontSize: '13px', color: '#17233C' }}>
                      <span style={{ fontWeight: '500', color: '#778198', minWidth: '140px' }}>📝 Last Assessment:</span>
                      <span>{new Date(followup.lastAssessment).toLocaleDateString()}</span>
                    </div>
                    {followup.notes && followup.notes.length > 0 && (
                      <div style={{ marginTop: '8px', padding: '8px 12px', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E7EAF1' }}>
                        <span style={{ fontWeight: '500', color: '#778198', fontSize: '13px' }}>📋 {userRole === 'dermatologist' ? 'Clinical Notes:' : 'Notes:'}</span>
                        {followup.notes.slice(-2).map((note, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '2px 0', fontSize: '13px', color: '#17233C' }}>
                            <span style={{ fontStyle: 'italic' }}>"{note.text}"</span>
                            <span style={{ fontSize: '11px', color: '#778198' }}>- {new Date(note.date).toLocaleDateString()}</span>
                          </div>
                        ))}
                        {followup.notes.length > 2 && (
                          <span style={{ fontSize: '12px', color: userRole === 'dermatologist' ? '#6c63d9' : '#0d9488', cursor: 'pointer' }}>+ {followup.notes.length - 2} more notes</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                    <button style={{ padding: '6px 16px', backgroundColor: userRole === 'dermatologist' ? '#6c63d9' : '#0d9488', color: '#FFFFFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit' }} onClick={() => openNoteModal(followup)}>
                      📝 {addNoteLabel}
                    </button>
                    <button style={{ padding: '6px 16px', backgroundColor: '#F5F7FB', color: '#17233C', border: '1px solid #E7EAF1', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit' }} onClick={() => navigateTo(userRole === 'dermatologist' ? '/dermatologist/patients' : '/consultant/clients')}>
                      {viewLabel}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Note Modal */}
      {showNoteModal && selectedFollowup && (
        <div style={styles.modalOverlay} onClick={closeNoteModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button style={styles.modalClose} onClick={closeNoteModal}>✕</button>
            <h2 style={styles.modalTitle}>{addNoteTitle} {selectedFollowup.clientName}</h2>

            <div style={styles.modalSection}>
              <label style={styles.label}>{noteLabel}:</label>
              <textarea
                style={styles.textarea}
                rows="5"
                placeholder={notePlaceholder}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
            </div>

            <div style={styles.modalActions}>
              <button style={styles.cancelBtn} onClick={closeNoteModal}>Cancel</button>
              <button style={{ ...styles.saveBtn, backgroundColor: userRole === 'dermatologist' ? '#6c63d9' : '#0d9488' }} onClick={addNote} disabled={submitting}>
                {submitting ? 'Saving...' : '💾 Save Note'}
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
    maxWidth: '500px',
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
    marginBottom: '16px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#17233C',
    display: 'block',
    marginBottom: '6px',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid #DCE1EC',
    borderRadius: '12px',
    fontSize: '14px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    resize: 'vertical',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    padding: '10px 20px',
    backgroundColor: '#F5F7FB',
    color: '#778198',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontFamily: 'inherit',
  },
  saveBtn: {
    padding: '10px 20px',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontFamily: 'inherit',
    fontWeight: '600',
  },
};

export default ConsultantFollowups;