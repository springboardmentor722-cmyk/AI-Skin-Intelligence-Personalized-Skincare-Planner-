// frontend/src/pages/MyProfile.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import PatientSidebar from '../components/PatientSidebar';
import '../styles/patient-theme.css';

function MyProfile() {
  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    gender: '',
    contact_number: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [existingProfile, setExistingProfile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    api.get('/skin-profile', { params: { token } })
      .then(res => {
        setExistingProfile(true);
        setFormData({
          full_name: res.data.full_name || '',
          age: res.data.age || '',
          gender: res.data.gender || '',
          contact_number: res.data.contact_number || '',
        });
      })
      .catch(() => {
        setExistingProfile(false);
      });
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!formData.full_name || !formData.age || !formData.gender || !formData.contact_number) {
      setError('All fields are mandatory to unlock your dashboard.');
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login again.');
      setLoading(false);
      return;
    }

    try {
      let existingData = {};
      if (existingProfile) {
        try {
          const existing = await api.get('/skin-profile', { params: { token } });
          existingData = existing.data;
        } catch (e) {}
      }

      const profileData = {
        full_name: formData.full_name,
        age: parseInt(formData.age),
        gender: formData.gender,
        contact_number: formData.contact_number,
        skin_type: existingData.skin_type || '',
        skin_concerns: existingData.skin_concerns || '',
        water_intake: existingData.water_intake || 0,
        sleep_duration: existingData.sleep_duration || 0,
        exercise_habits: existingData.exercise_habits || '',
        stress_level: existingData.stress_level || '',
        environmental_exposure: existingData.environmental_exposure || '',
        image_data: existingData.image_data || '',
      };

      const method = existingProfile ? 'put' : 'post';
      await api[method]('/skin-profile', profileData, { params: { token } });

      setSuccess('Profile saved successfully!');
      setLoading(false);
      setTimeout(() => {
        navigate('/assessment');
      }, 1500);
    } catch (err) {
      setLoading(false);
      const msg = err.response?.data?.detail || 'Failed to save profile. Please try again.';
      setError(msg);
    }
  };

  return (
    <div className="patient-page">
      <PatientSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main className={`patient-main ${sidebarOpen ? '' : 'is-collapsed'}`}>
        <div className="patient-header">
          <div>
            <div className="patient-kicker">MY PROFILE</div>
            <h1 className="patient-title">Complete Your Profile</h1>
            <p className="patient-subtitle">Fill in your details to continue to your skin assessment.</p>
          </div>
        </div>

        {error && <div className="patient-alert-error">{error}</div>}
        {success && (
          <div style={{ 
            padding: '13px 15px', 
            marginBottom: '18px', 
            borderRadius: '12px', 
            backgroundColor: '#E4F7F4', 
            color: '#1A7A6E', 
            fontSize: '13px', 
            border: '1px solid #A8D9D2' 
          }}>
            ✅ {success}
          </div>
        )}

        <div className="patient-surface" style={{ maxWidth: '700px', margin: '0 auto' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '18px',
              width: '100%'
            }}>
              <div className="patient-field" style={{ gridColumn: '1 / 2' }}>
                <label htmlFor="full_name">Full Name</label>
                <input
                  id="full_name"
                  type="text"
                  name="full_name"
                  placeholder="Enter your full name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <div className="patient-field" style={{ gridColumn: '2 / 3' }}>
                <label htmlFor="age">Age</label>
                <input
                  id="age"
                  type="number"
                  name="age"
                  placeholder="Enter your age"
                  value={formData.age}
                  onChange={handleChange}
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <div className="patient-field" style={{ gridColumn: '1 / 2' }}>
                <label htmlFor="gender">Gender</label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                  style={{ width: '100%' }}
                >
                  <option value="">Select</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="patient-field" style={{ gridColumn: '2 / 3' }}>
                <label htmlFor="contact_number">Contact Number</label>
                <input
                  id="contact_number"
                  type="text"
                  name="contact_number"
                  placeholder="+91 98765 43210"
                  value={formData.contact_number}
                  onChange={handleChange}
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1', marginTop: '4px' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  padding: '12px 16px', 
                  borderRadius: '12px', 
                  backgroundColor: '#F5F7FB', 
                  borderLeft: '4px solid #6C63D9' 
                }}>
                  <span style={{ fontSize: '18px' }}>📋</span>
                  <span style={{ color: '#34415B', fontSize: '13px' }}>All fields are mandatory to unlock your dashboard</span>
                </div>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <button 
                  type="submit" 
                  className="patient-primary-button" 
                  disabled={loading} 
                  style={{ 
                    width: '100%', 
                    padding: '14px', 
                    fontSize: '15px',
                    border: 'none',
                    borderRadius: '12px',
                    backgroundColor: '#6C63D9',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontFamily: 'inherit',
                    boxShadow: '0 9px 20px rgba(108,99,217,.22)'
                  }}
                >
                  {loading ? 'Saving...' : 'Continue to Skin Assessment →'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default MyProfile;