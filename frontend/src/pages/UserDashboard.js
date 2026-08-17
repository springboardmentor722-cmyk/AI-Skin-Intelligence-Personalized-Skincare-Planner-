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
  const [userStats, setUserStats] = useState({
    health_score: 7.5,
    compliance_percentage: 85,
    routines_completed: 12,
    days_active: 28
  });

  return (
    <div className="page-container">
      <div className="dashboard-home">
        <div className="welcome-section">
          <h2>Welcome to Your Skincare Journey</h2>
          <p>Track your progress, follow personalized routines, and achieve your skin goals with expert guidance.</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
              <h3>Skin Health Score</h3>
              <p>{userStats.health_score}/10</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">✓</div>
            <div className="stat-content">
              <h3>Compliance Rate</h3>
              <p>{userStats.compliance_percentage}%</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <h3>Routines Completed</h3>
              <p>{userStats.routines_completed}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h3>Days Active</h3>
              <p>{userStats.days_active}</p>
            </div>
          </div>
        </div>

        <div className="card-container">
          <h2>Your Skincare Path</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>Complete these steps to optimize your skincare routine</p>
          <div className="timeline">
            <div className="timeline-event">
              <div className="timeline-marker"></div>
              <div className="timeline-content">
                <div className="timeline-type">Profile Setup</div>
                <div className="timeline-date">Step 1</div>
                <p>Tell us about your skin type, concerns, and goals</p>
              </div>
            </div>

            <div className="timeline-event">
              <div className="timeline-marker"></div>
              <div className="timeline-content">
                <div className="timeline-type">Lifestyle Tracking</div>
                <div className="timeline-date">Step 2</div>
                <p>Log your daily habits to understand skin patterns</p>
              </div>
            </div>

            <div className="timeline-event">
              <div className="timeline-marker"></div>
              <div className="timeline-content">
                <div className="timeline-type">AI Skin Screening</div>
                <div className="timeline-date">Step 3</div>
                <p>Get personalized analysis of your skin condition</p>
              </div>
            </div>

            <div className="timeline-event">
              <div className="timeline-marker"></div>
              <div className="timeline-content">
                <div className="timeline-type">Expert Consultation</div>
                <div className="timeline-date">Step 4</div>
                <p>Connect with dermatologists for professional guidance</p>
              </div>
            </div>
          </div>
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
    phone: '',
    age: '',
    gender: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await apiFetch(`${API_BASE}/user/profile`);
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
      const response = await apiFetch(`${API_BASE}/user/profile`, {
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
        <h2>Personal Profile</h2>
        <p style={{ color: '#666', marginBottom: '30px' }}>Manage your account information</p>

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
                placeholder="Enter first name"
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input 
                type="text" 
                name="last_name" 
                value={profile.last_name} 
                onChange={handleChange}
                placeholder="Enter last name"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input 
                type="email" 
                value={profile.email} 
                disabled
                placeholder="Email"
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
              <small>Email cannot be changed</small>
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input 
                type="tel" 
                name="phone" 
                value={profile.phone} 
                onChange={handleChange}
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Age</label>
              <input 
                type="number" 
                name="age" 
                value={profile.age} 
                onChange={handleChange}
                placeholder="Enter age"
              />
            </div>
            <div className="form-group">
              <label>Gender</label>
              <select name="gender" value={profile.gender} onChange={handleChange}>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleSubmit}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// LIFESTYLE
// ============================================
function Lifestyle() {
  const [lifestyle, setLifestyle] = useState({
    sleep_duration: '',
    water_intake: '',
    stress_level: '',
    exercise_duration: '',
    exercise_type: '',
    environmental_exposure: '',
    notes: ''
  });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [view, setView] = useState('log');

  useEffect(() => {
    if (view === 'log') {
      setLoading(false);
    } else {
      fetchHistory();
    }
  }, [view]);

  const fetchHistory = async () => {
    try {
      const response = await apiFetch(`${API_BASE}/lifestyle/history/30days`);
      const data = await response.json();
      setHistory(data.history || []);
      setLoading(false);
    } catch (err) {
      setError('Failed to load history: ' + err.message);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLifestyle(prev => ({ 
      ...prev, 
      [name]: name.includes('duration') || name.includes('level') ? parseFloat(value) || '' : value
    }));
  };

  const handleLog = async () => {
    if (!lifestyle.sleep_duration || !lifestyle.water_intake || lifestyle.stress_level === '') {
      setError('Please fill: Sleep duration, Water intake, and Stress level');
      return;
    }

    try {
      const response = await apiFetch(`${API_BASE}/lifestyle/log`, {
        method: 'POST',
        body: JSON.stringify({
          sleep_duration: parseFloat(lifestyle.sleep_duration),
          water_intake: parseInt(lifestyle.water_intake),
          stress_level: parseInt(lifestyle.stress_level),
          exercise_duration: lifestyle.exercise_duration ? parseInt(lifestyle.exercise_duration) : 0,
          exercise_type: lifestyle.exercise_type || '',
          environmental_exposure: lifestyle.environmental_exposure || '',
          notes: lifestyle.notes || ''
        })
      });

      if (response.ok) {
        setSuccess('Lifestyle logged successfully for today!');
        setLifestyle({ 
          sleep_duration: '', 
          water_intake: '', 
          stress_level: '', 
          exercise_duration: '',
          exercise_type: '',
          environmental_exposure: '',
          notes: ''
        });
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to log lifestyle');
      }
    } catch (err) {
      setError('Error: ' + err.message);
    }
  };

  if (loading && view === 'history') return <div className="page-container"><p>Loading...</p></div>;

  return (
    <div className="page-container">
      <div className="card-container">
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button 
            className={`btn ${view === 'log' ? 'btn-primary' : 'btn-secondary'}`} 
            onClick={() => setView('log')}
          >
            Log Today
          </button>
          <button 
            className={`btn ${view === 'history' ? 'btn-primary' : 'btn-secondary'}`} 
            onClick={() => setView('history')}
          >
            30-Day History
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {view === 'log' ? (
          <>
            <h2>Daily Lifestyle Tracking</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>Log your daily habits to track your skin health progress</p>
            
            <div className="form-group">
              <label>Hours Slept (required)</label>
              <input 
                type="number" 
                step="0.5" 
                name="sleep_duration" 
                value={lifestyle.sleep_duration} 
                onChange={handleChange} 
                placeholder="e.g., 7.5"
              />
              <small>Recommended: 7-9 hours for optimal skin health</small>
            </div>

            <div className="form-group">
              <label>Water Intake in Liters (required)</label>
              <input 
                type="number" 
                step="0.5"
                name="water_intake" 
                value={lifestyle.water_intake} 
                onChange={handleChange} 
                placeholder="e.g., 2.5"
              />
              <small>Recommended: 3 liters per day</small>
            </div>

            <div className="form-group">
              <label>Stress Level 1-10 (required)</label>
              <input 
                type="number" 
                min="1" 
                max="10" 
                name="stress_level" 
                value={lifestyle.stress_level} 
                onChange={handleChange} 
                placeholder="e.g., 5"
              />
              <small>1 = Very low, 10 = Very high</small>
            </div>

            <div className="form-group">
              <label>Exercise Duration (minutes)</label>
              <input 
                type="number" 
                name="exercise_duration" 
                value={lifestyle.exercise_duration} 
                onChange={handleChange} 
                placeholder="e.g., 30"
              />
            </div>

            <div className="form-group">
              <label>Exercise Type</label>
              <input 
                type="text" 
                name="exercise_type" 
                value={lifestyle.exercise_type} 
                onChange={handleChange} 
                placeholder="e.g., Running, Yoga, Gym"
              />
            </div>

            <div className="form-group">
              <label>Environmental Exposure</label>
              <select name="environmental_exposure" value={lifestyle.environmental_exposure} onChange={handleChange}>
                <option value="">Select...</option>
                <option value="Indoor">Indoor</option>
                <option value="Outdoor">Outdoor</option>
                <option value="Mixed">Mixed</option>
              </select>
            </div>

            <div className="form-group">
              <label>Additional Notes</label>
              <textarea 
                name="notes" 
                value={lifestyle.notes} 
                onChange={handleChange} 
                placeholder="Any observations or notes about your day..."
                rows="3"
              ></textarea>
            </div>

            <button className="btn btn-primary" onClick={handleLog}>Log Today</button>
          </>
        ) : (
          <>
            <h2>Last 30 Days Summary</h2>
            {history.length === 0 ? (
              <div style={{ padding: '20px', background: '#f9f9f9', borderRadius: '8px', textAlign: 'center' }}>
                <p>No lifestyle data yet. Start logging today!</p>
              </div>
            ) : (
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
                    {history.map((log, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px' }}>{log.date}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>{log.sleep || '-'}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>{log.water || '-'}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>{log.stress || '-'}/10</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>{log.exercise || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ============================================
// AI SKIN SCREENING
// ============================================
function AISkinScreening() {
  const [screening, setScreening] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);

  const fetchLatestScreening = async () => {
    try {
      const response = await apiFetch(`${API_BASE}/screening/latest`);
      const data = await response.json();
      if (data.screening_id) {
        setScreening(data);
      }
    } catch (err) {
      console.log('No screening yet');
    }
  };

  useEffect(() => {
    fetchLatestScreening();
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError('Please select an image');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);

      const token = getToken();
      const response = await fetch(`${API_BASE}/screening/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setScreening(data);
        setFile(null);
        setError('');
      } else {
        setError('Analysis failed');
      }
    } catch (err) {
      setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="card-container">
        <h2>AI Skin Screening</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>Get personalized skin analysis with advanced AI technology</p>

        {error && <div className="error-message">{error}</div>}

        <div className="inspection-section">
          <h3>Upload Skin Image</h3>
          <div className="form-group">
            <label>Select Image</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={handleFileChange}
            />
            <small>Supported formats: JPG, PNG. Clear lighting recommended.</small>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading ? 'Analyzing...' : 'Analyze Skin'}
          </button>
        </div>

        {screening && (
          <div className="inspection-section">
            <h3>Latest Analysis Results</h3>
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div style={{ background: 'var(--shadow-light)', padding: '20px', borderRadius: '8px' }}>
                  <h4>Skin Condition</h4>
                  <p style={{ color: 'var(--primary-rose)', fontSize: '18px', fontWeight: 'bold', margin: '10px 0' }}>
                    {screening.analysis?.condition || 'Analyzing...'}
                  </p>
                </div>
                <div style={{ background: 'var(--shadow-light)', padding: '20px', borderRadius: '8px' }}>
                  <h4>Confidence Level</h4>
                  <p style={{ color: 'var(--primary-rose)', fontSize: '18px', fontWeight: 'bold', margin: '10px 0' }}>
                    {screening.analysis?.confidence || 0}%
                  </p>
                </div>
              </div>

              <div style={{ background: 'var(--shadow-light)', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                <h4>Detailed Recommendations</h4>
                <p style={{ color: 'var(--text-dark)', lineHeight: '1.8' }}>
                  {screening.analysis?.recommendations || 'Continue with your current routine.'}
                </p>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-lighter)' }}>
                Analysis Date: {screening.created_at}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// SKIN PROFILE
// ============================================
function SkinProfile() {
  const [profile, setProfile] = useState({
    skin_type: '',
    skin_tone: '',
    allergies: '',
    sensitivities: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchSkinProfile();
  }, []);

  const fetchSkinProfile = async () => {
    try {
      const response = await apiFetch(`${API_BASE}/user/skin-profile`);
      const data = await response.json();
      setProfile(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load skin profile');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const response = await apiFetch(`${API_BASE}/user/skin-profile/update`, {
        method: 'PUT',
        body: JSON.stringify(profile)
      });

      if (response.ok) {
        setSuccess('Skin profile updated successfully');
        setIsEditing(false);
        fetchSkinProfile();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        let errorMsg = 'Failed to update profile';
        if (data.detail) {
          errorMsg = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
        }
        setError(errorMsg);
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
          <h2>Skin Profile</h2>
          <button
            className={`btn ${isEditing ? 'btn-secondary' : 'btn-primary'} btn-sm`}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        <p style={{ color: '#666', marginBottom: '20px' }}>Your personalized skin information</p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {isEditing ? (
          <div className="skin-profile-form">
            <div className="form-group">
              <label>Skin Type</label>
              <select name="skin_type" value={profile.skin_type} onChange={handleInputChange}>
                <option value="">Select skin type</option>
                <option value="Dry">Dry</option>
                <option value="Oily">Oily</option>
                <option value="Combination">Combination</option>
                <option value="Normal">Normal</option>
                <option value="Sensitive">Sensitive</option>
              </select>
            </div>

            <div className="form-group">
              <label>Skin Tone</label>
              <input
                type="text"
                name="skin_tone"
                value={profile.skin_tone}
                onChange={handleInputChange}
                placeholder="e.g., Fair, Medium, Dark"
              />
            </div>

            <div className="form-group">
              <label>Allergies</label>
              <textarea
                name="allergies"
                value={profile.allergies}
                onChange={handleInputChange}
                placeholder="List any known allergies (comma separated)"
                rows="3"
              ></textarea>
            </div>

            <div className="form-group">
              <label>Sensitivities</label>
              <textarea
                name="sensitivities"
                value={profile.sensitivities}
                onChange={handleInputChange}
                placeholder="List sensitive ingredients or concerns"
                rows="3"
              ></textarea>
            </div>

            <button className="btn btn-primary" onClick={handleSave}>
              Save Profile
            </button>
          </div>
        ) : (
          <div className="skin-profile-display">
            <div style={{ padding: '15px', background: '#f9f9f9', borderRadius: '8px', marginBottom: '15px' }}>
              <p><strong>Skin Type:</strong> {profile.skin_type || 'Not specified'}</p>
              <p><strong>Skin Tone:</strong> {profile.skin_tone || 'Not specified'}</p>
            </div>

            {profile.allergies && (
              <div style={{ padding: '15px', background: '#fff5f5', borderRadius: '8px', marginBottom: '15px', border: '1px solid #fdd' }}>
                <p><strong>Allergies:</strong></p>
                <p style={{ color: '#666', margin: '5px 0' }}>{profile.allergies}</p>
              </div>
            )}

            {profile.sensitivities && (
              <div style={{ padding: '15px', background: '#f5f9ff', borderRadius: '8px', border: '1px solid #ddf' }}>
                <p><strong>Sensitivities:</strong></p>
                <p style={{ color: '#666', margin: '5px 0' }}>{profile.sensitivities}</p>
              </div>
            )}

            {!profile.skin_type && (
              <div style={{ padding: '20px', background: '#f9f9f9', borderRadius: '8px', textAlign: 'center' }}>
                <p>No skin profile data yet</p>
                <p style={{ fontSize: '13px', color: '#999' }}>Click Edit to add your skin information</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
// ============================================
// MY ROUTINE
// ============================================
function MyRoutine() {
  const [routine, setRoutine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    routine_type: '',
    product_name: '',
    duration_minutes: 0,
    description: ''
  });

  useEffect(() => {
    fetchRoutine();
  }, []);

  const fetchRoutine = async () => {
    try {
      const response = await apiFetch(`${API_BASE}/routine/`);
      const data = await response.json();
      setRoutine(data.routine || []);
      setLoading(false);
    } catch (err) {
      setError('Failed to load routine');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration_minutes' ? parseInt(value) || 0 : value
    }));
  };

  const handleAddStep = async () => {
    if (!formData.routine_type) {
      setError('Please fill in routine type');
      return;
    }

    try {
      const response = await apiFetch(`${API_BASE}/routine/`, {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSuccess('Routine step added successfully');
        setFormData({
          routine_type: '',
          product_name: '',
          duration_minutes: 0,
          description: ''
        });
        setShowForm(false);
        fetchRoutine();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        // Properly extract error message
        let errorMsg = 'Failed to add routine step';
        if (data.detail) {
          if (typeof data.detail === 'string') {
            errorMsg = data.detail;
          } else if (Array.isArray(data.detail)) {
            errorMsg = data.detail.map(err => 
              typeof err === 'string' ? err : (err.msg || JSON.stringify(err))
            ).join(', ');
          }
        }
        setError(errorMsg);
      }
    } catch (err) {
      setError('Error: ' + (typeof err.message === 'string' ? err.message : 'Unknown error'));
    }
  };

  const handleDeleteStep = async (routineId) => {
    if (window.confirm('Delete this routine step?')) {
      try {
        const response = await apiFetch(`${API_BASE}/routine/${routineId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          setSuccess('Routine step deleted');
          fetchRoutine();
          setTimeout(() => setSuccess(''), 3000);
        } else {
          setError('Failed to delete step');
        }
      } catch (err) {
        setError('Error: ' + err.message);
      }
    }
  };

  if (loading) return <div className="page-container"><p>Loading...</p></div>;

  return (
    <div className="page-container">
      <div className="card-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>My Skincare Routine</h2>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : 'Add Step'}
          </button>
        </div>

        <p style={{ color: '#666', marginBottom: '20px' }}>Build your personalized skincare routine</p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {showForm && (
          <div className="inspection-section" style={{ marginBottom: '30px' }}>
            <h3>Add New Routine Step</h3>

            <div className="form-group">
              <label>Routine Type (e.g., Cleanse, Tone, Moisturize, Treat)</label>
              <input
                type="text"
                name="routine_type"
                value={formData.routine_type}
                onChange={handleInputChange}
                placeholder="e.g., Apply cleanser"
              />
            </div>

            <div className="form-group">
              <label>Product Name (Optional)</label>
              <input
                type="text"
                name="product_name"
                value={formData.product_name}
                onChange={handleInputChange}
                placeholder="e.g., CeraVe Cleanser"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Duration (Minutes)</label>
                <input
                  type="number"
                  name="duration_minutes"
                  value={formData.duration_minutes}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Description (Optional)</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="e.g., Massage gently"
                />
              </div>
            </div>

            <button className="btn btn-primary" onClick={handleAddStep}>
              Add Step
            </button>
          </div>
        )}

        {routine.length === 0 ? (
          <div style={{ padding: '20px', background: '#f9f9f9', borderRadius: '8px', textAlign: 'center' }}>
            <p>No routine steps yet</p>
            <p style={{ fontSize: '13px', color: '#999' }}>Add steps to build your routine</p>
          </div>
        ) : (
          <div className="routine-list">
            {routine.map((step, idx) => (
              <div key={step.routine_id} className="routine-step-card" style={{ marginBottom: '15px', padding: '15px', border: '1px solid #eee', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 5px 0' }}>Step {idx + 1}: {step.routine_type}</h4>
                    {step.product_name && <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}><strong>Product:</strong> {step.product_name}</p>}
                    {step.duration_minutes > 0 && <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}><strong>Duration:</strong> {step.duration_minutes} min</p>}
                    {step.description && <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}><strong>Notes:</strong> {step.description}</p>}
                  </div>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDeleteStep(step.routine_id)}
                    style={{ marginLeft: '10px' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Products() {
  const [allProducts, setAllProducts] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('recommended');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      // Fetch recommended products
      try {
        const recResponse = await apiFetch(`${API_BASE}/user/products/recommended`);
        const recData = await recResponse.json();
        if (recData.recommended_products) {
          setRecommendedProducts(recData.recommended_products);
        }
      } catch (err) {
        console.log('Recommended products not available');
      }

      // Fetch all products
      try {
        const allResponse = await apiFetch(`${API_BASE}/user/products/`);
        const allData = await allResponse.json();
        if (allData.products) {
          setAllProducts(allData.products);
        }
      } catch (err) {
        console.log('All products error:', err);
      }

      setLoading(false);
    } catch (err) {
      setError('Failed to load products');
      setLoading(false);
    }
  };

  if (loading) return <div className="page-container"><p>Loading...</p></div>;

  return (
    <div className="page-container">
      <div className="card-container">
        <h2>Skincare Products</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>Discover products tailored to your skin needs</p>

        {error && <div className="error-message">{error}</div>}

        {/* TABS */}
        {recommendedProducts.length > 0 && (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
            <button
              onClick={() => setActiveTab('recommended')}
              style={{
                padding: '10px 20px',
                background: activeTab === 'recommended' ? 'var(--primary-rose)' : 'transparent',
                color: activeTab === 'recommended' ? 'white' : 'var(--text-dark)',
                border: 'none',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px'
              }}
            >
              ⭐ Recommended For You ({recommendedProducts.length})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              style={{
                padding: '10px 20px',
                background: activeTab === 'all' ? 'var(--primary-rose)' : 'transparent',
                color: activeTab === 'all' ? 'white' : 'var(--text-dark)',
                border: 'none',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px'
              }}
            >
              📦 All Products ({allProducts.length})
            </button>
          </div>
        )}

        {/* RECOMMENDED PRODUCTS SECTION */}
        {activeTab === 'recommended' && recommendedProducts.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 15px 0' }}>
                <span style={{ fontSize: '24px' }}>✨</span> Recommended For You
              </h3>
              <p style={{ color: '#666', margin: '0', fontSize: '14px' }}>
                Based on your skin profile, we've selected these products perfect for your skincare routine
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              {recommendedProducts.map((product) => (
                <div
                  key={product.product_id}
                  style={{
                    padding: '15px',
                    background: 'linear-gradient(135deg, #FFF8F6 0%, #fff5f1 100%)',
                    border: '2px solid var(--primary-rose)',
                    borderRadius: '12px',
                    transition: 'all 0.3s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(183, 110, 121, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Badge */}
                  <div style={{
                    display: 'inline-block',
                    background: 'var(--primary-rose)',
                    color: 'white',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: '600',
                    marginBottom: '10px'
                  }}>
                    💡 {product.reason}
                  </div>

                  {/* Product Name */}
                  <h4 style={{
                    margin: '10px 0 5px 0',
                    fontSize: '16px',
                    color: 'var(--text-dark)',
                    fontWeight: '600'
                  }}>
                    {product.name}
                  </h4>

                  {/* Brand */}
                  <p style={{
                    margin: '0 0 10px 0',
                    fontSize: '13px',
                    color: 'var(--text-light)'
                  }}>
                    {product.brand}
                  </p>

                  {/* Rating */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    marginBottom: '10px'
                  }}>
                    <span style={{ color: 'var(--gold-accent)', fontSize: '14px' }}>
                      {'⭐'.repeat(Math.round(product.rating))}
                    </span>
                    <span style={{ fontSize: '13px', color: '#666' }}>
                      {product.rating ? product.rating.toFixed(1) : 'N/A'}
                    </span>
                  </div>

                  {/* Price & Size */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '10px',
                    borderTop: '1px solid rgba(183, 110, 121, 0.2)'
                  }}>
                    <div>
                      <p style={{ margin: '0', fontSize: '14px', fontWeight: '600', color: 'var(--primary-rose)' }}>
                        ${product.price.toFixed(2)}
                      </p>
                      <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#999' }}>
                        {product.size}
                      </p>
                    </div>
                    <button
                      className="btn btn-sm"
                      style={{
                        padding: '6px 12px',
                        background: 'var(--primary-rose)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                    >
                      Learn More
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ALL PRODUCTS SECTION */}
        {(activeTab === 'all' || recommendedProducts.length === 0) && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 15px 0' }}>
                <span style={{ fontSize: '24px' }}>📦</span> All Skincare Products
              </h3>
              <p style={{ color: '#666', margin: '0', fontSize: '14px' }}>
                Browse our complete collection of skincare products
              </p>
            </div>

            {allProducts.length === 0 ? (
              <div style={{ padding: '40px', background: '#f9f9f9', borderRadius: '8px', textAlign: 'center' }}>
                <p style={{ fontSize: '16px', color: '#666' }}>No products available</p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '15px'
              }}>
                {allProducts.map((product) => (
                  <div
                    key={product.product_id}
                    style={{
                      padding: '12px',
                      background: 'white',
                      border: '1px solid #eee',
                      borderRadius: '8px',
                      transition: 'all 0.3s',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Product Name */}
                    <h4 style={{
                      margin: '0 0 5px 0',
                      fontSize: '14px',
                      color: 'var(--text-dark)',
                      fontWeight: '600'
                    }}>
                      {product.name}
                    </h4>

                    {/* Brand */}
                    <p style={{
                      margin: '0 0 8px 0',
                      fontSize: '12px',
                      color: 'var(--text-light)'
                    }}>
                      {product.brand}
                    </p>

                    {/* Rating */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      marginBottom: '8px'
                    }}>
                      <span style={{ fontSize: '12px', color: 'var(--gold-accent)' }}>
                        {'⭐'.repeat(Math.round(product.rating))}
                      </span>
                      <span style={{ fontSize: '11px', color: '#999' }}>
                        {product.rating ? product.rating.toFixed(1) : 'N/A'}
                      </span>
                    </div>

                    {/* Price & Size */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '8px',
                      borderTop: '1px solid #eee'
                    }}>
                      <div>
                        <p style={{ margin: '0', fontSize: '12px', fontWeight: '600', color: 'var(--primary-rose)' }}>
                          ${product.price.toFixed(2)}
                        </p>
                        <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#999' }}>
                          {product.size}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// INGREDIENTS
// ============================================
function Ingredients() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    try {
      const response = await apiFetch(`${API_BASE}/user/ingredients?limit=500`);
      const data = await response.json();
      setIngredients(data.ingredients || []);
      setLoading(false);
    } catch (err) {
      setError('Failed to load ingredients');
      setLoading(false);
    }
  };

  if (loading) return <div className="page-container"><p>Loading...</p></div>;

  const filteredIngredients = ingredients.filter(i =>
    i.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="card-container">
        <h2>Active Ingredients Guide</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>Learn about key skincare ingredients and their benefits</p>

        {error && <div className="error-message">{error}</div>}

        <div className="search-box">
          <input 
            type="text"
            placeholder="Search ingredients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {filteredIngredients.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999' }}>No ingredients found</p>
        ) : (
          <div className="ingredients-list">
            {filteredIngredients.map(ingredient => (
              <div key={ingredient.ingredient_id} className="ingredient-card">
                <h4>{ingredient.name}</h4>
                <p><strong>Benefits:</strong> {ingredient.benefits || 'Multiple skin benefits'}</p>
                <p><strong>Concern:</strong> {ingredient.skin_concern || 'General skincare'}</p>
                <p style={{ fontSize: '13px', color: '#999' }}>{ingredient.description || 'Premium active ingredient'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// PROGRESS
// ============================================
function Progress() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [beforePhoto, setBeforePhoto] = useState(null);
  const [afterPhoto, setAfterPhoto] = useState(null);
  const [uploadingBefore, setUploadingBefore] = useState(false);
  const [uploadingAfter, setUploadingAfter] = useState(false);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [progressNotes, setProgressNotes] = useState('');
  const [showProgressForm, setShowProgressForm] = useState(false);
  const [tempProgress, setTempProgress] = useState(50);

  useEffect(() => {
    fetchPhotos();
    fetchProgress();
  }, []);

  const fetchPhotos = async () => {
    try {
      const response = await apiFetch(`${API_BASE}/user/progress/photos`);
      const data = await response.json();
      setPhotos(data.photos || []);
      setLoading(false);
    } catch (err) {
      setError('Failed to load photos');
      setLoading(false);
    }
  };

  const fetchProgress = async () => {
    try {
      const response = await apiFetch(`${API_BASE}/user/progress/stats`);
      if (response.ok) {
        const data = await response.json();
        setProgressPercentage(data.progress_percentage || 0);
        setProgressNotes(data.notes || '');
      }
    } catch (err) {
      // Progress stats might not exist yet
    }
  };

  const handleBeforePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setBeforePhoto(e.target.files[0]);
    }
  };

  const handleAfterPhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAfterPhoto(e.target.files[0]);
    }
  };

  const uploadPhoto = async (file, type) => {
    if (!file) {
      setError('Please select a photo');
      return;
    }

    try {
      if (type === 'before') setUploadingBefore(true);
      if (type === 'after') setUploadingAfter(true);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('photo_type', type);

      const token = getToken();
      const response = await fetch(`${API_BASE}/user/progress/upload-photo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        setSuccess(`${type === 'before' ? 'Before' : 'After'} photo uploaded successfully`);
        if (type === 'before') {
          setBeforePhoto(null);
          document.getElementById('beforePhotoInput').value = '';
        } else {
          setAfterPhoto(null);
          document.getElementById('afterPhotoInput').value = '';
        }
        fetchPhotos();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.detail || 'Upload failed');
      }
    } catch (err) {
      setError('Error uploading photo: ' + err.message);
    } finally {
      if (type === 'before') setUploadingBefore(false);
      if (type === 'after') setUploadingAfter(false);
    }
  };

  const handleSaveProgress = async () => {
    try {
      const response = await apiFetch(`${API_BASE}/user/progress/update`, {
        method: 'POST',
        body: JSON.stringify({
          progress_percentage: tempProgress,
          notes: progressNotes
        })
      });

      if (response.ok) {
        setProgressPercentage(tempProgress);
        setSuccess('Progress updated successfully');
        setShowProgressForm(false);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to update progress');
      }
    } catch (err) {
      setError('Error: ' + err.message);
    }
  };

  if (loading) return <div className="page-container"><p>Loading...</p></div>;

  // Separate before and after photos
  const beforePhotos = photos.filter(p => p.photo_type === 'before');
  const afterPhotos = photos.filter(p => p.photo_type === 'after');

  return (
    <div className="page-container">
      <div className="card-container">
        <h2>Progress Tracking</h2>
        <p style={{ color: '#666', marginBottom: '30px' }}>Track your skincare journey with before and after photos</p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {/* PROGRESS BAR */}
        <div style={{ marginBottom: '30px', padding: '20px', background: '#f9f9f9', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ margin: 0 }}>Overall Progress</h3>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowProgressForm(!showProgressForm)}
            >
              {showProgressForm ? 'Cancel' : 'Update Progress'}
            </button>
          </div>

          {/* Progress Bar */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{
              width: '100%',
              height: '30px',
              background: '#eee',
              borderRadius: '15px',
              overflow: 'hidden',
              border: '2px solid var(--primary-rose)'
            }}>
              <div style={{
                width: `${progressPercentage}%`,
                height: '100%',
                background: `linear-gradient(90deg, var(--primary-rose), var(--gold-accent))`,
                transition: 'width 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {progressPercentage > 10 && `${progressPercentage}%`}
              </div>
            </div>
            {progressPercentage <= 10 && (
              <div style={{ textAlign: 'right', marginTop: '5px', fontWeight: 'bold', color: 'var(--primary-rose)' }}>
                {progressPercentage}%
              </div>
            )}
          </div>

          {progressPercentage < 50 && (
            <p style={{ color: '#ff9800', margin: '10px 0 0 0', fontSize: '13px' }}>
              Keep going! You're on your way to better skin. 💪
            </p>
          )}
          {progressPercentage >= 50 && progressPercentage < 80 && (
            <p style={{ color: '#2196f3', margin: '10px 0 0 0', fontSize: '13px' }}>
              Great progress! Your efforts are showing results. ✨
            </p>
          )}
          {progressPercentage >= 80 && (
            <p style={{ color: '#51cf66', margin: '10px 0 0 0', fontSize: '13px' }}>
              Fantastic! You've achieved significant improvement! 🎉
            </p>
          )}

          {/* Progress Update Form */}
          {showProgressForm && (
            <div style={{ marginTop: '20px', padding: '15px', background: 'white', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
              <div className="form-group">
                <label>Progress Percentage</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={tempProgress}
                    onChange={(e) => setTempProgress(parseInt(e.target.value))}
                    style={{ flex: 1 }}
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={tempProgress}
                    onChange={(e) => setTempProgress(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                    style={{ width: '60px' }}
                  />
                  <span>%</span>
                </div>
              </div>

              <div className="form-group">
                <label>Progress Notes</label>
                <textarea
                  value={progressNotes}
                  onChange={(e) => setProgressNotes(e.target.value)}
                  placeholder="e.g., Skin looks clearer, fewer breakouts, more radiant..."
                  rows="3"
                ></textarea>
              </div>

              <button className="btn btn-primary" onClick={handleSaveProgress}>
                Save Progress
              </button>
            </div>
          )}
        </div>

        {/* PHOTO UPLOAD SECTION */}
        <div className="progress-upload-section" style={{ marginBottom: '30px', padding: '20px', background: '#f9f9f9', borderRadius: '8px' }}>
          <h3>Upload Progress Photos</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
            {/* BEFORE PHOTO */}
            <div>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600' }}>Before Photo</label>
              <div style={{ border: '2px dashed #ddd', borderRadius: '8px', padding: '20px', textAlign: 'center' }}>
                {beforePhoto ? (
                  <div>
                    <img
                      src={URL.createObjectURL(beforePhoto)}
                      alt="Before"
                      style={{ maxHeight: '150px', borderRadius: '8px', marginBottom: '10px' }}
                    />
                    <p style={{ fontSize: '13px', color: '#666' }}>{beforePhoto.name}</p>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: '40px', marginBottom: '10px' }}>📸</p>
                    <p style={{ color: '#666' }}>Select a before photo</p>
                  </div>
                )}
              </div>

              <input
                id="beforePhotoInput"
                type="file"
                accept="image/*"
                onChange={handleBeforePhotoChange}
                style={{ marginTop: '10px', display: 'block', width: '100%' }}
              />

              <button
                className="btn btn-primary"
                onClick={() => uploadPhoto(beforePhoto, 'before')}
                disabled={!beforePhoto || uploadingBefore}
                style={{ width: '100%', marginTop: '10px' }}
              >
                {uploadingBefore ? 'Uploading...' : 'Upload Before Photo'}
              </button>
            </div>

            {/* AFTER PHOTO */}
            <div>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600' }}>After Photo</label>
              <div style={{ border: '2px dashed #ddd', borderRadius: '8px', padding: '20px', textAlign: 'center' }}>
                {afterPhoto ? (
                  <div>
                    <img
                      src={URL.createObjectURL(afterPhoto)}
                      alt="After"
                      style={{ maxHeight: '150px', borderRadius: '8px', marginBottom: '10px' }}
                    />
                    <p style={{ fontSize: '13px', color: '#666' }}>{afterPhoto.name}</p>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: '40px', marginBottom: '10px' }}>📸</p>
                    <p style={{ color: '#666' }}>Select an after photo</p>
                  </div>
                )}
              </div>

              <input
                id="afterPhotoInput"
                type="file"
                accept="image/*"
                onChange={handleAfterPhotoChange}
                style={{ marginTop: '10px', display: 'block', width: '100%' }}
              />

              <button
                className="btn btn-primary"
                onClick={() => uploadPhoto(afterPhoto, 'after')}
                disabled={!afterPhoto || uploadingAfter}
                style={{ width: '100%', marginTop: '10px' }}
              >
                {uploadingAfter ? 'Uploading...' : 'Upload After Photo'}
              </button>
            </div>
          </div>
        </div>

        {/* BEFORE/AFTER COMPARISON */}
        {beforePhotos.length > 0 && afterPhotos.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h3>Before & After Comparison</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '15px' }}>
              <div>
                <h4 style={{ textAlign: 'center', marginBottom: '10px' }}>Before</h4>
                <img
                  src={`http://127.0.0.1:8000${beforePhotos[0].image_url}`}
                  alt="Before"
                  style={{ width: '100%', borderRadius: '8px', border: '2px solid #ddd' }}
                />
              </div>
              <div>
                <h4 style={{ textAlign: 'center', marginBottom: '10px' }}>After</h4>
                <img
                  src={`http://127.0.0.1:8000${afterPhotos[0].image_url}`}
                  alt="After"
                  style={{ width: '100%', borderRadius: '8px', border: '2px solid #51cf66' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* GALLERY */}
        <div>
          <h3>Your Progress Gallery</h3>
          {photos.length === 0 ? (
            <div style={{ padding: '20px', background: '#f9f9f9', borderRadius: '8px', textAlign: 'center' }}>
              <p>No photos uploaded yet</p>
              <p style={{ fontSize: '13px', color: '#999' }}>Upload photos above to start tracking progress</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px', marginTop: '15px' }}>
              {photos.map((photo, idx) => (
                <div key={idx} style={{ borderRadius: '8px', overflow: 'hidden', border: photo.photo_type === 'after' ? '3px solid #51cf66' : '2px solid #ddd' }}>
                  <img
                    src={`http://127.0.0.1:8000${photo.image_url}`}
                    alt={`Progress ${idx + 1}`}
                    style={{ width: '100%', height: '150px', objectFit: 'cover' }}
                  />
                  <div style={{ padding: '8px', background: '#f9f9f9' }}>
                    <p style={{ margin: '0', fontSize: '12px', fontWeight: '600', textTransform: 'capitalize' }}>
                      {photo.photo_type}
                    </p>
                    <p style={{ margin: '3px 0', fontSize: '11px', color: '#999' }}>
                      {new Date(photo.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// CONSULT EXPERT
// ============================================
function ConsultExpert() {
  const [formData, setFormData] = useState({
    request_type: 'consultant',
    title: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiFetch(`${API_BASE}/user/consultation/submit`, {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess('Consultation request submitted successfully! Admin will review and assign a professional.');
        setFormData({
          request_type: 'consultant',
          title: '',
          description: ''
        });
        setTimeout(() => setSuccess(''), 5000);
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to submit request');
      }
    } catch (err) {
      setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="card-container">
        <h2>Consult an Expert</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          Request a consultation with a skincare consultant or dermatologist for personalized advice
        </p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit} className="consultation-form">
          <div className="form-group">
            <label>What type of professional do you need?</label>
            <select
              name="request_type"
              value={formData.request_type}
              onChange={handleInputChange}
            >
              <option value="consultant">Skincare Consultant</option>
              <option value="dermatologist">Dermatologist (Medical Expert)</option>
            </select>
            <small style={{ color: '#999', display: 'block', marginTop: '5px' }}>
              {formData.request_type === 'consultant' 
                ? 'Consultants provide skincare advice and routine recommendations'
                : 'Dermatologists provide medical expertise for skin conditions'}
            </small>
          </div>

          <div className="form-group">
            <label>Issue Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Persistent Acne, Wrinkle Prevention, Sensitive Skin"
            />
          </div>

          <div className="form-group">
            <label>Describe Your Concern</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Provide details about your skin condition, symptoms, and what you've tried so far..."
              rows="5"
            ></textarea>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Consultation Request'}
          </button>
        </form>

        <div style={{ marginTop: '30px', padding: '15px', background: '#f9f9f9', borderRadius: '8px' }}>
          <h4>What Happens Next?</h4>
          <ol style={{ margin: '10px 0', paddingLeft: '20px', lineHeight: '1.8' }}>
            <li>Your request is submitted to our admin team</li>
            <li>Admin assigns an appropriate professional (consultant or dermatologist)</li>
            <li>The professional reviews your case</li>
            <li>You receive personalized recommendations in "My Consultation" section</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MY CONSULTANT
// ============================================
function MyConsultant() {
  const [requests, setRequests] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('requests');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all requests
      const reqResponse = await apiFetch(`${API_BASE}/user/consultation/my-requests`);
      const reqData = await reqResponse.json();
      setRequests(reqData.requests || []);

      // Fetch latest recommendation
      const recResponse = await apiFetch(`${API_BASE}/user/consultation/latest-recommendation`);
      const recData = await recResponse.json();
      setRecommendation(recData);

      setLoading(false);
    } catch (err) {
      setError('Failed to load consultation data');
      setLoading(false);
    }
  };

  const handleCancel = async (requestId) => {
    if (window.confirm('Cancel this consultation request?')) {
      try {
        const response = await apiFetch(`${API_BASE}/user/consultation/request/${requestId}/cancel`, {
          method: 'PUT'
        });

        if (response.ok) {
          alert('Request cancelled');
          fetchData();
        } else {
          alert('Cannot cancel this request');
        }
      } catch (err) {
        alert('Error cancelling request');
      }
    }
  };

  if (loading) return <div className="page-container"><p>Loading...</p></div>;

  return (
    <div className="page-container">
      <div className="card-container">
        <h2>My Consultation</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          Track your consultation requests and view professional recommendations
        </p>

        {error && <div className="error-message">{error}</div>}

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid var(--border-light)', paddingBottom: '10px' }}>
          <button
            className={`btn ${activeTab === 'requests' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('requests')}
          >
            My Requests ({requests.length})
          </button>
          <button
            className={`btn ${activeTab === 'recommendations' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('recommendations')}
          >
            Recommendations
          </button>
        </div>

        {activeTab === 'requests' && (
          <div>
            {requests.length === 0 ? (
              <div style={{ padding: '20px', background: '#f9f9f9', borderRadius: '8px', textAlign: 'center' }}>
                <p>No consultation requests yet</p>
                <p style={{ fontSize: '13px', color: '#999' }}>Go to "Consult Expert" to submit one</p>
              </div>
            ) : (
              <div className="requests-timeline">
                {requests.map(req => (
                  <div key={req.request_id} className="timeline-item" style={{ marginBottom: '20px', padding: '15px', border: '1px solid var(--border-light)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div style={{ flex: 1 }}>
                        <h4>{req.title}</h4>
                        <p style={{ color: '#666', marginBottom: '10px' }}>{req.description}</p>
                      </div>
                      <span className={`status status-${req.status}`} style={{ whiteSpace: 'nowrap', marginLeft: '10px' }}>
                        {req.status.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ marginTop: '10px', fontSize: '13px', color: '#999' }}>
                      <p><strong>Type:</strong> {req.request_type}</p>
                      <p><strong>Submitted:</strong> {new Date(req.requested_date).toLocaleDateString()}</p>
                      {req.status === 'pending' && (
                        <p style={{ color: '#ff9800', marginTop: '10px' }}>
                          ⏳ Waiting for admin to assign a professional
                        </p>
                      )}
                      {req.status === 'assigned' && (
                        <p style={{ color: '#2196f3', marginTop: '10px' }}>
                          👤 Professional is reviewing your case
                        </p>
                      )}
                      {req.status === 'completed' && (
                        <p style={{ color: '#51cf66', marginTop: '10px' }}>
                          ✅ Treatment plan is ready
                        </p>
                      )}
                    </div>

                    {req.status === 'pending' && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleCancel(req.request_id)}
                        style={{ marginTop: '10px' }}
                      >
                        Cancel Request
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div>
            {recommendation?.has_recommendation ? (
              <div className="recommendation-card" style={{ padding: '20px', background: '#fff9f6', border: '2px solid var(--primary-rose)', borderRadius: '8px' }}>
                <div style={{ marginBottom: '15px' }}>
                  <h3>{recommendation.recommendation.professional_role}</h3>
                  <p style={{ color: '#666', fontSize: '14px' }}>
                    <strong>From:</strong> {recommendation.recommendation.professional_name}
                  </p>
                  <p style={{ color: '#999', fontSize: '13px' }}>
                    {new Date(recommendation.recommendation.sent_date).toLocaleDateString()}
                  </p>
                </div>

                <div className="recommendation-sections">
                  <div style={{ marginBottom: '15px' }}>
                    <h4>Assessment & Recommendations</h4>
                    <p style={{ lineHeight: '1.6', color: '#333' }}>
                      {recommendation.recommendation.recommendation_text}
                    </p>
                  </div>

                  {recommendation.recommendation.product_suggestions && (
                    <div style={{ marginBottom: '15px' }}>
                      <h4>Suggested Products</h4>
                      <p style={{ lineHeight: '1.6', color: '#333', whiteSpace: 'pre-wrap' }}>
                        {recommendation.recommendation.product_suggestions}
                      </p>
                    </div>
                  )}

                  {recommendation.recommendation.routine_suggestions && (
                    <div>
                      <h4>Routine Guidelines</h4>
                      <p style={{ lineHeight: '1.6', color: '#333', whiteSpace: 'pre-wrap' }}>
                        {recommendation.recommendation.routine_suggestions}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ padding: '20px', background: '#f9f9f9', borderRadius: '8px', textAlign: 'center' }}>
                <p>No recommendations yet</p>
                <p style={{ fontSize: '13px', color: '#999' }}>
                  Once a professional reviews your consultation request, recommendations will appear here
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// MAIN DASHBOARD COMPONENT
// ============================================
export default function UserDashboard() {
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
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'lifestyle', label: 'Lifestyle', icon: '🏃' },
    { id: 'screening', label: 'AI Screening', icon: '🔍' },
    { id: 'skin-profile', label: 'Skin Profile', icon: '🧴' },
    { id: 'routine', label: 'My Routine', icon: '✓' },
    { id: 'products', label: 'Products', icon: '🛍' },
    { id: 'ingredients', label: 'Ingredients', icon: '⚗' },
    { id: 'progress', label: 'Progress', icon: '📈' },
    { id: 'consult', label: 'Consult Expert', icon: '👨‍⚕' },
    { id: 'consultant', label: 'My Consultant', icon: '💬' }
  ];

  const renderPage = () => {
    switch(currentPage) {
      case 'home': return <DashboardHome />;
      case 'profile': return <Profile />;
      case 'lifestyle': return <Lifestyle />;
      case 'screening': return <AISkinScreening />;
      case 'skin-profile': return <SkinProfile />;
      case 'routine': return <MyRoutine />;
      case 'products': return <Products />;
      case 'ingredients': return <Ingredients />;
      case 'progress': return <Progress />;
      case 'consult': return <ConsultExpert />;
      case 'consultant': return <MyConsultant />;
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
            <span>🚪</span>
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