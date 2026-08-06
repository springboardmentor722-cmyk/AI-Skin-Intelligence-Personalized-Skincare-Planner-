import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/Application.css';

export default function AdminApplication() {
  const [formData, setFormData] = useState({
    department: '',
    admin_level: 'Moderator'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // TODO: Call API to save admin profile
      // await adminAPI.createProfile(formData)
      
      console.log("Admin application:", formData);
      
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Error submitting application');
    }

    setLoading(false);
  };

  return (
    <div className="application-container">
      <div className="application-card">
        <h1>Administrator Setup</h1>
        <p>Complete your administrator profile</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Department *</label>
            <input type="text" name="department" value={formData.department} onChange={handleChange} required placeholder="e.g., Content Moderation" />
          </div>

          <div className="form-group">
            <label>Admin Level *</label>
            <select name="admin_level" value={formData.admin_level} onChange={handleChange}>
              <option>Moderator</option>
              <option>Manager</option>
              <option>Super Admin</option>
            </select>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Submitting...' : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  );
}