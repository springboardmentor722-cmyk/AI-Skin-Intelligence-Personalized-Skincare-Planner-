// frontend/src/pages/AdminUsers.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import AdminSidebar from '../components/AdminSidebar';
import '../styles/admin-theme.css';

function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState('/admin/users');
  const [userName, setUserName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [toggling, setToggling] = useState(null);

  const roles = ['All', 'User', 'Consultant', 'Dermatologist', 'Admin'];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    const name = localStorage.getItem('userName');
    setUserName(name || 'Admin');
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');

    try {
      const res = await api.get('/admin/users', { params: { token } });
      setUsers(res.data || []);
      setFilteredUsers(res.data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Could not load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    applyFilters(term, roleFilter);
  };

  const handleRoleFilter = (role) => {
    setRoleFilter(role);
    applyFilters(searchTerm, role);
  };

  const applyFilters = (term, role) => {
    let filtered = users;

    if (term) {
      filtered = filtered.filter(u =>
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.username.toLowerCase().includes(term)
      );
    }

    if (role !== 'All') {
      filtered = filtered.filter(u => u.role === role.toLowerCase());
    }

    setFilteredUsers(filtered);
  };

  const openDetail = (user) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  const closeDetail = () => {
    setShowDetailModal(false);
    setSelectedUser(null);
  };

  const toggleUserStatus = async (userId) => {
    if (!window.confirm('Are you sure you want to toggle this user\'s status?')) return;

    setToggling(userId);
    try {
      const token = localStorage.getItem('token');
      await api.put(`/admin/users/${userId}/toggle-status`, {}, { params: { token } });
      fetchUsers();
    } catch (err) {
      alert('Failed to toggle user status: ' + (err.response?.data?.detail || 'Unknown error'));
    } finally {
      setToggling(null);
    }
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
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <AdminSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main className={`admin-main ${sidebarOpen ? '' : 'is-collapsed'}`}>
        <div className="admin-header">
          <div>
            <div className="admin-kicker">USER MANAGEMENT</div>
            <h1 className="admin-title">👤 User Management</h1>
            <p className="admin-subtitle">Manage all users on the platform.</p>
          </div>
          <div style={styles.topBarRight}>
            <button className="admin-primary-button" onClick={() => alert('Add user form coming soon!')}>
              + Add User
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
            <input
              type="text"
              placeholder="Search by name, email, or username..."
              value={searchTerm}
              onChange={handleSearch}
              style={styles.searchInput}
            />
            <div style={styles.roleFilters}>
              {roles.map(role => (
                <button
                  key={role}
                  style={{...styles.roleBtn, ...(roleFilter === role ? {...styles.roleBtnActive, backgroundColor: '#0d9488'} : {})}}
                  onClick={() => handleRoleFilter(role)}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
          <div style={styles.filterStats}>
            <span>Showing {filteredUsers.length} of {users.length} users</span>
          </div>
        </div>

        <div className="admin-surface">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Profile</th>
                <th>Assessment</th>
                <th>Joined</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{...styles.td, textAlign: 'center', color: '#778198' }}>
                    No users found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td style={styles.td}>
                      <div style={styles.userCell}>
                        <div style={styles.userAvatar}>
                          {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div style={styles.userName}>{user.name}</div>
                          <div style={styles.userEmail}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={user.role === 'admin' ? {...styles.roleAdmin, backgroundColor: '#0d9488'} : user.role === 'consultant' ? styles.roleConsultant : user.role === 'dermatologist' ? styles.roleDermatologist : styles.roleUser}>
                        {user.role?.charAt(0).toUpperCase() + user.role?.slice(1) || 'User'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={user.is_approved ? styles.statusActive : styles.statusInactive}>
                        {user.is_approved ? '✅ Active' : '❌ Inactive'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {user.has_profile ? '✅' : '❌'}
                    </td>
                    <td style={styles.td}>
                      {user.has_assessment ? '✅' : '❌'}
                    </td>
                    <td style={styles.td}>
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={styles.td}>
                      <button style={{...styles.viewBtn, backgroundColor: '#0d9488' }} onClick={() => openDetail(user)}>
                        View
                      </button>
                      <button
                        style={user.is_approved ? styles.deactivateBtn : styles.activateBtn}
                        onClick={() => toggleUserStatus(user.id)}
                        disabled={toggling === user.id}
                      >
                        {toggling === user.id ? '...' : user.is_approved ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {showDetailModal && selectedUser && (
        <div style={styles.modalOverlay} onClick={closeDetail}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button style={styles.modalClose} onClick={closeDetail}>✕</button>
            <h2 style={styles.modalTitle}>User Details — {selectedUser.name}</h2>

            <div style={styles.modalSection}>
              <div style={styles.modalGrid}>
                <div><strong>Name:</strong> {selectedUser.name}</div>
                <div><strong>Email:</strong> {selectedUser.email}</div>
                <div><strong>Username:</strong> {selectedUser.username}</div>
                <div><strong>Role:</strong> {selectedUser.role}</div>
                <div><strong>Status:</strong> {selectedUser.is_approved ? 'Active' : 'Inactive'}</div>
                <div><strong>Has Profile:</strong> {selectedUser.has_profile ? 'Yes' : 'No'}</div>
                <div><strong>Has Assessment:</strong> {selectedUser.has_assessment ? 'Yes' : 'No'}</div>
                <div><strong>Joined:</strong> {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleString() : 'N/A'}</div>
              </div>
            </div>

            <div style={styles.modalActions}>
              <button style={styles.closeModalBtn} onClick={closeDetail}>Close</button>
            </div>
          </div>
        </div>
      )}
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
    alignItems: 'center',
    marginBottom: '10px'
  },
  searchInput: {
    flex: 1,
    padding: '10px 14px',
    border: '1px solid #DCE1EC',
    borderRadius: '12px',
    fontSize: '14px',
    fontFamily: 'inherit',
    minWidth: '200px',
    outline: 'none',
    backgroundColor: '#FBFCFE'
  },
  roleFilters: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px'
  },
  roleBtn: {
    padding: '6px 14px',
    backgroundColor: '#F5F7FB',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '12px',
    fontFamily: 'inherit',
    color: '#778198'
  },
  roleBtnActive: {
    color: '#FFFFFF'
  },
  filterStats: {
    fontSize: '13px',
    color: '#778198'
  },
  td: {
    padding: '12px 8px',
    borderBottom: '1px solid #F0F2F6',
    color: '#17233C',
    verticalAlign: 'middle'
  },
  userCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  userAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#0d9488',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: '13px',
    flexShrink: 0
  },
  userName: {
    fontWeight: '500',
    color: '#17233C'
  },
  userEmail: {
    fontSize: '11px',
    color: '#778198'
  },
  roleUser: {
    padding: '2px 10px',
    backgroundColor: '#F5F7FB',
    borderRadius: '12px',
    fontSize: '11px',
    color: '#17233C'
  },
  roleAdmin: {
    padding: '2px 10px',
    color: '#FFFFFF',
    borderRadius: '12px',
    fontSize: '11px'
  },
  roleConsultant: {
    padding: '2px 10px',
    backgroundColor: '#0d9488',
    color: '#FFFFFF',
    borderRadius: '12px',
    fontSize: '11px'
  },
  roleDermatologist: {
    padding: '2px 10px',
    backgroundColor: '#6c63d9',
    color: '#FFFFFF',
    borderRadius: '12px',
    fontSize: '11px'
  },
  statusActive: {
    color: '#10B981',
    fontWeight: '500',
    fontSize: '12px'
  },
  statusInactive: {
    color: '#DC2626',
    fontWeight: '500',
    fontSize: '12px'
  },
  viewBtn: {
    padding: '4px 12px',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontFamily: 'inherit',
    marginRight: '6px'
  },
  activateBtn: {
    padding: '4px 12px',
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontFamily: 'inherit'
  },
  deactivateBtn: {
    padding: '4px 12px',
    backgroundColor: '#DC2626',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontFamily: 'inherit'
  },
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
    backdropFilter: 'blur(4px)'
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
    boxShadow: '0 24px 60px rgba(23,35,60,0.15)'
  },
  modalClose: {
    position: 'absolute',
    top: '12px',
    right: '16px',
    background: 'none',
    border: 'none',
    fontSize: '22px',
    cursor: 'pointer',
    color: '#778198'
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#17233C',
    marginBottom: '20px'
  },
  modalSection: {
    marginBottom: '16px'
  },
  modalGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    fontSize: '14px'
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '16px'
  },
  closeModalBtn: {
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

export default AdminUsers;