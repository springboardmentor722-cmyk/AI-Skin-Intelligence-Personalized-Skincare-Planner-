// frontend/src/pages/AdminRoutines.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import AdminSidebar from '../components/AdminSidebar';
import '../styles/admin-theme.css';

function AdminRoutines() {
  const navigate = useNavigate();
  const [steps, setSteps] = useState([]);
  const [filteredSteps, setFilteredSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState('/admin/routines');
  const [userName, setUserName] = useState('');
  const [skinTypeFilter, setSkinTypeFilter] = useState('All');
  const [timeFilter, setTimeFilter] = useState('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStep, setEditingStep] = useState(null);
  const [formData, setFormData] = useState({
    skin_type: '',
    time_of_day: 'AM',
    step_order: 1,
    step_category: '',
    step_description: '',
    is_harsh: false
  });
  const [submitting, setSubmitting] = useState(false);

  const skinTypes = ['All', 'Oily', 'Dry', 'Combination', 'Sensitive', 'Normal'];
  const timeSlots = ['All', 'AM', 'PM', 'Weekly'];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    const name = localStorage.getItem('userName');
    setUserName(name || 'Admin');
    fetchRoutineMatrix();
  }, []);

  const fetchRoutineMatrix = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');

    try {
      const res = await api.get('/admin/routines/matrix', { params: { token } });
      setSteps(res.data.steps || []);
      setFilteredSteps(res.data.steps || []);
    } catch (err) {
      console.error('Failed to fetch routine matrix:', err);
      setError('Could not load routine matrix. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = steps;

    if (skinTypeFilter !== 'All') {
      filtered = filtered.filter(s => s.skin_type === skinTypeFilter);
    }

    if (timeFilter !== 'All') {
      filtered = filtered.filter(s => s.time_of_day === timeFilter);
    }

    setFilteredSteps(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [skinTypeFilter, timeFilter, steps]);

  const handleAddStep = async () => {
    if (!formData.skin_type || !formData.step_category || !formData.step_description) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    setError('');
    const token = localStorage.getItem('token');

    try {
      await api.post('/admin/routines/matrix', formData, { params: { token } });
      setShowAddForm(false);
      setFormData({
        skin_type: '',
        time_of_day: 'AM',
        step_order: 1,
        step_category: '',
        step_description: '',
        is_harsh: false
      });
      fetchRoutineMatrix();
      alert('✅ Step added successfully!');
    } catch (err) {
      setError('Failed to add step: ' + (err.response?.data?.detail || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStep = async () => {
    if (!editingStep) return;
    setSubmitting(true);
    setError('');
    const token = localStorage.getItem('token');

    try {
      await api.put(`/admin/routines/matrix/${editingStep.id}`, formData, { params: { token } });
      setEditingStep(null);
      setFormData({
        skin_type: '',
        time_of_day: 'AM',
        step_order: 1,
        step_category: '',
        step_description: '',
        is_harsh: false
      });
      fetchRoutineMatrix();
      alert('✅ Step updated successfully!');
    } catch (err) {
      setError('Failed to update step: ' + (err.response?.data?.detail || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStep = async (stepId) => {
    if (!window.confirm('Are you sure you want to delete this step?')) return;
    const token = localStorage.getItem('token');

    try {
      await api.delete(`/admin/routines/matrix/${stepId}`, { params: { token } });
      fetchRoutineMatrix();
      alert('✅ Step deleted successfully!');
    } catch (err) {
      setError('Failed to delete step: ' + (err.response?.data?.detail || 'Unknown error'));
    }
  };

  const openEdit = (step) => {
    setEditingStep(step);
    setFormData({
      skin_type: step.skin_type,
      time_of_day: step.time_of_day,
      step_order: step.step_order,
      step_category: step.step_category,
      step_description: step.step_description,
      is_harsh: step.is_harsh
    });
  };

  const cancelEdit = () => {
    setEditingStep(null);
    setFormData({
      skin_type: '',
      time_of_day: 'AM',
      step_order: 1,
      step_category: '',
      step_description: '',
      is_harsh: false
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
        <p>Loading routine matrix...</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <AdminSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main className={`admin-main ${sidebarOpen ? '' : 'is-collapsed'}`}>
        <div className="admin-header">
          <div>
            <div className="admin-kicker">ROUTINE MANAGEMENT</div>
            <h1 className="admin-title">📋 Routine Management</h1>
            <p className="admin-subtitle">Manage the routine step matrix for all skin types.</p>
          </div>
          <div style={styles.topBarRight}>
            <button className="admin-primary-button" onClick={() => setShowAddForm(true)}>
              + Add Step
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
            <select
              value={skinTypeFilter}
              onChange={(e) => setSkinTypeFilter(e.target.value)}
              style={styles.select}
            >
              {skinTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              style={styles.select}
            >
              {timeSlots.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
            <button className="admin-secondary-button" onClick={fetchRoutineMatrix}>🔄 Refresh</button>
          </div>
          <div style={styles.filterStats}>
            <span>Showing {filteredSteps.length} of {steps.length} steps</span>
          </div>
        </div>

        {(showAddForm || editingStep) && (
          <div style={styles.formCard}>
            <h4 style={styles.formTitle}>{editingStep ? '✏️ Edit Step' : '➕ Add New Step'}</h4>
            <div style={styles.formRow}>
              <div style={styles.formField}>
                <label style={styles.label}>Skin Type *</label>
                <select
                  value={formData.skin_type}
                  onChange={(e) => setFormData({...formData, skin_type: e.target.value})}
                  style={styles.select}
                >
                  <option value="">Select Skin Type</option>
                  <option value="Oily">Oily</option>
                  <option value="Dry">Dry</option>
                  <option value="Combination">Combination</option>
                  <option value="Sensitive">Sensitive</option>
                  <option value="Normal">Normal</option>
                </select>
              </div>
              <div style={styles.formField}>
                <label style={styles.label}>Time of Day *</label>
                <select
                  value={formData.time_of_day}
                  onChange={(e) => setFormData({...formData, time_of_day: e.target.value})}
                  style={styles.select}
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                  <option value="Weekly">Weekly</option>
                </select>
              </div>
              <div style={styles.formField}>
                <label style={styles.label}>Step Order *</label>
                <input
                  type="number"
                  value={formData.step_order}
                  onChange={(e) => setFormData({...formData, step_order: parseInt(e.target.value) || 1})}
                  style={styles.input}
                  min="1"
                />
              </div>
            </div>
            <div style={styles.formRow}>
              <div style={styles.formField}>
                <label style={styles.label}>Step Category *</label>
                <input
                  type="text"
                  placeholder="e.g., Cleansing, Treatment"
                  value={formData.step_category}
                  onChange={(e) => setFormData({...formData, step_category: e.target.value})}
                  style={styles.input}
                />
              </div>
              <div style={styles.formField}>
                <label style={styles.label}>Step Description *</label>
                <input
                  type="text"
                  placeholder="e.g., Use a gentle cleanser"
                  value={formData.step_description}
                  onChange={(e) => setFormData({...formData, step_description: e.target.value})}
                  style={styles.input}
                />
              </div>
            </div>
            <div style={styles.formRow}>
              <div style={styles.formField}>
                <label style={styles.label}>
                  <input
                    type="checkbox"
                    checked={formData.is_harsh}
                    onChange={(e) => setFormData({...formData, is_harsh: e.target.checked})}
                  />
                  {' '}Is Harsh (skip for sensitive skin)
                </label>
              </div>
            </div>
            <div style={styles.formActions}>
              <button style={styles.cancelBtn} onClick={cancelEdit}>Cancel</button>
              <button
                className="admin-primary-button"
                onClick={editingStep ? handleUpdateStep : handleAddStep}
                disabled={submitting}
              >
                {submitting ? 'Saving...' : editingStep ? 'Update Step' : 'Add Step'}
              </button>
            </div>
          </div>
        )}

        <div className="admin-surface">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Skin Type</th>
                <th>Time</th>
                <th>Order</th>
                <th>Category</th>
                <th>Description</th>
                <th>Harsh</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSteps.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{...styles.td, textAlign: 'center', color: '#778198' }}>
                    No steps found.
                  </td>
                </tr>
              ) : (
                filteredSteps.map((step) => (
                  <tr key={step.id}>
                    <td style={styles.td}><span style={styles.skinTypeBadge}>{step.skin_type}</span></td>
                    <td style={styles.td}>{step.time_of_day}</td>
                    <td style={styles.td}>{step.step_order}</td>
                    <td style={styles.td}>{step.step_category}</td>
                    <td style={styles.td}>{step.step_description}</td>
                    <td style={styles.td}>{step.is_harsh ? '⚠️ Yes' : '✅ No'}</td>
                    <td style={styles.td}>
                      <button style={styles.editBtn} onClick={() => openEdit(step)}>✏️</button>
                      <button style={styles.deleteBtn} onClick={() => handleDeleteStep(step.id)}>🗑️</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
    alignItems: 'center'
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
  skinTypeBadge: {
    padding: '2px 10px',
    backgroundColor: '#0d9488',
    color: '#FFFFFF',
    borderRadius: '12px',
    fontSize: '11px'
  },
  editBtn: {
    padding: '4px 10px',
    backgroundColor: '#F59E0B',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    marginRight: '4px'
  },
  deleteBtn: {
    padding: '4px 10px',
    backgroundColor: '#DC2626',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  formCard: {
    background: '#FFFFFF',
    padding: '24px',
    borderRadius: '20px',
    border: '2px solid #0d9488',
    marginBottom: '20px'
  },
  formTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#17233C',
    marginBottom: '16px'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '16px',
    marginBottom: '16px'
  },
  formField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#17233C'
  },
  input: {
    padding: '10px 14px',
    border: '1px solid #DCE1EC',
    borderRadius: '12px',
    fontSize: '14px',
    fontFamily: 'inherit',
    backgroundColor: '#FBFCFE'
  },
  formActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end'
  },
  cancelBtn: {
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

export default AdminRoutines;