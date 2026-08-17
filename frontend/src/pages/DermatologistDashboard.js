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
    window.location.href = '/';
  }
  return response;
}

// ============================================
// DASHBOARD HOME
// ============================================
function DashboardHome() {
  const [stats, setStats] = useState({
    total_patients: 0,
    active_cases: 0,
    completed_cases: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await apiFetch(`${API_BASE}/dermatologist/dashboard-stats`);
      const data = await response.json();
      setStats(data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="dashboard-home">
        <div className="welcome-section">
          <h2>Dermatologist Dashboard</h2>
          <p>Provide expert clinical assessment and create specialized treatment plans for patients</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">P</div>
            <div className="stat-content">
              <h3>Total Patients</h3>
              <p>{stats.total_patients}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">A</div>
            <div className="stat-content">
              <h3>Active Cases</h3>
              <p>{stats.active_cases}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">C</div>
            <div className="stat-content">
              <h3>Completed Cases</h3>
              <p>{stats.completed_cases}</p>
            </div>
          </div>
        </div>

        <div className="card-container" style={{ marginTop: '30px' }}>
          <h2>Your Role</h2>
          <p style={{ color: '#666', lineHeight: '1.8' }}>
            As a dermatologist, you provide specialized clinical expertise and create comprehensive treatment plans for patients. 
            You review pre-screened cases from consultants and deliver professional medical guidance tailored to each patient's skin condition.
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// CONSULTATION REQUESTS (APPROVED CASES)
// ============================================
function ConsultationRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await apiFetch(`${API_BASE}/dermatologist/consultation-requests`);
      const data = await response.json();
      setRequests(data.requests || []);
      setLoading(false);
    } catch (err) {
      setError('Failed to load requests');
      setLoading(false);
    }
  };

  if (loading) return <div className="page-container"><p>Loading...</p></div>;

  return (
    <div className="page-container">
      <div className="card-container">
        <h2>Assigned Cases</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>Review and manage cases assigned to you</p>

        {error && <div className="error-message">{error}</div>}

        {requests.length === 0 ? (
          <div style={{ padding: '20px', background: '#f9f9f9', borderRadius: '8px', textAlign: 'center' }}>
            <p>No cases assigned yet</p>
          </div>
        ) : (
          <div className="requests-list">
            {requests.map(req => (
              <div key={req.request_id} className="request-item">
                <div className="request-header">
                  <h4>{req.user_name}</h4>
                  <span className={`status status-${req.status}`}>{req.status.toUpperCase()}</span>
                </div>
                <p><strong>Email:</strong> {req.email}</p>
                <p><strong>Chief Complaint:</strong> {req.title}</p>
                <p><strong>Details:</strong> {req.description}</p>
                <p className="request-date">Assigned: {req.requested_date}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// MY PATIENTS
// ============================================
function MyPatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await apiFetch(`${API_BASE}/dermatologist/my-patients`);
      const data = await response.json();
      setPatients(data.patients || []);
      setLoading(false);
    } catch (err) {
      setError('Failed to load patients');
      setLoading(false);
    }
  };

  if (loading) return <div className="page-container"><p>Loading...</p></div>;

  if (selectedPatient) {
    return <PatientInspection patientId={selectedPatient} onBack={() => setSelectedPatient(null)} />;
  }

  return (
    <div className="page-container">
      <div className="card-container">
        <h2>Patient Records</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>View your assigned patients and their complete medical records</p>

        {error && <div className="error-message">{error}</div>}

        {patients.length === 0 ? (
          <div style={{ padding: '20px', background: '#f9f9f9', borderRadius: '8px', textAlign: 'center' }}>
            <p>No patients assigned yet</p>
          </div>
        ) : (
          <div className="patients-roster">
            {patients.map(patient => (
              <div
                key={patient.user_id}
                className="patient-roster-card"
                onClick={() => setSelectedPatient(patient.user_id)}
                style={{ cursor: 'pointer' }}
              >
                <div className="patient-header">
                  <h4>{patient.first_name} {patient.last_name}</h4>
                  <div className="assigned-badge">Assigned</div>
                </div>
                <p><strong>Email:</strong> {patient.email}</p>
                <div className="patient-metrics">
                  <div className="metric">
                    <span className="metric-label">Health Score</span>
                    <span className="metric-value">{patient.health_score}/10</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Compliance</span>
                    <span className="metric-value">{patient.compliance_percentage}%</span>
                  </div>
                </div>
                <p className="assigned-date">Assigned: {patient.assigned_date || 'Recently'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// PATIENT INSPECTION
// ============================================
function PatientInspection({ patientId, onBack }) {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchPatientData();
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      const response = await apiFetch(`${API_BASE}/dermatologist/patient-inspection/${patientId}`);
      const data = await response.json();
      setPatient(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load patient data');
      setLoading(false);
    }
  };

  if (loading) return <div className="page-container"><p>Loading...</p></div>;

  if (!patient) return <div className="page-container"><p>Patient not found</p></div>;

  return (
    <div className="page-container">
      <div className="card-container">
        <button onClick={onBack} className="btn btn-secondary btn-sm" style={{ marginBottom: '20px' }}>
          Back to Patients
        </button>

        <div className="inspection-header">
          <div>
            <h2>{patient.user.first_name} {patient.user.last_name}</h2>
            <p style={{ color: '#666' }}>{patient.user.email}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p><strong>Health Score:</strong> {patient.user.health_score}/10</p>
            <p><strong>Compliance:</strong> {patient.user.compliance_percentage}%</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid var(--border-light)', paddingBottom: '10px' }}>
          {['overview', 'lifestyle', 'screening', 'routine'].map(tab => (
            <button
              key={tab}
              className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab(tab)}
              style={{ textTransform: 'capitalize' }}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div>
            <div className="inspection-section">
              <h3>Patient Information</h3>
              <p><strong>Age:</strong> {patient.user.age || '-'}</p>
              <p><strong>Gender:</strong> {patient.user.gender || '-'}</p>
              <p><strong>Health Score:</strong> {patient.user.health_score}/10</p>
              <p><strong>Compliance Rate:</strong> {patient.user.compliance_percentage}%</p>
            </div>
          </div>
        )}

        {activeTab === 'lifestyle' && (
          <div className="inspection-section">
            <h3>Lifestyle Data (Last 30 Days)</h3>
            {patient.lifestyle && patient.lifestyle.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--primary-rose)', color: 'white' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Sleep (h)</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Water (L)</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Stress</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Exercise</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patient.lifestyle.map((log, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px' }}>{log.date}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>{log.sleep}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>{log.water}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>{log.stress}/10</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>{log.exercise}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No lifestyle data available</p>
            )}
          </div>
        )}

        {activeTab === 'screening' && (
          <div className="inspection-section">
            <h3>Dermatological Assessment</h3>
            {patient.screening ? (
              <>
                <p><strong>Skin Condition:</strong> {patient.screening.analysis?.condition || '-'}</p>
                <p><strong>Diagnostic Confidence:</strong> {patient.screening.analysis?.confidence || '-'}%</p>
                <p><strong>Clinical Recommendations:</strong> {patient.screening.analysis?.recommendations || '-'}</p>
                <p style={{ fontSize: '12px', color: '#999' }}>Assessment: {patient.screening.created_at}</p>
              </>
            ) : (
              <p>No assessment available</p>
            )}
          </div>
        )}

        {activeTab === 'routine' && (
          <div className="inspection-section">
            <h3>Current Skincare Regimen</h3>
            {patient.routine && patient.routine.length > 0 ? (
              <div className="routine-display">
                <ul>
                  {patient.routine.map(step => (
                    <li key={step.routine_id}>
                      <strong>{step.routine_step}</strong>
                      <br />
                      <small style={{ color: '#999' }}>{step.frequency}</small>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p>No routine defined</p>
            )}
          </div>
        )}

        <div style={{ marginTop: '30px', display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-primary"
            onClick={() => onBack()}
          >
            Back to Patients
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// SEND TREATMENT PLAN
// ============================================
function SendRecommendation() {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [formData, setFormData] = useState({
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
      const response = await apiFetch(`${API_BASE}/dermatologist/my-patients`);
      const data = await response.json();
      setPatients(data.patients || []);
      setLoading(false);
    } catch (err) {
      setError('Failed to load patients');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSend = async () => {
    if (!selectedPatient || !formData.recommendation_text) {
      setError('Please select a patient and create a treatment plan');
      return;
    }

    try {
      const response = await apiFetch(`${API_BASE}/dermatologist/send-recommendation`, {
        method: 'POST',
        body: JSON.stringify({
          user_id: parseInt(selectedPatient),
          ...formData
        })
      });

      if (response.ok) {
        setSuccess('Treatment plan created and sent');
        setFormData({
          recommendation_text: '',
          product_suggestions: '',
          routine_suggestions: ''
        });
        setSelectedPatient('');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to send treatment plan');
      }
    } catch (err) {
      setError('Error: ' + err.message);
    }
  };

  if (loading) return <div className="page-container"><p>Loading...</p></div>;

  return (
    <div className="page-container">
      <div className="card-container">
        <h2>Create Treatment Plan</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>Design and send specialized treatment protocols to patients</p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="recommendation-form">
          <div className="form-group">
            <label>Select Patient</label>
            <select
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
            >
              <option value="">Choose a patient...</option>
              {patients.map(p => (
                <option key={p.user_id} value={p.user_id}>
                  {p.first_name} {p.last_name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Clinical Assessment & Treatment Protocol</label>
            <textarea
              name="recommendation_text"
              value={formData.recommendation_text}
              onChange={handleInputChange}
              placeholder="Document clinical findings, diagnosis, and detailed treatment protocol..."
              rows="6"
            ></textarea>
          </div>

          <div className="form-group">
            <label>Prescribed Products</label>
            <textarea
              name="product_suggestions"
              value={formData.product_suggestions}
              onChange={handleInputChange}
              placeholder="List specific products with instructions..."
              rows="3"
            ></textarea>
          </div>

          <div className="form-group">
            <label>Routine Protocol</label>
            <textarea
              name="routine_suggestions"
              value={formData.routine_suggestions}
              onChange={handleInputChange}
              placeholder="Define treatment schedule and routine changes..."
              rows="3"
            ></textarea>
          </div>

          <button className="btn btn-primary" onClick={handleSend}>
            Create & Send Treatment Plan
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// PROFILE
// ============================================
function Profile() {
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await apiFetch(`${API_BASE}/dermatologist/profile`);
      const data = await response.json();
      setProfile(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load profile');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      const response = await apiFetch(`${API_BASE}/dermatologist/profile/update`, {
        method: 'PUT',
        body: JSON.stringify(profile)
      });

      if (response.ok) {
        setSuccess('Profile updated successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to update');
      }
    } catch (err) {
      setError('Error: ' + err.message);
    }
  };

  if (loading) return <div className="page-container"><p>Loading...</p></div>;

  return (
    <div className="page-container">
      <div className="card-container">
        <h2>Professional Profile</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>Manage your professional information</p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="profile-form">
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                name="first_name"
                value={profile.first_name}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                name="last_name"
                value={profile.last_name}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={profile.email}
              disabled
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
            />
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              name="phone"
              value={profile.phone}
              onChange={handleChange}
            />
          </div>

          <button className="btn btn-primary" onClick={handleSubmit}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function DermatologistDashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { id: 'home', label: 'Dashboard', icon: '▦' },
    { id: 'requests', label: 'Cases', icon: 'C' },
    { id: 'patients', label: 'Patients', icon: 'P' },
    { id: 'treatment', label: 'Treatment Plans', icon: 'T' },
    { id: 'profile', label: 'Profile', icon: 'U' }
  ];

  const renderPage = () => {
    switch(currentPage) {
      case 'home': return <DashboardHome />;
      case 'requests': return <ConsultationRequests />;
      case 'patients': return <MyPatients />;
      case 'treatment': return <SendRecommendation />;
      case 'profile': return <Profile />;
      default: return <DashboardHome />;
    }
  };

  return (
    <div className="dashboard-container">
      <div className={`dashboard-sidebar ${!sidebarOpen ? 'closed' : ''}`}>
        <div className="sidebar-header">
          <h2>Glow & Thrive</h2>
          <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? '‹' : '›'}
          </button>
        </div>

        <div className="sidebar-menu">
          {menuItems.map(item => (
            <button
              key={item.id}
              className={`menu-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => setCurrentPage(item.id)}
            >
              <span className="menu-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <span>Exit</span>
            <span>Logout</span>
          </button>
        </div>
      </div>

      <div className="dashboard-main">
        <div className="dashboard-header">
          <h1>{menuItems.find(m => m.id === currentPage)?.label || 'Dashboard'}</h1>
          <div className="user-info">
            <span>{user?.first_name} {user?.last_name}</span>
          </div>
        </div>

        <div className="dashboard-content">
          {renderPage()}
        </div>
      </div>
    </div>
  );
}