import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/Dashboard.css';

const API_BASE = 'http://127.0.0.1:8000/api';

function getToken() {
  return localStorage.getItem('token');
}

async function apiFetch(url, options = {}) {
  const token = getToken();
  if (!token) throw new Error('No token');
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...options.headers
  };
  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/auth';
  }
  return response;
}

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
  { id: 'patients', label: 'My Patients', icon: '👥' },
  { id: 'recommendations', label: 'Send Recommendations', icon: '💬' },
  { id: 'profile', label: 'My Profile', icon: '👤' },
];

export default function ConsultantDashboard() {
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm('Logout?')) {
      logout();
      navigate('/');
    }
  };

  const renderPage = () => {
    switch(activePage) {
      case 'patients': return <MyPatients />;
      case 'recommendations': return <SendRecommendations />;
      case 'profile': return <ConsultantProfile />;
      default: return <ConsultantHome user={user} />;
    }
  };

  return (
    <div className="dashboard-container">
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>Glow & Thrive</h2>
          <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
        </div>
        <nav className="sidebar-menu">
          {MENU_ITEMS.map(item => (
            <button key={item.id} className={`menu-item ${activePage === item.id ? 'active' : ''}`} onClick={() => setActivePage(item.id)}>
              <span className="menu-icon">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <span>🚪</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <h1>{MENU_ITEMS.find(m => m.id === activePage)?.label || 'Dashboard'}</h1>
          <div className="user-info"><span>{user?.first_name}!</span></div>
        </header>
        <section className="dashboard-content">{renderPage()}</section>
      </main>
    </div>
  );
}

// ============ HOME ============
function ConsultantHome({ user }) {
  const [stats, setStats] = useState({ patients: 0 });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await apiFetch(`${API_BASE}/consultant/my-patients`);
      const data = await response.json();
      setStats({ patients: data.count || 0 });
    } catch (e) { console.error(e); }
  };

  return (
    <div className="dashboard-home">
      <div className="welcome-section">
        <h2>Welcome {user?.first_name}! 💄</h2>
        <p>Help your patients achieve skincare goals</p>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Assigned Patients</h3>
            <p>{stats.patients}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💬</div>
          <div className="stat-content">
            <h3>Recommendations</h3>
            <p>Active</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Avg Compliance</h3>
            <p>85%</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <h3>Rating</h3>
            <p>4.8/5</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ MY PATIENTS (ROSTER) ============
function MyPatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [inspection, setInspection] = useState(null);
  const [showInspection, setShowInspection] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await apiFetch(`${API_BASE}/consultant/my-patients`);
      const data = await response.json();
      setPatients(data.patients || []);
      setLoading(false);
    } catch (err) {
      setError('Failed: ' + err.message);
      setLoading(false);
    }
  };

  const handleViewInspection = async (patient) => {
    try {
      const response = await apiFetch(`${API_BASE}/consultant/patient-inspection/${patient.user_id}`);
      const data = await response.json();
      setInspection(data);
      setSelectedPatient(patient);
      setShowInspection(true);
    } catch (err) {
      setError('Failed to load inspection');
    }
  };

  if (loading) return <div className="page-container"><p>Loading...</p></div>;

  if (showInspection && inspection) {
    return <PatientInspection patient={selectedPatient} inspection={inspection} onBack={() => setShowInspection(false)} />;
  }

  return (
    <div className="page-container">
      <div className="card-container">
        <h2>👥 My Assigned Patients ({patients.length})</h2>
        {error && <div className="error-message">{error}</div>}

        {patients.length === 0 ? (
          <div style={{ padding: '20px', background: '#f9f9f9', borderRadius: '8px', textAlign: 'center' }}>
            <p>No patients assigned yet</p>
            <p style={{ fontSize: '12px', color: '#999' }}>Admin will assign patients to you</p>
          </div>
        ) : (
          <div className="patients-roster">
            {patients.map(patient => (
              <div key={patient.user_id} className="patient-roster-card">
                <div className="patient-header">
                  <h4>{patient.name}</h4>
                  <span className="assigned-badge">Assigned</span>
                </div>
                <p>📧 {patient.email}</p>
                
                <div className="patient-metrics">
                  <div className="metric">
                    <span className="metric-label">Health Score</span>
                    <span className="metric-value">{patient.health_score}/10</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Compliance</span>
                    <span className="metric-value">{patient.compliance_percentage.toFixed(1)}%</span>
                  </div>
                </div>

                <p className="assigned-date">📅 Assigned: {patient.assigned_date.split(' ')[0]}</p>

                <button 
                  className="btn btn-primary"
                  onClick={() => handleViewInspection(patient)}
                >
                  🔍 View Inspection
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============ PATIENT INSPECTION VIEW ============
function PatientInspection({ patient, inspection, onBack }) {
  const [showRoutineForm, setShowRoutineForm] = useState(false);
  const [showRecommendationForm, setShowRecommendationForm] = useState(false);
  const [routine, setRoutine] = useState(inspection.current_routine || []);
  const [recommendation, setRecommendation] = useState({
    recommendation_text: '',
    product_suggestions: '',
    routine_suggestions: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRoutineChange = (index, field, value) => {
    const updated = [...routine];
    updated[index][field] = value;
    setRoutine(updated);
  };

  const handleAddRoutineStep = () => {
    setRoutine([...routine, { step: '', frequency: '' }]);
  };

  const handleRemoveRoutineStep = (index) => {
    setRoutine(routine.filter((_, i) => i !== index));
  };

  const handleSaveRoutine = async () => {
    try {
      const response = await apiFetch(`${API_BASE}/consultant/update-patient-routine/${patient.user_id}`, {
        method: 'PUT',
        body: JSON.stringify({ routine_steps: routine })
      });

      if (response.ok) {
        setSuccess('Routine updated! Patient will see changes immediately.');
        setShowRoutineForm(false);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to save routine');
      }
    } catch (err) {
      setError('Error: ' + err.message);
    }
  };

  const handleSendRecommendation = async () => {
    if (!recommendation.recommendation_text) {
      setError('Please enter recommendation text');
      return;
    }

    try {
      const response = await apiFetch(`${API_BASE}/consultant/recommendations`, {
        method: 'POST',
        body: JSON.stringify({
          user_id: patient.user_id,
          ...recommendation
        })
      });

      if (response.ok) {
        setSuccess('Recommendation sent!');
        setRecommendation({ recommendation_text: '', product_suggestions: '', routine_suggestions: '' });
        setShowRecommendationForm(false);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to send');
      }
    } catch (err) {
      setError('Error: ' + err.message);
    }
  };

  return (
    <div className="page-container">
      <div className="card-container">
        <div className="inspection-header">
          <button className="btn btn-secondary" onClick={onBack}>← Back</button>
          <h2>Patient Inspection: {patient.name}</h2>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {/* PROGRESS PHOTOS */}
        {inspection.progress_photos && (
          <div className="inspection-section">
            <h3>📸 Progress Photos</h3>
            <div className="progress-comparison">
              <div className="photo-container">
                <h4>Before</h4>
                <div style={{ background: '#f0f0f0', padding: '20px', borderRadius: '8px', textAlign: 'center', minHeight: '150px' }}>
                  {inspection.progress_photos.before_image ? '📷 Before' : 'No before photo'}
                </div>
              </div>
              <div className="improvement-display">
                <h4>Improvement</h4>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary-rose)' }}>
                  {inspection.progress_photos.improvement_percentage}%
                </div>
              </div>
              <div className="photo-container">
                <h4>After</h4>
                <div style={{ background: '#f0f0f0', padding: '20px', borderRadius: '8px', textAlign: 'center', minHeight: '150px' }}>
                  {inspection.progress_photos.after_image ? '📷 After' : 'No after photo'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LIFESTYLE STATS */}
        <div className="inspection-section">
          <h3>📊 Lifestyle (Last 30 Days)</h3>
          <div className="lifestyle-stats">
            <div className="stat">
              <span className="stat-icon">😴</span>
              <h4>Avg Sleep</h4>
              <p>{inspection.lifestyle_30days.avg_sleep.toFixed(1)} hours</p>
            </div>
            <div className="stat">
              <span className="stat-icon">💧</span>
              <h4>Avg Water</h4>
              <p>{inspection.lifestyle_30days.avg_water.toFixed(1)} glasses</p>
            </div>
            <div className="stat">
              <span className="stat-icon">😰</span>
              <h4>Avg Stress</h4>
              <p>{inspection.lifestyle_30days.avg_stress.toFixed(1)}/10</p>
            </div>
            <div className="stat">
              <span className="stat-icon">📝</span>
              <h4>Total Logs</h4>
              <p>{inspection.lifestyle_30days.total_logs}</p>
            </div>
          </div>
        </div>

        {/* CURRENT ROUTINE */}
        <div className="inspection-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3>💆 Current Routine</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setShowRoutineForm(!showRoutineForm)}>
              {showRoutineForm ? '✕ Cancel' : '✎ Update Routine'}
            </button>
          </div>

          {showRoutineForm ? (
            <div className="routine-form">
              {routine.map((step, idx) => (
                <div key={idx} className="routine-step">
                  <input 
                    type="text" 
                    placeholder="Step (e.g., Cleanser)" 
                    value={step.step}
                    onChange={(e) => handleRoutineChange(idx, 'step', e.target.value)}
                  />
                  <input 
                    type="text" 
                    placeholder="Frequency (e.g., AM/PM, 2x/week)" 
                    value={step.frequency}
                    onChange={(e) => handleRoutineChange(idx, 'frequency', e.target.value)}
                  />
                  <button className="btn btn-sm btn-danger" onClick={() => handleRemoveRoutineStep(idx)}>✕</button>
                </div>
              ))}
              <button className="btn btn-secondary btn-sm" onClick={handleAddRoutineStep}>+ Add Step</button>
              <button className="btn btn-primary" onClick={handleSaveRoutine}>Save Routine</button>
            </div>
          ) : (
            <div className="routine-display">
              {inspection.current_routine.length === 0 ? (
                <p>No routine steps</p>
              ) : (
                <ul>
                  {inspection.current_routine.map((step, idx) => (
                    <li key={idx}>
                      <strong>{step.step}</strong> - {step.frequency}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* SEND RECOMMENDATION */}
        <div className="inspection-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3>💬 Send Recommendation</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setShowRecommendationForm(!showRecommendationForm)}>
              {showRecommendationForm ? '✕ Cancel' : '✎ New Recommendation'}
            </button>
          </div>

          {showRecommendationForm && (
            <div className="recommendation-form">
              <div className="form-group">
                <label>Recommendation Text *</label>
                <textarea 
                  value={recommendation.recommendation_text}
                  onChange={(e) => setRecommendation({...recommendation, recommendation_text: e.target.value})}
                  placeholder="Personalized skincare advice..."
                  rows="4"
                ></textarea>
              </div>
              <div className="form-group">
                <label>Product Suggestions</label>
                <textarea 
                  value={recommendation.product_suggestions}
                  onChange={(e) => setRecommendation({...recommendation, product_suggestions: e.target.value})}
                  placeholder="Specific products to recommend..."
                  rows="3"
                ></textarea>
              </div>
              <div className="form-group">
                <label>Routine Suggestions</label>
                <textarea 
                  value={recommendation.routine_suggestions}
                  onChange={(e) => setRecommendation({...recommendation, routine_suggestions: e.target.value})}
                  placeholder="Routine tips..."
                  rows="3"
                ></textarea>
              </div>
              <button className="btn btn-primary" onClick={handleSendRecommendation}>Send Recommendation</button>
            </div>
          )}
        </div>

        {/* TIMELINE */}
        <div className="inspection-section">
          <h3>📅 Activity Timeline</h3>
          <div className="timeline">
            {inspection.timeline.map((event, idx) => (
              <div key={idx} className="timeline-event">
                <div className="timeline-marker"></div>
                <div className="timeline-content">
                  <p className="timeline-date">{event.date}</p>
                  <p className="timeline-type">{event.type}</p>
                  <p>{event.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ SEND RECOMMENDATIONS ============
function SendRecommendations() {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [recommendation, setRecommendation] = useState({
    recommendation_text: '',
    product_suggestions: '',
    routine_suggestions: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await apiFetch(`${API_BASE}/consultant/my-patients`);
      const data = await response.json();
      setPatients(data.patients || []);
      setLoading(false);
    } catch (err) {
      setError('Failed: ' + err.message);
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!selectedPatient || !recommendation.recommendation_text) {
      setError('Select patient and enter recommendation');
      return;
    }

    try {
      const response = await apiFetch(`${API_BASE}/consultant/recommendations`, {
        method: 'POST',
        body: JSON.stringify({
          user_id: parseInt(selectedPatient),
          ...recommendation
        })
      });

      if (response.ok) {
        setSuccess('Recommendation sent!');
        setRecommendation({ recommendation_text: '', product_suggestions: '', routine_suggestions: '' });
        setSelectedPatient('');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to send');
      }
    } catch (err) {
      setError('Error: ' + err.message);
    }
  };

  if (loading) return <div className="page-container"><p>Loading...</p></div>;

  return (
    <div className="page-container">
      <div className="card-container">
        <h2>💬 Send Skincare Recommendations</h2>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="form-group">
          <label>Select Patient *</label>
          <select value={selectedPatient} onChange={(e) => setSelectedPatient(e.target.value)}>
            <option value="">-- Choose a patient --</option>
            {patients.map(p => (
              <option key={p.user_id} value={p.user_id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Recommendation Text *</label>
          <textarea 
            value={recommendation.recommendation_text}
            onChange={(e) => setRecommendation({...recommendation, recommendation_text: e.target.value})}
            placeholder="Write personalized skincare recommendations..."
            rows="5"
          ></textarea>
        </div>

        <div className="form-group">
          <label>Product Suggestions</label>
          <textarea 
            value={recommendation.product_suggestions}
            onChange={(e) => setRecommendation({...recommendation, product_suggestions: e.target.value})}
            placeholder="Suggest specific products..."
            rows="4"
          ></textarea>
        </div>

        <div className="form-group">
          <label>Routine Suggestions</label>
          <textarea 
            value={recommendation.routine_suggestions}
            onChange={(e) => setRecommendation({...recommendation, routine_suggestions: e.target.value})}
            placeholder="Suggest a routine..."
            rows="4"
          ></textarea>
        </div>

        <button className="btn btn-primary" onClick={handleSend}>Send Recommendation</button>
      </div>
    </div>
  );
}

// ============ CONSULTANT PROFILE ============
function ConsultantProfile() {
  const [profile, setProfile] = useState({
    certification: '',
    specialization: '',
    company_name: '',
    years_experience: '',
    bio: '',
    consultation_fee: ''
  });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await apiFetch(`${API_BASE}/consultant/profile`);
      const data = await response.json();
      setProfile({
        certification: data.certification || '',
        specialization: data.specialization || '',
        company_name: data.company_name || '',
        years_experience: data.years_experience || '',
        bio: data.bio || '',
        consultation_fee: data.consultation_fee || ''
      });
      setLoading(false);
    } catch (err) {
      setError('Failed: ' + err.message);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const response = await apiFetch(`${API_BASE}/consultant/profile/update`, {
        method: 'PUT',
        body: JSON.stringify(profile)
      });

      if (response.ok) {
        setSuccess('Profile updated!');
        setEditing(false);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to save');
      }
    } catch (err) {
      setError('Error: ' + err.message);
    }
  };

  if (loading) return <div className="page-container"><p>Loading...</p></div>;

  return (
    <div className="page-container">
      <div className="card-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>👤 My Professional Profile</h2>
          <button className="btn btn-secondary" onClick={() => setEditing(!editing)}>
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="profile-form">
          <div className="form-group">
            <label>Certification</label>
            <input type="text" name="certification" value={profile.certification} onChange={handleChange} disabled={!editing} />
          </div>
          <div className="form-group">
            <label>Specialization</label>
            <input type="text" name="specialization" value={profile.specialization} onChange={handleChange} disabled={!editing} />
          </div>
          <div className="form-group">
            <label>Company/Clinic</label>
            <input type="text" name="company_name" value={profile.company_name} onChange={handleChange} disabled={!editing} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Experience (years)</label>
              <input type="number" name="years_experience" value={profile.years_experience} onChange={handleChange} disabled={!editing} />
            </div>
            <div className="form-group">
              <label>Consultation Fee ($)</label>
              <input type="number" name="consultation_fee" value={profile.consultation_fee} onChange={handleChange} disabled={!editing} />
            </div>
          </div>
          <div className="form-group">
            <label>Bio</label>
            <textarea name="bio" value={profile.bio} onChange={handleChange} disabled={!editing} rows="4"></textarea>
          </div>
          {editing && <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>}
        </div>
      </div>
    </div>
  );
}