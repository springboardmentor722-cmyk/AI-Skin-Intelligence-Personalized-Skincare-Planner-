// frontend/src/pages/DermatologistProfile.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/professional-theme.css';

function DermatologistProfile() {
  const [formData, setFormData] = useState({
    phone: '',
    bio: '',
    years_experience: '',
    specialization: '',
    clinic_affiliation: '',
    medical_degree: '',
    license_number: '',
    issuing_council: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    checkProfileStatus();
  }, []);

  const checkProfileStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/professional/profile/status', { params: { token } });
      if (res.data.has_profile && res.data.status === 'approved') {
        navigate('/dashboard/dermatologist');
      }
    } catch (err) {
      console.error('Error checking profile:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      await api.post('/professional/profile/dermatologist', formData, { params: { token } });
      setSuccess('✅ Profile submitted for verification! You will be notified once approved.');
      setLoading(false);
      setTimeout(() => navigate('/login'), 5000);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to submit profile. Please try again.';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="professional-page role-dermatologist" style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <span style={styles.icon}>🩺</span>
          <h1 style={styles.title}>Dermatologist Profile</h1>
          <p style={styles.subtitle}>Complete your medical profile to start receiving patients.</p>
        </div>

        {error && <div className="professional-alert-error">{error}</div>}
        {success && <div className="professional-alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="professional-field" style={styles.field}>
            <label style={styles.label}>Phone Number *</label>
            <input
              type="text"
              name="phone"
              placeholder="Enter your phone number"
              value={formData.phone}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          <div className="professional-field" style={styles.field}>
            <label style={styles.label}>Professional Bio</label>
            <textarea
              name="bio"
              placeholder="Tell patients about your experience and approach..."
              value={formData.bio}
              onChange={handleChange}
              style={styles.textarea}
              rows="3"
            />
          </div>

          <div className="professional-field" style={styles.field}>
            <label style={styles.label}>Years of Experience *</label>
            <input
              type="number"
              name="years_experience"
              placeholder="e.g., 5"
              value={formData.years_experience}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          <div className="professional-field" style={styles.field}>
            <label style={styles.label}>Specialization *</label>
            <input
              type="text"
              name="specialization"
              placeholder="e.g., Medical Dermatology, Cosmetic Dermatology"
              value={formData.specialization}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          <div className="professional-field" style={styles.field}>
            <label style={styles.label}>Clinic Affiliation *</label>
            <input
              type="text"
              name="clinic_affiliation"
              placeholder="e.g., Skin Care Clinic, City Hospital"
              value={formData.clinic_affiliation}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          <div className="professional-field" style={styles.field}>
            <label style={styles.label}>Medical Degree *</label>
            <input
              type="text"
              name="medical_degree"
              placeholder="e.g., MBBS, MD, DNB, DDVL"
              value={formData.medical_degree}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          <div className="professional-field" style={styles.field}>
            <label style={styles.label}>Medical License Number *</label>
            <input
              type="text"
              name="license_number"
              placeholder="Enter your medical license number"
              value={formData.license_number}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          <div className="professional-field" style={styles.field}>
            <label style={styles.label}>Issuing Medical Council *</label>
            <input
              type="text"
              name="issuing_council"
              placeholder="e.g., Medical Council of India, State Medical Board"
              value={formData.issuing_council}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          <button
            type="submit"
            className="professional-primary-button"
            style={styles.button}
            disabled={loading}
          >
            {loading ? '⏳ Submitting...' : '✅ Submit for Verification'}
          </button>

          <p style={styles.footerNote}>
            ⚕️ Your credentials will be verified before approval.
          </p>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    padding: '20px',
    background: '#f5f7fb',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: '40px 44px',
    borderRadius: '20px',
    boxShadow: '0 14px 38px rgba(23,35,60,0.07)',
    maxWidth: '620px',
    width: '100%',
    border: '1px solid #E7EAF1',
  },
  header: {
    textAlign: 'center',
    marginBottom: '28px',
  },
  icon: {
    fontSize: '42px',
    display: 'block',
    marginBottom: '8px',
  },
  title: {
    color: '#17233C',
    fontSize: '28px',
    fontWeight: '700',
    margin: '0 0 4px 0',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    color: '#778198',
    fontSize: '14px',
    margin: '0',
    lineHeight: '1.5',
  },
  field: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '700',
    color: '#34415B',
    marginBottom: '5px',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid #DCE1EC',
    borderRadius: '12px',
    fontSize: '14px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    backgroundColor: '#FBFCFE',
    transition: 'border-color 0.2s ease',
    outline: 'none',
  },
  textarea: {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid #DCE1EC',
    borderRadius: '12px',
    fontSize: '14px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    resize: 'vertical',
    backgroundColor: '#FBFCFE',
    outline: 'none',
    minHeight: '80px',
  },
  button: {
    width: '100%',
    padding: '14px',
    border: 'none',
    borderRadius: '12px',
    backgroundColor: '#6c63d9',
    color: '#ffffff',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '700',
    fontFamily: 'inherit',
    marginTop: '8px',
    boxShadow: '0 9px 20px rgba(108,99,217,0.25)',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  },
  footerNote: {
    textAlign: 'center',
    color: '#9AA3B5',
    fontSize: '12px',
    marginTop: '14px',
    fontStyle: 'italic',
  },
};

export default DermatologistProfile;