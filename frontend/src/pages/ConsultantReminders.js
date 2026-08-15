// frontend/src/pages/ConsultantReminders.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ProfessionalSidebar from '../components/ProfessionalSidebar';
import '../styles/professional-theme.css';

function ConsultantReminders() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('consultant');
  const [reminders, setReminders] = useState([]);
  const [filteredReminders, setFilteredReminders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newReminder, setNewReminder] = useState({
    title: '',
    clientName: '',
    type: 'Follow-up',
    date: '',
    time: '',
    priority: 'Medium',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const reminderTypes = ['All', 'Follow-up', 'Assessment', 'Routine', 'Product', 'General'];
  const priorities = ['Low', 'Medium', 'High'];
  const timeSlots = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM'];

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
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
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

      const generatedReminders = [];

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

            if (daysLeft <= 3 && daysLeft >= 0) {
              const randomTime = timeSlots[Math.floor(Math.random() * timeSlots.length)];
              generatedReminders.push({
                id: `followup_${client.user_id}`,
                clientName: client.user_name || 'Unknown',
                title: `Follow-up with ${client.user_name || 'Client'}`,
                type: 'Follow-up',
                date: followUpDate.toISOString().split('T')[0],
                time: randomTime,
                priority: daysLeft === 0 ? 'High' : daysLeft <= 1 ? 'High' : 'Medium',
                notes: `Last assessment: ${lastDate.toLocaleDateString()}. Score: ${scoreRes.data?.score || 'N/A'}`,
                completed: false,
                daysLeft: daysLeft
              });
            }
          }

          if (scoreRes.data && scoreRes.data.score < 50) {
            generatedReminders.push({
              id: `assessment_${client.user_id}`,
              clientName: client.user_name || 'Unknown',
              title: `⚠️ Low score alert: ${client.user_name || 'Client'}`,
              type: 'Assessment',
              date: new Date().toISOString().split('T')[0],
              time: timeSlots[Math.floor(Math.random() * timeSlots.length)],
              priority: 'High',
              notes: `Client score is ${scoreRes.data.score}/100. Needs immediate attention.`,
              completed: false,
              daysLeft: 0
            });
          }

        } catch (e) {
          console.error('Error fetching client data:', e);
        }
      }

      generatedReminders.push({
        id: 'general_1',
        clientName: 'All Clients',
        title: `📊 Weekly ${userRole === 'dermatologist' ? 'Patient' : 'Client'} Report Generation`,
        type: 'General',
        date: new Date().toISOString().split('T')[0],
        time: '05:00 PM',
        priority: 'Medium',
        notes: `Generate and review weekly ${userRole === 'dermatologist' ? 'patient' : 'client'} reports`,
        completed: false,
        daysLeft: 0
      });

      generatedReminders.sort((a, b) => {
        const priorityOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
        return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
      });

      setReminders(generatedReminders);
      setFilteredReminders(generatedReminders);

    } catch (err) {
      console.error('Failed to fetch reminders:', err);
      setError('Could not load reminders. Please try again.');
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
    let filtered = reminders;

    if (term) {
      filtered = filtered.filter(r =>
        r.clientName.toLowerCase().includes(term) ||
        r.title.toLowerCase().includes(term)
      );
    }

    if (type !== 'All') {
      filtered = filtered.filter(r => r.type === type);
    }

    setFilteredReminders(filtered);
  };

  const toggleReminderComplete = (id) => {
    setReminders(reminders.map(r =>
      r.id === id ? { ...r, completed: !r.completed } : r
    ));
    setFilteredReminders(filteredReminders.map(r =>
      r.id === id ? { ...r, completed: !r.completed } : r
    ));
  };

  const deleteReminder = (id) => {
    if (!window.confirm('Are you sure you want to delete this reminder?')) return;
    setReminders(reminders.filter(r => r.id !== id));
    setFilteredReminders(filteredReminders.filter(r => r.id !== id));
  };

  const addReminder = async () => {
    if (!newReminder.title || !newReminder.clientName || !newReminder.date) {
      alert('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const newId = `manual_${Date.now()}`;
      const reminder = {
        id: newId,
        ...newReminder,
        completed: false,
        daysLeft: 0
      };

      setReminders([reminder, ...reminders]);
      setFilteredReminders([reminder, ...filteredReminders]);
      setShowAddModal(false);
      setNewReminder({
        title: '',
        clientName: '',
        type: 'Follow-up',
        date: '',
        time: '',
        priority: 'Medium',
        notes: ''
      });
      alert('✅ Reminder added successfully!');
    } catch (err) {
      alert('Failed to add reminder. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'High': '#dc2626',
      'Medium': '#d97706',
      'Low': userRole === 'dermatologist' ? '#6c63d9' : '#0d9488'
    };
    return colors[priority] || '#778198';
  };

  const getTypeIcon = (type) => {
    const icons = {
      'Follow-up': '📅',
      'Assessment': '🔍',
      'Routine': '📋',
      'Product': '🛍️',
      'General': '📌'
    };
    return icons[type] || '📌';
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const navigateTo = (path) => {
    navigate(path);
  };

  // Dynamic labels
  const clientLabel = userRole === 'dermatologist' ? 'patient' : 'client';

  if (loading) {
    return (
      <div className="professional-loading-page">
        <div className="professional-loading-spinner"></div>
        <p>Loading reminders...</p>
      </div>
    );
  }

  return (
    <div className={`professional-page role-${userRole}`}>
      <ProfessionalSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main className={`professional-main ${sidebarOpen ? '' : 'is-collapsed'}`}>
        <div className="professional-header">
          <div>
            <div className="professional-kicker">REMINDERS</div>
            <h1 className="professional-title">🔔 Reminders</h1>
            <p className="professional-subtitle">Manage your appointments and reminders.</p>
          </div>
          <button className="professional-primary-button" onClick={() => setShowAddModal(true)}>
            + Add Reminder
          </button>
        </div>

        {error && <div className="professional-alert-error">{error}</div>}

        <div className="professional-surface">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '10px' }}>
            <input
              type="text"
              placeholder="Search reminders..."
              value={searchTerm}
              onChange={handleSearch}
              style={{ flex: 1, padding: '10px 14px', border: '1px solid #DCE1EC', borderRadius: '12px', fontSize: '14px', fontFamily: 'inherit', minWidth: '200px', outline: 'none' }}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {reminderTypes.map(type => (
                <button
                  key={type}
                  style={{ 
                    padding: '6px 14px', 
                    backgroundColor: typeFilter === type ? (userRole === 'dermatologist' ? '#6c63d9' : '#0d9488') : '#F5F7FB', 
                    color: typeFilter === type ? '#FFFFFF' : '#778198',
                    border: 'none', 
                    borderRadius: '20px', 
                    cursor: 'pointer', 
                    fontSize: '12px', 
                    fontFamily: 'inherit' 
                  }}
                  onClick={() => handleTypeFilter(type)}
                >
                  {type === 'All' ? '📋 All' : `${getTypeIcon(type)} ${type}`}
                </button>
              ))}
            </div>
          </div>
          <div style={{ fontSize: '13px', color: '#778198' }}>
            <span>Showing {filteredReminders.length} of {reminders.length} reminders</span>
          </div>
        </div>

        <div className="professional-surface">
          {filteredReminders.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#778198', padding: '20px 0', fontSize: '14px' }}>No reminders found. Add a new reminder!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredReminders.map((reminder) => (
                <div key={reminder.id} style={{ 
                  backgroundColor: reminder.completed ? '#F5F7FB' : '#FFFFFF', 
                  padding: '16px', 
                  borderRadius: '12px', 
                  border: '1px solid #E7EAF1',
                  opacity: reminder.completed ? 0.6 : 1
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <input
                        type="checkbox"
                        checked={reminder.completed || false}
                        onChange={() => toggleReminderComplete(reminder.id)}
                        style={{ marginTop: '3px', width: '18px', height: '18px', cursor: 'pointer', accentColor: userRole === 'dermatologist' ? '#6c63d9' : '#0d9488' }}
                      />
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '600', color: '#17233C', textDecoration: reminder.completed ? 'line-through' : 'none' }}>
                          {reminder.title}
                        </div>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#778198', marginTop: '2px' }}>
                          <span style={{ fontWeight: '500', color: '#17233C' }}>{reminder.clientName}</span>
                          <span style={{ color: getPriorityColor(reminder.priority) }}>
                            {getTypeIcon(reminder.type)} {reminder.type}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ padding: '2px 10px', borderRadius: '12px', fontSize: '11px', color: '#FFFFFF', fontWeight: '600', backgroundColor: getPriorityColor(reminder.priority) }}>
                        {reminder.priority}
                      </span>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '0 4px', color: '#dc2626' }} onClick={() => deleteReminder(reminder.id)}>
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div style={{ marginLeft: '30px' }}>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#778198' }}>
                      <span>📅 {reminder.date}</span>
                      <span>🕐 {reminder.time}</span>
                    </div>
                    {reminder.notes && (
                      <div style={{ fontSize: '13px', color: '#34415B', marginTop: '4px', padding: '6px 10px', backgroundColor: '#FFFFFF', borderRadius: '8px' }}>
                        📝 {reminder.notes}
                      </div>
                    )}
                    {reminder.daysLeft !== undefined && reminder.daysLeft >= 0 && (
                      <div style={{ fontSize: '12px', fontWeight: '500', marginTop: '4px' }}>
                        {reminder.daysLeft === 0 ? '🔴 Due today' :
                         reminder.daysLeft <= 2 ? `🟡 ${reminder.daysLeft} days left` :
                         `🟢 ${reminder.daysLeft} days left`}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add Reminder Modal */}
      {showAddModal && (
        <div style={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button style={styles.modalClose} onClick={() => setShowAddModal(false)}>✕</button>
            <h2 style={styles.modalTitle}>➕ Add Reminder</h2>

            <div style={styles.modalForm}>
              <div className="professional-field" style={{ marginBottom: '12px' }}>
                <label style={styles.label}>Title *</label>
                <input
                  type="text"
                  placeholder="e.g., Follow-up with client"
                  value={newReminder.title}
                  onChange={(e) => setNewReminder({...newReminder, title: e.target.value})}
                  style={styles.input}
                />
              </div>

              <div className="professional-field" style={{ marginBottom: '12px' }}>
                <label style={styles.label}>{userRole === 'dermatologist' ? 'Patient' : 'Client'} Name *</label>
                <input
                  type="text"
                  placeholder={`${userRole === 'dermatologist' ? 'Patient' : 'Client'} name`}
                  value={newReminder.clientName}
                  onChange={(e) => setNewReminder({...newReminder, clientName: e.target.value})}
                  style={styles.input}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' }}>
                <div className="professional-field">
                  <label style={styles.label}>Type</label>
                  <select
                    value={newReminder.type}
                    onChange={(e) => setNewReminder({...newReminder, type: e.target.value})}
                    style={styles.select}
                  >
                    {reminderTypes.filter(t => t !== 'All').map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className="professional-field">
                  <label style={styles.label}>Priority</label>
                  <select
                    value={newReminder.priority}
                    onChange={(e) => setNewReminder({...newReminder, priority: e.target.value})}
                    style={styles.select}
                  >
                    {priorities.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' }}>
                <div className="professional-field">
                  <label style={styles.label}>Date *</label>
                  <input
                    type="date"
                    value={newReminder.date}
                    onChange={(e) => setNewReminder({...newReminder, date: e.target.value})}
                    style={styles.input}
                  />
                </div>
                <div className="professional-field">
                  <label style={styles.label}>Time</label>
                  <select
                    value={newReminder.time}
                    onChange={(e) => setNewReminder({...newReminder, time: e.target.value})}
                    style={styles.select}
                  >
                    <option value="">Select time</option>
                    {timeSlots.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="professional-field" style={{ marginBottom: '12px' }}>
                <label style={styles.label}>Notes</label>
                <textarea
                  placeholder="Additional notes..."
                  value={newReminder.notes}
                  onChange={(e) => setNewReminder({...newReminder, notes: e.target.value})}
                  style={styles.textarea}
                  rows="2"
                />
              </div>

              <div style={styles.modalActions}>
                <button style={styles.cancelBtn} onClick={() => setShowAddModal(false)}>Cancel</button>
                <button style={{ ...styles.saveBtn, backgroundColor: userRole === 'dermatologist' ? '#6c63d9' : '#0d9488' }} onClick={addReminder} disabled={submitting}>
                  {submitting ? 'Adding...' : '✅ Add Reminder'}
                </button>
              </div>
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
    maxWidth: '550px',
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
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#17233C',
    display: 'block',
    marginBottom: '4px',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #DCE1EC',
    borderRadius: '12px',
    fontSize: '14px',
    fontFamily: 'inherit',
  },
  select: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #DCE1EC',
    borderRadius: '12px',
    fontSize: '14px',
    fontFamily: 'inherit',
    backgroundColor: '#FFFFFF',
  },
  textarea: {
    width: '100%',
    padding: '10px 14px',
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
    marginTop: '8px',
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

export default ConsultantReminders;