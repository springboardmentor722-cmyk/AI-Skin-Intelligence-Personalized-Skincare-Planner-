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
// MAIN ADMIN DASHBOARD COMPONENT
// ============================================
function AdminDashboard() {
  const { user, logout } = useContext(AuthContext);
  const [currentPage, setCurrentPage] = useState('home');

  if (!user || user.role_id !== 4) {
    return <div className="page-container"><p>Access Denied</p></div>;
  }

// ============================================
// DASHBOARD HOME
// ============================================
function DashboardHome() {
  const [stats, setStats] = useState({
    total_users: 0,
    pending_users: 0,
    approved_users: 0,
    consultations: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await apiFetch(`${API_BASE}/admin/consultations/stats`);
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
          <h2>Welcome to Admin Panel</h2>
          <p>Manage users, consultations, products, and system health</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">U</div>
            <div className="stat-content">
              <h3>Total Consultations</h3>
              <p>{stats.total}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">P</div>
            <div className="stat-content">
              <h3>Pending Requests</h3>
              <p>{stats.pending}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">A</div>
            <div className="stat-content">
              <h3>Assigned Cases</h3>
              <p>{stats.assigned}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">C</div>
            <div className="stat-content">
              <h3>Completed</h3>
              <p>{stats.completed}</p>
            </div>
          </div>
        </div>

        <div className="card-container" style={{ marginTop: '30px' }}>
          <h2>Quick Actions</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>Manage key system functions</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div style={{ padding: '20px', background: 'var(--shadow-light)', borderRadius: '8px', textAlign: 'center' }}>
              <h4>Manage Users</h4>
              <p>View, search, disable users</p>
            </div>
            <div style={{ padding: '20px', background: 'var(--shadow-light)', borderRadius: '8px', textAlign: 'center' }}>
              <h4>Approve Users</h4>
              <p>Review pending registrations</p>
            </div>
            <div style={{ padding: '20px', background: 'var(--shadow-light)', borderRadius: '8px', textAlign: 'center' }}>
              <h4>Assign Professionals</h4>
              <p>Link users to consultants/dermatologists</p>
            </div>
            <div style={{ padding: '20px', background: 'var(--shadow-light)', borderRadius: '8px', textAlign: 'center' }}>
              <h4>Manage Products</h4>
              <p>Create, edit, delete products</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MANAGE USERS
// ============================================
function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await apiFetch(`${API_BASE}/admin/users`);
      
      if (!response.ok) {
        setError('Failed to load users');
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      setUsers(data.users || []);
      setLoading(false);
    } catch (err) {
      setError('Error loading users: ' + err.message);
      setLoading(false);
    }
  };

  const handleDisableUser = async (userId) => {
    if (window.confirm('Disable this user account?')) {
      try {
        const response = await apiFetch(`${API_BASE}/admin/users/${userId}/disable`, {
          method: 'PUT',
          body: JSON.stringify({ is_active: false })
        });

        if (response.ok) {
          setSuccess('User account disabled');
          fetchUsers();
          setTimeout(() => setSuccess(''), 3000);
        } else {
          setError('Failed to disable user');
        }
      } catch (err) {
        setError('Error: ' + err.message);
      }
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure? This action cannot be undone!')) {
      try {
        const response = await apiFetch(`${API_BASE}/admin/users/${userId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          setSuccess('User deleted successfully');
          fetchUsers();
          setTimeout(() => setSuccess(''), 3000);
        } else {
          setError('Failed to delete user');
        }
      } catch (err) {
        setError('Error: ' + err.message);
      }
    }
  };

  if (loading) return <div className="page-container"><p>Loading users...</p></div>;

  // Safe filter with null checks
  const filteredUsers = users.filter(user => {
    if (!user) return false;
    
    const firstName = (user.first_name || '').toLowerCase();
    const lastName = (user.last_name || '').toLowerCase();
    const email = (user.email || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    
    return firstName.includes(search) || 
           lastName.includes(search) || 
           email.includes(search);
  });

  return (
    <div className="page-container">
      <div className="card-container">
        <h2>Manage Users</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>View and manage all registered users</p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {/* Search Bar */}
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 15px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Users Table */}
        {filteredUsers.length === 0 ? (
          <div style={{ padding: '30px', background: '#f9f9f9', borderRadius: '8px', textAlign: 'center' }}>
            <p>No users found</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginBottom: '20px'
            }}>
              <thead>
                <tr style={{ background: 'var(--primary-rose)', color: 'white', borderBottom: '2px solid var(--primary-dark)' }}>
                  <th style={{ padding: '14px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>User ID</th>
                  <th style={{ padding: '14px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Email</th>
                  <th style={{ padding: '14px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Role</th>
                  <th style={{ padding: '14px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Status</th>
                  <th style={{ padding: '14px', textAlign: 'center', fontWeight: '600', fontSize: '14px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, idx) => (
                  <tr key={user.user_id} style={{ 
                    borderBottom: '1px solid #eee',
                    background: idx % 2 === 0 ? '#ffffff' : '#f9f9f9'
                  }}>
                    <td style={{ padding: '12px', fontSize: '13px' }}>#{user.user_id}</td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>{user.email}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '5px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: user.role_id === 1 ? '#e8f5e9' : user.role_id === 2 ? '#e3f2fd' : user.role_id === 3 ? '#f3e5f5' : '#fff3e0',
                        color: user.role_id === 1 ? '#2e7d32' : user.role_id === 2 ? '#1565c0' : user.role_id === 3 ? '#6a1b9a' : '#e65100'
                      }}>
                        {user.role_id === 1 ? 'User' : user.role_id === 2 ? 'Dermatologist' : user.role_id === 3 ? 'Consultant' : 'Admin'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '5px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: user.is_active ? '#51cf66' : '#ff6b6b',
                        color: 'white'
                      }}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button
                        className="btn btn-sm"
                        onClick={() => handleDisableUser(user.user_id)}
                        disabled={!user.is_active}
                        style={{
                          marginRight: '6px',
                          padding: '6px 12px',
                          background: user.is_active ? '#ff9800' : '#ccc',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: user.is_active ? 'pointer' : 'not-allowed',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        Disable
                      </button>
                      <button
                        className="btn btn-sm"
                        onClick={() => handleDeleteUser(user.user_id)}
                        style={{
                          padding: '6px 12px',
                          background: '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ padding: '10px', background: '#f9f9f9', borderRadius: '8px', textAlign: 'center', fontSize: '13px', color: '#666' }}>
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </div>
    </div>
  );
}

// ============================================
// PENDING USERS
// ============================================
function PendingUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const response = await apiFetch(`${API_BASE}/admin/users?pending=true`);
      const data = await response.json();
      setUsers(data.users || []);
      setLoading(false);
    } catch (err) {
      setError('Failed to load pending users');
      setLoading(false);
    }
  };

  const handleApprove = async (userId, userEmail) => {
    try {
      const response = await apiFetch(`${API_BASE}/admin/users/${userId}/approve`, {
        method: 'PUT'
      });

      if (response.ok) {
        setSuccess(`Approved: ${userEmail}`);
        fetchPendingUsers();
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
    if (reason === null) return;

    try {
      const response = await apiFetch(`${API_BASE}/admin/users/${userId}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ reason: reason || 'No reason provided' })
      });

      if (response.ok) {
        setSuccess(`Rejected: ${userEmail}`);
        fetchPendingUsers();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to reject');
      }
    } catch (err) {
      setError('Error: ' + err.message);
    }
  };

  if (loading) return <div className="page-container"><p>Loading...</p></div>;

  const roleNames = { 1: 'User', 2: 'Dermatologist', 3: 'Consultant', 4: 'Admin' };

  return (
    <div className="page-container">
      <div className="card-container">
        <h2>Pending User Approvals</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>Review and approve new registrations</p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {users.length === 0 ? (
          <div style={{ padding: '20px', background: '#f9f9f9', borderRadius: '8px', textAlign: 'center' }}>
            <p>No pending users</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--primary-rose)', color: 'white' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Role</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Registered</th>
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
                      <span style={{ background: '#fff3e0', padding: '4px 8px', borderRadius: '4px', color: '#ff9800' }}>
                        {roleNames[user.role_id]}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleApprove(user.user_id, user.email)}
                        >
                          Approve
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleReject(user.user_id, user.email)}
                        >
                          Reject
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

// ============================================
// CONSULTATION REQUESTS
// ============================================
function ConsultationRequests() {
  const [requests, setRequests] = useState([]);
  const [consultants, setConsultants] = useState([]);
  const [dermatologists, setDermatologists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [assignmentModal, setAssignmentModal] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [reqRes, conRes, dermRes] = await Promise.all([
        apiFetch(`${API_BASE}/admin/consultations/requests`),
        apiFetch(`${API_BASE}/admin/consultants`),
        apiFetch(`${API_BASE}/admin/dermatologists`)
      ]);

      const reqData = await reqRes.json();
      const conData = await conRes.json();
      const dermData = await dermRes.json();

      setRequests(reqData.consultations || []);
      setConsultants(conData.consultants || []);
      setDermatologists(dermData.dermatologists || []);
      setLoading(false);
    } catch (err) {
      setError('Failed to load data');
      setLoading(false);
    }
  };

  const handleAssignConsultant = async (requestId, consultantId) => {
    try {
      const response = await apiFetch(
        `${API_BASE}/admin/consultations/${requestId}/assign-consultant/${consultantId}`,
        { method: 'PUT' }
      );

      if (response.ok) {
        setSuccess('Consultant assigned successfully');
        fetchData();
        setAssignmentModal(false);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to assign');
      }
    } catch (err) {
      setError('Error: ' + err.message);
    }
  };

  const handleAssignDermatologist = async (requestId, dermatologistId) => {
    try {
      const response = await apiFetch(
        `${API_BASE}/admin/consultations/${requestId}/assign-dermatologist/${dermatologistId}`,
        { method: 'PUT' }
      );

      if (response.ok) {
        setSuccess('Dermatologist assigned successfully');
        fetchData();
        setAssignmentModal(false);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to assign');
      }
    } catch (err) {
      setError('Error: ' + err.message);
    }
  };

  if (loading) return <div className="page-container"><p>Loading...</p></div>;

  return (
    <div className="page-container">
      <div className="card-container">
        <h2>Consultation Requests</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>Manage and assign consultation requests</p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {requests.length === 0 ? (
          <div style={{ padding: '20px', background: '#f9f9f9', borderRadius: '8px', textAlign: 'center' }}>
            <p>No consultation requests</p>
          </div>
        ) : (
          <div className="requests-list">
            {requests.map(req => (
              <div key={req.request_id} className="request-item">
                <div className="request-header">
                  <h4>{req.user_name}</h4>
                  <span className={`status status-${req.status}`}>{req.status.toUpperCase()}</span>
                </div>
                <p><strong>Request Type:</strong> {req.request_type}</p>
                <p><strong>Title:</strong> {req.title}</p>
                <p><strong>Issue:</strong> {req.description}</p>
                <p className="request-date">Date: {req.requested_date}</p>
                
                <div className="action-buttons">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setSelectedRequest(req.request_id);
                      setAssignmentModal(true);
                    }}
                  >
                    Assign Professional
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {assignmentModal && selectedRequest && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '400px'
          }}>
            <h3>Assign Professional</h3>
            <div className="form-group" style={{ marginTop: '20px' }}>
              <label>Assign Consultant</label>
              <select onChange={(e) => {
                if (e.target.value) {
                  handleAssignConsultant(selectedRequest, parseInt(e.target.value));
                }
              }}>
                <option value="">Select Consultant...</option>
                {consultants.map(c => (
                  <option key={c.consultant_id} value={c.consultant_id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>OR Assign Dermatologist</label>
              <select onChange={(e) => {
                if (e.target.value) {
                  handleAssignDermatologist(selectedRequest, parseInt(e.target.value));
                }
              }}>
                <option value="">Select Dermatologist...</option>
                {dermatologists.map(d => (
                  <option key={d.dermatologist_id} value={d.dermatologist_id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="btn btn-secondary"
              onClick={() => setAssignmentModal(false)}
              style={{ width: '100%', marginTop: '20px' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// CONTINUE IN NEXT PART...
// ============================================
// PRODUCTS MANAGEMENT
// ============================================
function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      setError('Failed to load products');
      setLoading(false);
    }
  };

  if (loading) return <div className="page-container"><p>Loading...</p></div>;

  return (
    <div className="page-container">
      <div className="card-container">
        <h2>Skincare Products Management</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>View and manage all skincare products</p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {products.length === 0 ? (
          <div style={{ padding: '40px', background: '#f9f9f9', borderRadius: '8px', textAlign: 'center' }}>
            <p style={{ fontSize: '16px', color: '#666' }}>No products available</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '15px'
          }}>
            {products.map((product) => (
              <div
                key={product.product_id}
                style={{
                  padding: '15px',
                  background: 'white',
                  border: '1px solid #eee',
                  borderRadius: '8px',
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.15)';
                  e.currentTarget.style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Product Name */}
                <h4 style={{
                  margin: '0 0 5px 0',
                  fontSize: '14px',
                  color: 'var(--text-dark)',
                  fontWeight: '600',
                  lineHeight: '1.4'
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
                  paddingTop: '10px',
                  borderTop: '1px solid #eee'
                }}>
                  <div>
                    <p style={{ margin: '0', fontSize: '12px', fontWeight: '600', color: 'var(--primary-rose)' }}>
                      ${product.price.toFixed(2)}
                    </p>
                    <p style={{ margin: '3px 0 0 0', fontSize: '11px', color: '#999' }}>
                      {product.size}
                    </p>
                  </div>
                  <span style={{
                    fontSize: '11px',
                    background: '#f0f0f0',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    color: '#666'
                  }}>
                    ID: {product.product_id}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: '20px', padding: '10px', background: '#f9f9f9', borderRadius: '8px', textAlign: 'center', fontSize: '13px', color: '#666' }}>
          Total Products: {products.length}
        </div>
      </div>
    </div>
  );
}

// ============================================
// INGREDIENTS MANAGEMENT
// ============================================
function Ingredients() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    try {
      console.log('Fetching ingredients from:', `${API_BASE}/admin/ingredients`);
      const response = await apiFetch(`${API_BASE}/admin/ingredients`);
      console.log('Response:', response.status);
      
      if (!response.ok) {
        setError(`Error: ${response.status}`);
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      console.log('Ingredients data:', data);
      setIngredients(data.ingredients || []);
      setLoading(false);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) return <div className="page-container"><p>Loading ingredients...</p></div>;
  if (error) return <div className="page-container"><div className="error-message">{error}</div></div>;

  return (
    <div className="page-container">
      <div className="card-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: '0 0 5px 0' }}>Ingredients Management</h2>
            <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>Total: {ingredients.length} ingredients</p>
          </div>
        </div>

        {ingredients.length === 0 ? (
          <div style={{ padding: '40px', background: '#f9f9f9', borderRadius: '8px', textAlign: 'center' }}>
            <p>No ingredients found</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {ingredients.map((ingredient) => (
              <div
                key={ingredient.ingredient_id}
                style={{
                  padding: '25px',
                  background: 'white',
                  border: '1px solid #eee',
                  borderRadius: '10px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  transition: 'all 0.3s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 5px 15px rgba(183, 110, 121, 0.15)';
                  e.currentTarget.style.borderColor = 'var(--primary-rose)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                  e.currentTarget.style.borderColor = '#eee';
                }}
              >
                {/* Header: Name & ID */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                  <div>
                    <h3 style={{ 
                      margin: '0 0 5px 0', 
                      fontSize: '18px', 
                      color: 'var(--text-dark)',
                      fontWeight: '700'
                    }}>
                      {ingredient.name}
                    </h3>
                    {ingredient.scientific_name && (
                      <p style={{
                        margin: '0',
                        fontSize: '13px',
                        color: '#999',
                        fontStyle: 'italic'
                      }}>
                        Scientific: {ingredient.scientific_name}
                      </p>
                    )}
                  </div>
                  <div style={{
                    padding: '6px 12px',
                    background: 'var(--cream-bg)',
                    color: 'var(--primary-rose)',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    ID: {ingredient.ingredient_id}
                  </div>
                </div>

                {/* Description */}
                {ingredient.description && (
                  <div style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #f0f0f0' }}>
                    <p style={{
                      margin: '0 0 5px 0',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'var(--primary-rose)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      What is it?
                    </p>
                    <p style={{
                      margin: '0',
                      fontSize: '14px',
                      color: '#555',
                      lineHeight: '1.6'
                    }}>
                      {ingredient.description}
                    </p>
                  </div>
                )}

                {/* Benefits */}
                {ingredient.benefits && (
                  <div style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #f0f0f0' }}>
                    <p style={{
                      margin: '0 0 5px 0',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'var(--primary-rose)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Benefits & Effects
                    </p>
                    <p style={{
                      margin: '0',
                      fontSize: '14px',
                      color: '#555',
                      lineHeight: '1.6'
                    }}>
                      {ingredient.benefits}
                    </p>
                  </div>
                )}

                {/* Good For */}
                {ingredient.good_for && (
                  <div style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #f0f0f0' }}>
                    <p style={{
                      margin: '0 0 5px 0',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'var(--primary-rose)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Best For Skin Types
                    </p>
                    <p style={{
                      margin: '0',
                      fontSize: '14px',
                      color: '#555',
                      lineHeight: '1.6'
                    }}>
                      {ingredient.good_for}
                    </p>
                  </div>
                )}

                {/* Should Avoid */}
                {ingredient.avoid_for && (
                  <div style={{ marginBottom: '15px' }}>
                    <p style={{
                      margin: '0 0 5px 0',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#d32f2f',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Caution - Avoid If
                    </p>
                    <p style={{
                      margin: '0',
                      fontSize: '14px',
                      color: '#555',
                      lineHeight: '1.6'
                    }}>
                      {ingredient.avoid_for}
                    </p>
                  </div>
                )}

                {/* Footer: Meta Info */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '15px',
                  borderTop: '1px solid #f0f0f0',
                  marginTop: '15px'
                }}>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    Added: {ingredient.created_at ? new Date(ingredient.created_at).toLocaleDateString() : 'N/A'}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      style={{
                        padding: '6px 14px',
                        background: '#f0f0f0',
                        color: 'var(--text-dark)',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      style={{
                        padding: '6px 14px',
                        background: '#ffebee',
                        color: '#d32f2f',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                    >
                      Delete
                    </button>
                  </div>
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
  // RENDER PAGE
  // ============================================
  const renderPage = () => {
    switch(currentPage) {
      case 'home': return <DashboardHome />;
      case 'pending': return <PendingUsers />;
      case 'users': return <ManageUsers />;
      case 'consultations': return <ConsultationRequests />;
      case 'products': return <Products />;
      case 'ingredients': return <Ingredients />;
      default: return <DashboardHome />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f5' }}>
      {/* SIDEBAR */}
      <div style={{
        width: '250px',
        background: 'white',
        padding: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto'
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: 'var(--primary-rose)' }}>Admin Panel</h3>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { id: 'home', label: 'Dashboard', icon: '◆' },
            { id: 'pending', label: 'Pending Approvals', icon: '○' },
            { id: 'users', label: 'Manage Users', icon: '◉' },
            { id: 'consultations', label: 'Consultation Requests', icon: '▸' },
            { id: 'products', label: 'Products', icon: '□' },
            { id: 'ingredients', label: 'Ingredients', icon: '▲' }
          ].map(page => (
            <button
              key={page.id}
              onClick={() => setCurrentPage(page.id)}
              style={{
                padding: '12px',
                background: currentPage === page.id ? 'var(--primary-rose)' : 'white',
                color: currentPage === page.id ? 'white' : 'var(--text-dark)',
                border: '1px solid #eee',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>
                {page.icon}
              </span>
              {page.label}
            </button>
          ))}
          <button
            onClick={() => logout()}
            style={{
              padding: '12px',
              background: '#ff6b6b',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              marginTop: '20px'
            }}
          >
            🚪 Logout
          </button>
        </nav>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {renderPage()}
      </div>
    </div>
  );
}

export default AdminDashboard;