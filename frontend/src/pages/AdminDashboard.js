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
  { id: 'dashboard', label: 'Dashboard', icon: '' },
  { id: 'consultations', label: 'Consultation Requests', icon: '' },
  { id: 'users', label: 'Manage Users', icon: '' },
  { id: 'pending', label: 'Pending Users', icon: '' },
  { id: 'products', label: 'Products', icon: '' },
  { id: 'ingredients', label: 'Ingredients', icon: '' },
];

export default function AdminDashboard() {
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
      case 'users': return <ManageUsers />;
      case 'pending': return <PendingUsers />;
      case 'products': return <ManageProducts />;
      case 'ingredients': return <ManageIngredients />;
      default: return <AdminHome user={user} />;
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
          <div className="user-info"><span>Admin {user?.first_name}</span></div>
        </header>
        <section className="dashboard-content">{renderPage()}</section>
      </main>
    </div>
  );
}

// ============ HOME ============
function AdminHome({ user }) {
  const [stats, setStats] = useState({ consultations: 0, users: 0, pending: 0, products: 0, ingredients: 0 });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const consRes = await apiFetch(`${API_BASE}/admin/consultations/requests`);
      const consData = await consRes.json();
      setStats(prev => ({ ...prev, consultations: consData.count || 0 }));
    } catch (e) { console.error(e); }
  };

  return (
    <div className="dashboard-home">
      <div className="welcome-section">
        <h2>Welcome Admin {user?.first_name}! </h2>
        <p>Manage platform content and users</p>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"></div>
          <div className="stat-content">
            <h3>Consultation Requests</h3>
            <p>{stats.consultations}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"></div>
          <div className="stat-content">
            <h3>Total Users</h3>
            <p>{stats.users}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"></div>
          <div className="stat-content">
            <h3>Pending Approval</h3>
            <p>{stats.pending}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"></div>
          <div className="stat-content">
            <h3>Products</h3>
            <p>{stats.products}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ CONSULTATION REQUESTS ============
function ConsultationRequests() {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [consultants, setConsultants] = useState([]);
  const [dermatologists, setDermatologists] = useState([]);
  const [selectedExpert, setSelectedExpert] = useState('');
  const [expertType, setExpertType] = useState('consultant');

  useEffect(() => {
    fetchConsultations();
    fetchExperts();
  }, []);

  const fetchConsultations = async () => {
    try {
      const response = await apiFetch(`${API_BASE}/admin/consultations/requests`);
      const data = await response.json();
      setConsultations(data.consultations || []);
      setLoading(false);
    } catch (err) {
      setError('Failed to load: ' + err.message);
      setLoading(false);
    }
  };

  const fetchExperts = async () => {
    try {
      const consRes = await apiFetch(`${API_BASE}/admin/consultations/available-experts/3`);
      const consData = await consRes.json();
      setConsultants(consData.experts || []);

      const dermRes = await apiFetch(`${API_BASE}/admin/consultations/available-experts/2`);
      const dermData = await dermRes.json();
      setDermatologists(dermData.experts || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignClick = (request) => {
    setSelectedRequest(request);
    setShowAssignModal(true);
    setSelectedExpert('');
  };

  const handleAssign = async () => {
    if (!selectedExpert) {
      setError('Please select an expert');
      return;
    }

    try {
      const endpoint = expertType === 'consultant' 
        ? `${API_BASE}/admin/consultations/assign-consultant`
        : `${API_BASE}/admin/consultations/assign-dermatologist`;

      const response = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          user_id: selectedRequest.user_id,
          [expertType === 'consultant' ? 'consultant_id' : 'dermatologist_id']: parseInt(selectedExpert)
        })
      });

      if (response.ok) {
        alert(`${expertType === 'consultant' ? 'Consultant' : 'Dermatologist'} assigned!`);
        setShowAssignModal(false);
        fetchConsultations();
      } else {
        setError('Failed to assign');
      }
    } catch (err) {
      setError('Error: ' + err.message);
    }
  };

  if (loading) return <div className="page-container"><p>Loading...</p></div>;

  return (
    <div className="page-container">
      <div className="card-container">
        <h2>📋 Consultation Requests ({consultations.length})</h2>

        {error && <div className="error-message">{error}</div>}

        {consultations.length === 0 ? (
          <p>No consultation requests</p>
        ) : (
          <div className="consultations-list">
            {consultations.map(req => (
              <div key={req.request_id} className="consultation-card">
                <div className="consultation-header">
                  <h4>{req.user_name}</h4>
                  <span className={`status status-${req.status}`}>{req.status.toUpperCase()}</span>
                </div>
                <p><strong>Title:</strong> {req.title}</p>
                <p><strong>Issue:</strong> {req.description}</p>
                <p className="request-date"> {req.requested_date}</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => handleAssignClick(req)}
                >
                  ✓ Assign Expert
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAssignModal && selectedRequest && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Assign Expert to {selectedRequest.user_name}</h3>
              <button className="modal-close" onClick={() => setShowAssignModal(false)}>✕</button>
            </div>

            <div className="form-group">
              <label>Expert Type</label>
              <div className="radio-group">
                <label>
                  <input type="radio" value="consultant" checked={expertType === 'consultant'} onChange={(e) => setExpertType(e.target.value)} />
                  Consultant
                </label>
                <label>
                  <input type="radio" value="dermatologist" checked={expertType === 'dermatologist'} onChange={(e) => setExpertType(e.target.value)} />
                  Dermatologist
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>Select Expert</label>
              <select value={selectedExpert} onChange={(e) => setSelectedExpert(e.target.value)}>
                <option value="">-- Choose --</option>
                {expertType === 'consultant' ? (
                  consultants.map(c => (
                    <option key={c.user_id} value={c.user_id}>{c.name} ({c.email})</option>
                  ))
                ) : (
                  dermatologists.map(d => (
                    <option key={d.user_id} value={d.user_id}>{d.name} ({d.email})</option>
                  ))
                )}
              </select>
            </div>

            <div className="modal-actions">
              <button className="btn btn-primary" onClick={handleAssign}>Assign</button>
              <button className="btn btn-secondary" onClick={() => setShowAssignModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ MANAGE USERS ============
function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await apiFetch(`${API_BASE}/admin/users`);
      const data = await response.json();
      setUsers(data.users || []);
      setLoading(false);
    } catch (err) {
      setError('Failed: ' + err.message);
      setLoading(false);
    }
  };

  const handleApprove = async (userId, userEmail) => {
    try {
      const response = await apiFetch(`${API_BASE}/admin/users/${userId}/approve`, {
        method: 'PUT'
      });

      if (response.ok) {
        setSuccess(`✅ ${userEmail} approved!`);
        fetchUsers();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to approve');
      }
    } catch (err) {
      setError('Error: ' + err.message);
    }
  };

  const handleReject = async (userId, userEmail) => {
    const reason = prompt('Enter rejection reason (optional):');
    if (reason === null) return; // User cancelled
    
    try {
      const response = await apiFetch(`${API_BASE}/admin/users/${userId}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ reason: reason || 'No reason provided' })
      });

      if (response.ok) {
        setSuccess(`❌ ${userEmail} rejected!`);
        fetchUsers();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to reject');
      }
    } catch (err) {
      setError('Error: ' + err.message);
    }
  };

  const handleDisable = async (userId) => {
    try {
      const response = await apiFetch(`${API_BASE}/admin/users/${userId}/disable`, {
        method: 'PUT'
      });

      if (response.ok) {
        setSuccess('User disabled');
        fetchUsers();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to disable');
      }
    } catch (err) {
      setError('Error: ' + err.message);
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure? This cannot be undone.')) {
      try {
        const response = await apiFetch(`${API_BASE}/admin/users/${userId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          setSuccess('User deleted');
          fetchUsers();
          setTimeout(() => setSuccess(''), 3000);
        } else {
          const data = await response.json();
          setError(data.detail || 'Failed to delete');
        }
      } catch (err) {
        setError('Error: ' + err.message);
      }
    }
  };

  if (loading) return <div className="page-container"><p>Loading...</p></div>;

  const roleNames = { 1: 'User', 2: 'Dermatologist', 3: 'Consultant', 4: 'Admin' };

  return (
    <div className="page-container">
      <div className="card-container">
        <h2>👥 Manage Users ({users.length})</h2>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {users.length === 0 ? (
          <p>No users yet</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--primary-rose)', color: 'white' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Role</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Approval</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.user_id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}>
                      <strong>{user.first_name} {user.last_name}</strong>
                    </td>
                    <td style={{ padding: '12px' }}>{user.email}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{ background: '#f0f0f0', padding: '4px 8px', borderRadius: '4px' }}>
                        {roleNames[user.role_id] || 'Unknown'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {user.is_approved ? (
                        <span style={{ color: '#51cf66', fontWeight: 'bold' }}>✅ Approved</span>
                      ) : (
                        <span style={{ color: '#ff6b6b', fontWeight: 'bold' }}>⏳ Pending</span>
                      )}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {!user.is_active ? (
                        <span style={{ color: '#ffa500' }}>🔒 Disabled</span>
                      ) : (
                        <span style={{ color: '#51cf66' }}>✅ Active</span>
                      )}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {!user.is_approved && (
                          <>
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleApprove(user.user_id, user.email)}
                              title="Approve"
                            >
                              ✓
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleReject(user.user_id, user.email)}
                              title="Reject"
                            >
                              ✗
                            </button>
                          </>
                        )}
                        {user.is_active && user.is_approved && (
                          <button
                            className="btn btn-sm btn-warning"
                            onClick={() => handleDisable(user.user_id)}
                            title="Disable"
                          >
                            🔒
                          </button>
                        )}
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(user.user_id)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ PENDING USERS ============
function PendingUsers() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      const response = await apiFetch(`${API_BASE}/admin/pending-users`);
      const data = await response.json();
      setPending(data.pending_users || []);
      setLoading(false);
    } catch (err) {
      setError('Failed: ' + err.message);
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      await apiFetch(`${API_BASE}/admin/users/${userId}/approve`, { method: 'PUT' });
      alert('Approved!');
      fetchPending();
    } catch (err) {
      setError('Failed');
    }
  };

  const handleReject = async (userId) => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    try {
      await apiFetch(`${API_BASE}/admin/users/${userId}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ reason })
      });
      alert('Rejected');
      fetchPending();
    } catch (err) {
      setError('Failed');
    }
  };

  if (loading) return <div className="page-container"><p>Loading...</p></div>;

  return (
    <div className="page-container">
      <div className="card-container">
        <h2>⏳ Pending Approvals ({pending.length})</h2>
        {error && <div className="error-message">{error}</div>}

        {pending.length === 0 ? (
          <p>No pending approvals</p>
        ) : (
          <div className="pending-list">
            {pending.map(u => (
              <div key={u.user_id} className="pending-card">
                <h4>{u.name}</h4>
                <p>📧 {u.email}</p>
                <p>Role: {u.role}</p>
                <div className="action-buttons">
                  <button className="btn btn-success" onClick={() => handleApprove(u.user_id)}>✓ Approve</button>
                  <button className="btn btn-danger" onClick={() => handleReject(u.user_id)}>✗ Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============ MANAGE PRODUCTS ============
function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editPrice, setEditPrice] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await apiFetch(`${API_BASE}/admin/products`);
      const data = await response.json();
      setProducts(data.products || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingId(product.product_id);
    setEditPrice(product.price);
  };

  const handleSave = async (productId) => {
    try {
      await apiFetch(`${API_BASE}/admin/products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify({ price: parseFloat(editPrice) })
      });
      alert('Updated');
      setEditingId(null);
      fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Delete?')) return;
    try {
      await apiFetch(`${API_BASE}/admin/products/${productId}`, { method: 'DELETE' });
      alert('Deleted');
      fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="page-container"><p>Loading...</p></div>;

  return (
    <div className="page-container">
      <div className="card-container">
        <h2>💊 Products ({products.length})</h2>
        <div className="search-box">
          <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <table className="products-table">
          <thead>
            <tr>
              <th>Brand</th>
              <th>Name</th>
              <th>Price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(p => (
              <tr key={p.product_id}>
                <td>{p.brand}</td>
                <td>{p.name}</td>
                <td>
                  {editingId === p.product_id ? (
                    <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} style={{width: '80px'}} />
                  ) : (
                    `$${p.price}`
                  )}
                </td>
                <td>
                  {editingId === p.product_id ? (
                    <>
                      <button className="btn btn-sm btn-primary" onClick={() => handleSave(p.product_id)}>Save</button>
                      <button className="btn btn-sm btn-secondary" onClick={() => setEditingId(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(p)}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p.product_id)}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ MANAGE INGREDIENTS ============
function ManageIngredients() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    try {
      const response = await apiFetch(`${API_BASE}/admin/ingredients`);
      const data = await response.json();
      setIngredients(data.ingredients || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleDelete = async (ingredientId) => {
    if (!window.confirm('Delete?')) return;
    try {
      await apiFetch(`${API_BASE}/admin/ingredients/${ingredientId}`, { method: 'DELETE' });
      alert('Deleted');
      fetchIngredients();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredIngredients = ingredients.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="page-container"><p>Loading...</p></div>;

  return (
    <div className="page-container">
      <div className="card-container">
        <h2>🧪 Ingredients ({ingredients.length})</h2>
        <div className="search-box">
          <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="ingredients-grid">
          {filteredIngredients.map(i => (
            <div key={i.ingredient_id} className="ingredient-admin-card">
              <h4>{i.name}</h4>
              <p>{i.benefits}</p>
              <button className="btn btn-sm btn-danger" onClick={() => handleDelete(i.ingredient_id)}>Delete</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getRoleName(roleId) {
  const roles = { 1: 'User', 2: 'Dermatologist', 3: 'Consultant', 4: 'Admin' };
  return roles[roleId] || 'Unknown';
}