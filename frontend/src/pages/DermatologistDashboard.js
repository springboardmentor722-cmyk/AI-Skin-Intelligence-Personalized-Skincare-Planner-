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
  { id: 'consultations', label: 'Consultation Requests', icon: '📋' },
  { id: 'patients', label: 'My Patients', icon: '👥' },
  { id: 'recommendations', label: 'Send Recommendations', icon: '💬' },
  { id: 'products', label: 'Products Reference', icon: '💊' },
  { id: 'ingredients', label: 'Ingredients Reference', icon: '🧪' },
  { id: 'profile', label: 'Professional Profile', icon: '👨‍⚕️' },
];

export default function DermatologistDashboard() {
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
      case 'consultations': return <ConsultationRequests />;
      case 'patients': return <MyPatients />;
      case 'recommendations': return <SendRecommendations />;
      case 'products': return <ProductsReference />;
      case 'ingredients': return <IngredientsReference />;
      case 'profile': return <DermatologistProfile />;
      default: return <DermatologistHome user={user} />;
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
          <div className="user-info"><span>Dr. {user?.first_name}</span></div>
        </header>
        <section className="dashboard-content">{renderPage()}</section>
      </main>
    </div>
  );
}

// ============ HOME ============
function DermatologistHome({ user }) {
  const [stats, setStats] = useState({ patients: 0, consultations: 0, products: 0, ingredients: 0 });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const pRes = await apiFetch(`${API_BASE}/dermatologist/patients`);
      const pData = await pRes.json();
      
      const cRes = await apiFetch(`${API_BASE}/dermatologist/consultation-requests`);
      const cData = await cRes.json();

      setStats({
        patients: pData.count || 0,
        consultations: cData.count || 0,
        products: 1689,
        ingredients: 248
      });
    } catch (e) { console.error(e); }
  };

  return (
    <div className="dashboard-home">
      <div className="welcome-section">
        <h2>Welcome Dr. {user?.first_name}! 👨‍⚕️</h2>
        <p>Provide expert dermatological care to your patients</p>
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
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>Consultation Requests</h3>
            <p>{stats.consultations}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💊</div>
          <div className="stat-content">
            <h3>Products Reference</h3>
            <p>{stats.products}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <h3>Patient Rating</h3>
            <p>4.9/5</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ CONSULTATION REQUESTS ============
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
      setRequests(data.consultations || []);
      setLoading(false);
    } catch (err) {
      setError('Failed to load: ' + err.message);
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId, newStatus) => {
    try {
      const response = await apiFetch(`${API_BASE}/dermatologist/consultation-request/${requestId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        alert(`Status updated to ${newStatus}`);
        fetchRequests();
      } else {
        setError('Failed to update');
      }
    } catch (err) {
      setError('Error: ' + err.message);
    }
  };

  if (loading) return <div className="page-container"><p>Loading...</p></div>;

  return (
    <div className="page-container">
      <div className="card-container">
        <h2>📋 Consultation Requests ({requests.length})</h2>
        {error && <div className="error-message">{error}</div>}

        {requests.length === 0 ? (
          <div style={{ padding: '20px', background: '#f9f9f9', borderRadius: '8px', textAlign: 'center' }}>
            <p>No consultation requests yet</p>
          </div>
        ) : (
          <div className="requests-list">
            {requests.map(req => (
              <div key={req.request_id} className="request-item">
                <div className="request-header">
                  <h4>{req.user_name}</h4>
                  <span className={`status status-${req.status}`}>{req.status.toUpperCase()}</span>
                </div>
                <p><strong>Title:</strong> {req.title}</p>
                <p><strong>Issue:</strong> {req.description}</p>
                <p className="request-date">📅 {req.requested_date}</p>

                <div className="action-buttons">
                  <button 
                    className="btn btn-success"
                    onClick={() => handleStatusUpdate(req.request_id, 'approved')}
                    disabled={req.status !== 'pending'}
                  >
                    ✓ Approve
                  </button>
                  <button 
                    className="btn btn-danger"
                    onClick={() => handleStatusUpdate(req.request_id, 'rejected')}
                    disabled={req.status !== 'pending'}
                  >
                    ✗ Reject
                  </button>
                  <button 
                    className="btn btn-primary"
                    onClick={() => handleStatusUpdate(req.request_id, 'completed')}
                    disabled={req.status !== 'approved'}
                  >
                    ✓ Completed
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
      const response = await apiFetch(`${API_BASE}/dermatologist/patients`);
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
      const response = await apiFetch(`${API_BASE}/dermatologist/patient-inspection/${patient.user_id}`);
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
    return <PatientInspection patient={selectedPatient} inspection={inspection} onBack={() => setShowInspection(false)} isDermatologist={true} />;
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
function PatientInspection({ patient, inspection, onBack, isDermatologist }) {
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
      const response = await apiFetch(`${API_BASE}/dermatologist/update-patient-routine/${patient.user_id}`, {
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
      const response = await apiFetch(`${API_BASE}/dermatologist/recommendations`, {
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
                  placeholder="Personalized dermatological advice..."
                  rows="4"
                ></textarea>
              </div>
              <div className="form-group">
                <label>Product Suggestions</label>
                <textarea 
                  value={recommendation.product_suggestions}
                  onChange={(e) => setRecommendation({...recommendation, product_suggestions: e.target.value})}
                  placeholder="Specific products to prescribe..."
                  rows="3"
                ></textarea>
              </div>
              <div className="form-group">
                <label>Routine Suggestions</label>
                <textarea 
                  value={recommendation.routine_suggestions}
                  onChange={(e) => setRecommendation({...recommendation, routine_suggestions: e.target.value})}
                  placeholder="Treatment routine tips..."
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
      const response = await apiFetch(`${API_BASE}/dermatologist/patients`);
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
      const response = await apiFetch(`${API_BASE}/dermatologist/recommendations`, {
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
        <h2>💬 Send Dermatological Recommendations</h2>

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
            placeholder="Write personalized dermatological advice..."
            rows="5"
          ></textarea>
        </div>

        <div className="form-group">
          <label>Product Suggestions</label>
          <textarea 
            value={recommendation.product_suggestions}
            onChange={(e) => setRecommendation({...recommendation, product_suggestions: e.target.value})}
            placeholder="Prescribe specific medical-grade products..."
            rows="4"
          ></textarea>
        </div>

        <div className="form-group">
          <label>Treatment Routine</label>
          <textarea 
            value={recommendation.routine_suggestions}
            onChange={(e) => setRecommendation({...recommendation, routine_suggestions: e.target.value})}
            placeholder="Detailed treatment protocol..."
            rows="4"
          ></textarea>
        </div>

        <button className="btn btn-primary" onClick={handleSend}>Send Recommendation</button>
      </div>
    </div>
  );
}

// ============ PRODUCTS REFERENCE ============
function ProductsReference() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await apiFetch(`${API_BASE}/dermatologist/products`);
      const data = await response.json();
      setProducts(data.products || []);
      setLoading(false);
    } catch (err) {
      setError('Failed: ' + err.message);
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.brand.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="page-container"><p>Loading...</p></div>;

  return (
    <div className="page-container">
      <div className="card-container">
        <h2>💊 Products Reference ({filteredProducts.length})</h2>
        {error && <div className="error-message">{error}</div>}
        
        <div className="search-box">
          <input 
            type="text" 
            placeholder="Search products..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {filteredProducts.length === 0 ? (
          <p>No products found</p>
        ) : (
          <div className="products-grid">
            {filteredProducts.map(product => (
              <div key={product.product_id} className="product-card">
                <div style={{ 
                  background: 'linear-gradient(135deg, var(--primary-rose), var(--primary-light))',
                  color: 'white',
                  padding: '30px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  marginBottom: '10px'
                }}>
                  💊
                </div>
                <span className="product-category">{product.brand}</span>
                <h4>{product.name}</h4>
                <div className="product-info">
                  <span className="product-rating">⭐ {product.rating.toFixed(1)}</span>
                  <span className="product-price">${product.price.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============ INGREDIENTS REFERENCE ============
function IngredientsReference() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    try {
      const response = await apiFetch(`${API_BASE}/dermatologist/ingredients`);
      const data = await response.json();
      setIngredients(data.ingredients || []);
      setLoading(false);
    } catch (err) {
      setError('Failed: ' + err.message);
      setLoading(false);
    }
  };

  const filteredIngredients = ingredients.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="page-container"><p>Loading...</p></div>;

  return (
    <div className="page-container">
      <div className="card-container">
        <h2>🧪 Ingredients Reference ({filteredIngredients.length})</h2>
        {error && <div className="error-message">{error}</div>}
        
        <div className="search-box">
          <input 
            type="text" 
            placeholder="Search ingredients..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {filteredIngredients.length === 0 ? (
          <p>No ingredients found</p>
        ) : (
          <div className="ingredients-list">
            {filteredIngredients.map(ing => (
              <div key={ing.ingredient_id} className="ingredient-card">
                <h4>✓ {ing.name}</h4>
                <p><strong>Benefits:</strong></p>
                <p style={{ color: 'var(--text-light)', lineHeight: '1.6' }}>
                  {ing.benefits || 'No benefits listed'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============ PROFESSIONAL PROFILE ============
function DermatologistProfile() {
  const [profile, setProfile] = useState({
    license_number: '',
    specialization: '',
    hospital_name: '',
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
      const response = await apiFetch(`${API_BASE}/dermatologist/profile`);
      const data = await response.json();
      setProfile({
        license_number: data.license_number || '',
        specialization: data.specialization || '',
        hospital_name: data.hospital_name || '',
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
      const response = await apiFetch(`${API_BASE}/dermatologist/profile/update`, {
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
          <h2>👨‍⚕️ Professional Profile</h2>
          <button className="btn btn-secondary" onClick={() => setEditing(!editing)}>
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="profile-form">
          <div className="form-group">
            <label>License Number</label>
            <input type="text" name="license_number" value={profile.license_number} onChange={handleChange} disabled={!editing} />
          </div>
          <div className="form-group">
            <label>Specialization</label>
            <input type="text" name="specialization" value={profile.specialization} onChange={handleChange} disabled={!editing} />
          </div>
          <div className="form-group">
            <label>Hospital/Clinic</label>
            <input type="text" name="hospital_name" value={profile.hospital_name} onChange={handleChange} disabled={!editing} />
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