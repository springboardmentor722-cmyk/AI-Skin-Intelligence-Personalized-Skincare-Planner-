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
  const [skinProfile, setSkinProfile] = useState({
    skin_type: '',
    primary_concern: '',
    sensitivity_level: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSkinProfile();
  }, []);

  const fetchSkinProfile = async () => {
    try {
      const response = await apiFetch(`${API_BASE}/user/skin-profile`);
      const data = await response.json();
      setSkinProfile(data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSkinProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      const response = await apiFetch(`${API_BASE}/user/skin-profile`, {
        method: 'PUT',
        body: JSON.stringify(skinProfile)
      });

      if (response.ok) {
        setSuccess('Skin profile updated successfully');
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
        <h2>Your Skin Profile</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>Define your skin characteristics for personalized recommendations</p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="inspection-section">
          <h3>Skin Type</h3>
          <p style={{ color: '#666', marginBottom: '15px' }}>Select your dominant skin type</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            {['Oily', 'Dry', 'Combination', 'Sensitive'].map(type => (
              <label key={type} style={{
                padding: '15px',
                border: skinProfile.skin_type === type ? '2px solid var(--primary-rose)' : '2px solid var(--border-light)',
                borderRadius: '8px',
                cursor: 'pointer',
                background: skinProfile.skin_type === type ? 'var(--shadow-light)' : 'var(--white)',
                transition: 'all 0.3s'
              }}>
                <input 
                  type="radio" 
                  name="skin_type" 
                  value={type} 
                  checked={skinProfile.skin_type === type}
                  onChange={handleChange}
                  style={{ marginRight: '8px' }}
                />
                {type}
              </label>
            ))}
          </div>
        </div>

        <div className="inspection-section">
          <h3>Primary Concern</h3>
          <div className="form-group">
            <select name="primary_concern" value={skinProfile.primary_concern} onChange={handleChange}>
              <option value="">Select primary concern</option>
              <option value="Acne">Acne</option>
              <option value="Wrinkles">Wrinkles & Fine Lines</option>
              <option value="Dark Spots">Dark Spots & Hyperpigmentation</option>
              <option value="Sensitivity">Sensitivity & Redness</option>
              <option value="Dryness">Dryness & Dehydration</option>
              <option value="Oiliness">Oiliness & Shine</option>
              <option value="Uneven Tone">Uneven Skin Tone</option>
            </select>
          </div>
        </div>

        <div className="inspection-section">
          <h3>Sensitivity Level</h3>
          <div className="form-group">
            <select name="sensitivity_level" value={skinProfile.sensitivity_level} onChange={handleChange}>
              <option value="">Select sensitivity</option>
              <option value="Low">Low - Can tolerate most products</option>
              <option value="Medium">Medium - Need to be careful</option>
              <option value="High">High - Very reactive to products</option>
              <option value="Reactive">Reactive - Known allergies</option>
            </select>
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleSubmit}>Save Skin Profile</button>
      </div>
    </div>
  );
}

// ============================================
// MY ROUTINE
// ============================================
function MyRoutine() {
  const [routine, setRoutine] = useState([]);
  const [newStep, setNewStep] = useState({ routine_step: '', frequency: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const handleAddStep = async () => {
    if (!newStep.routine_step || !newStep.frequency) {
      setError('Please fill all fields');
      return;
    }

    try {
      const response = await apiFetch(`${API_BASE}/routine/`, {
        method: 'POST',
        body: JSON.stringify(newStep)
      });

      if (response.ok) {
        setNewStep({ routine_step: '', frequency: '' });
        fetchRoutine();
        setSuccess('Step added successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to add step');
      }
    } catch (err) {
      setError('Error: ' + err.message);
    }
  };

  const handleDeleteStep = async (routineId) => {
    try {
      const response = await apiFetch(`${API_BASE}/routine/${routineId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchRoutine();
        setSuccess('Step deleted successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to delete step');
      }
    } catch (err) {
      setError('Error: ' + err.message);
    }
  };

  if (loading) return <div className="page-container"><p>Loading...</p></div>;

  return (
    <div className="page-container">
      <div className="card-container">
        <h2>My Skincare Routine</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>Create and manage your personalized skincare routine</p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="inspection-section">
          <h3>Add New Step</h3>
          <div className="routine-form">
            <div className="form-row">
              <div className="form-group">
                <label>Routine Step</label>
                <input 
                  type="text" 
                  value={newStep.routine_step}
                  onChange={(e) => setNewStep(prev => ({ ...prev, routine_step: e.target.value }))}
                  placeholder="e.g., Apply Facial Cleanser"
                />
              </div>
              <div className="form-group">
                <label>Frequency</label>
                <select 
                  value={newStep.frequency}
                  onChange={(e) => setNewStep(prev => ({ ...prev, frequency: e.target.value }))}
                >
                  <option value="">Select frequency</option>
                  <option value="Morning">Morning Only</option>
                  <option value="Evening">Evening Only</option>
                  <option value="Twice Daily">Twice Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="As Needed">As Needed</option>
                </select>
              </div>
            </div>
            <button className="btn btn-primary" onClick={handleAddStep}>Add Step</button>
          </div>
        </div>

        <div className="inspection-section">
          <h3>Current Routine</h3>
          {routine.length === 0 ? (
            <p style={{ color: '#999', fontStyle: 'italic' }}>No routine steps yet. Add your first step above.</p>
          ) : (
            <div className="routine-display">
              <ul>
                {routine.map(step => (
                  <li key={step.routine_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>{step.routine_step}</strong>
                      <br />
                      <small style={{ color: '#999' }}>{step.frequency}</small>
                    </div>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteStep(step.routine_id)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// PRODUCTS
// ============================================
function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await apiFetch(`${API_BASE}/user/products?limit=500`);
      const data = await response.json();
      setProducts(data.products || []);
      setLoading(false);
    } catch (err) {
      setError('Failed to load products');
      setLoading(false);
    }
  };

  if (loading) return <div className="page-container"><p>Loading...</p></div>;

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="card-container">
        <h2>Skincare Products</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>Explore our curated collection of skincare products</p>

        {error && <div className="error-message">{error}</div>}

        <div className="search-box">
          <input 
            type="text"
            placeholder="Search products by name or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {filteredProducts.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999' }}>No products found</p>
        ) : (
          <div className="products-grid">
            {filteredProducts.map(product => (
              <div key={product.product_id} className="product-card">
                <div className="product-category">{product.category}</div>
                <h4>{product.name}</h4>
                <p style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>{product.brand}</p>
                <div className="product-info">
                  <span className="product-rating">★ {product.rating || '4.5'}</span>
                  <span className="product-price">${product.price || '29.99'}</span>
                </div>
              </div>
            ))}
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
  const [progress, setProgress] = useState({
    before_photo: '',
    current_photo: '',
    improvement_percentage: 0
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  return (
    <div className="page-container">
      <div className="card-container">
        <h2>Your Progress</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>Track your skin improvement over time with before and after photos</p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="inspection-section">
          <h3>Progress Comparison</h3>
          <div className="progress-comparison">
            <div className="photo-container">
              <h4>Before</h4>
              <div style={{ 
                width: '150px', 
                height: '150px', 
                background: 'var(--shadow-light)', 
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto'
              }}>
                <span style={{ color: '#999' }}>No photo yet</span>
              </div>
            </div>

            <div className="improvement-display">
              <h4>Overall Improvement</h4>
              <p style={{ fontSize: '32px', color: 'var(--primary-rose)', fontWeight: 'bold', margin: '10px 0' }}>
                {progress.improvement_percentage || 0}%
              </p>
              <small>Based on your progress</small>
            </div>

            <div className="photo-container">
              <h4>Current</h4>
              <div style={{ 
                width: '150px', 
                height: '150px', 
                background: 'var(--shadow-light)', 
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto'
              }}>
                <span style={{ color: '#999' }}>No photo yet</span>
              </div>
            </div>
          </div>
        </div>

        <div className="inspection-section">
          <h3>Upload Progress Photos</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Before Photo</label>
              <input type="file" accept="image/*" />
              <small>Upload your starting photo</small>
            </div>
            <div className="form-group">
              <label>Current Photo</label>
              <input type="file" accept="image/*" />
              <small>Upload your latest photo</small>
            </div>
          </div>
          <button className="btn btn-primary">Upload Photos</button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// CONSULT EXPERT
// ============================================
function ConsultExpert() {
  const [dermatologists, setDermatologists] = useState([
    { id: 1, name: 'Dr. Sarah Mitchell', specialty: 'Dermatologist', experience: '15 years' },
    { id: 2, name: 'Dr. Emily Chen', specialty: 'Skincare Specialist', experience: '12 years' },
    { id: 3, name: 'Dr. James Cooper', specialty: 'Clinical Dermatologist', experience: '18 years' }
  ]);
  const [selectedDerm, setSelectedDerm] = useState(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmitRequest = async () => {
    if (!selectedDerm || !reason) {
      setError('Please select a dermatologist and provide a reason');
      return;
    }

    try {
      const response = await apiFetch(`${API_BASE}/consultation/request`, {
        method: 'POST',
        body: JSON.stringify({
          dermatologist_id: selectedDerm,
          reason: reason,
          status: 'pending'
        })
      });

      if (response.ok) {
        setSuccess('Consultation request submitted successfully');
        setSelectedDerm(null);
        setReason('');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to submit request');
      }
    } catch (err) {
      setError('Error: ' + err.message);
    }
  };

  return (
    <div className="page-container">
      <div className="card-container">
        <h2>Consult an Expert</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>Connect with professional dermatologists for personalized advice</p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="inspection-section">
          <h3>Select a Dermatologist</h3>
          <div className="patients-roster">
            {dermatologists.map(derm => (
              <div 
                key={derm.id}
                className="patient-roster-card"
                onClick={() => setSelectedDerm(derm.id)}
                style={{
                  cursor: 'pointer',
                  border: selectedDerm === derm.id ? '2px solid var(--primary-rose)' : '2px solid var(--border-light)',
                  background: selectedDerm === derm.id ? 'var(--shadow-light)' : 'var(--white)'
                }}
              >
                <div className="patient-header">
                  <h4>{derm.name}</h4>
                  {selectedDerm === derm.id && <span style={{ color: 'var(--primary-rose)' }}>✓ Selected</span>}
                </div>
                <p><strong>Specialty:</strong> {derm.specialty}</p>
                <p><strong>Experience:</strong> {derm.experience}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="inspection-section">
          <h3>Reason for Consultation</h3>
          <div className="form-group">
            <label>Tell us why you need consultation</label>
            <textarea 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe your skin concerns, symptoms, or goals..."
              rows="5"
            ></textarea>
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleSubmitRequest}>Submit Request</button>
      </div>
    </div>
  );
}

// ============================================
// MY CONSULTANT
// ============================================
function MyConsultant() {
  const [consultant, setConsultant] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchConsultant();
  }, []);

  const fetchConsultant = async () => {
    try {
      const response = await apiFetch(`${API_BASE}/consultation/assigned-consultant`);
      const data = await response.json();
      if (data.consultant) {
        setConsultant(data.consultant);
        setRecommendations(data.recommendations || []);
      }
      setLoading(false);
    } catch (err) {
      setError('No consultant assigned yet');
      setLoading(false);
    }
  };

  if (loading) return <div className="page-container"><p>Loading...</p></div>;

  if (!consultant) {
    return (
      <div className="page-container">
        <div className="card-container">
          <h2>My Consultant</h2>
          <div style={{ padding: '40px', textAlign: 'center', background: 'var(--shadow-light)', borderRadius: '8px' }}>
            <p style={{ fontSize: '16px', color: '#666' }}>No consultant assigned yet</p>
            <p style={{ fontSize: '14px', color: '#999', marginTop: '10px' }}>
              Submit a consultation request to get started
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="card-container">
        <h2>My Consultant</h2>

        <div className="inspection-section">
          <h3>Your Assigned Expert</h3>
          <div className="patient-roster-card" style={{ borderColor: 'var(--primary-rose)' }}>
            <div className="patient-header">
              <h4>{consultant.first_name} {consultant.last_name}</h4>
              <div className="assigned-badge">Assigned</div>
            </div>
            <p><strong>Email:</strong> {consultant.email}</p>
            <p><strong>Phone:</strong> {consultant.phone}</p>
            <p style={{ fontSize: '13px', color: '#999', marginTop: '10px' }}>
              Assigned on: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>

        {recommendations.length > 0 && (
          <div className="inspection-section">
            <h3>Latest Recommendations</h3>
            {recommendations.map((rec, idx) => (
              <div key={idx} style={{
                background: 'var(--white)',
                border: '1px solid var(--border-light)',
                borderRadius: '8px',
                padding: '15px',
                marginBottom: '15px'
              }}>
                <p style={{ color: 'var(--text-dark)', lineHeight: '1.8' }}>
                  {rec.recommendation_text}
                </p>
                {rec.product_suggestions && (
                  <p style={{ marginTop: '10px', color: '#666' }}>
                    <strong>Suggested Products:</strong> {rec.product_suggestions}
                  </p>
                )}
                {rec.routine_suggestions && (
                  <p style={{ color: '#666' }}>
                    <strong>Routine Changes:</strong> {rec.routine_suggestions}
                  </p>
                )}
              </div>
            ))}
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