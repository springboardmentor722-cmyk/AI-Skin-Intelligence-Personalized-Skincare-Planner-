import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function ProfessionalRegister() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirm_password: '',
    role: '',
    license_number: '',
    clinic_affiliation: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- UI-only micro-interaction helpers (no logic/state changes) ---
  const focusInput = (e) => {
    e.target.style.borderColor = '#6C63D9';
    e.target.style.backgroundColor = '#FFFFFF';
    e.target.style.boxShadow = '0 0 0 4px rgba(108,99,217,.12)';
  };
  const blurInput = (e) => {
    e.target.style.borderColor = '#DDE2EC';
    e.target.style.backgroundColor = '#FBFCFE';
    e.target.style.boxShadow = 'none';
  };
  const raiseBtn = (e) => {
    if (e.currentTarget.disabled) return;
    e.currentTarget.style.transform = 'translateY(-2px)';
    e.currentTarget.style.boxShadow = '0 16px 34px rgba(108,99,217,.36)';
  };
  const lowerBtn = (e) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = '0 10px 22px rgba(108,99,217,.25)';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (!formData.role) {
      setError('Please select a professional role');
      setLoading(false);
      return;
    }

    try {
      const registerResponse = await api.post('/register/professional', {
        name: formData.name,
        email: formData.email,
        username: formData.username,
        password: formData.password,
        confirm_password: formData.confirm_password,
        role: formData.role,
        license_number: formData.license_number,
        clinic_affiliation: formData.clinic_affiliation
      });

      const token = registerResponse.data.access_token;
      localStorage.setItem('token', token);
      localStorage.setItem('role', registerResponse.data.role);
      localStorage.setItem('userName', registerResponse.data.name);
      localStorage.setItem('userId', registerResponse.data.user_id);

      setSuccess('Registration successful! Redirecting to complete your profile...');
      setLoading(false);

      setTimeout(() => {
        if (formData.role === 'consultant') {
          navigate('/consultant/profile');
        } else if (formData.role === 'dermatologist') {
          navigate('/dermatologist/profile');
        } else if (formData.role === 'admin') {
          navigate('/dashboard/admin');
        } else {
          navigate('/login');
        }
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed. Please try again.';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.decorativePanel}>
        <div style={styles.panelGlow} aria-hidden="true" />

        <button type="button" style={styles.brandButton} onClick={() => navigate('/')}>
          <span style={styles.brandMark}>✦</span>
          <span>Skin Intelligence</span>
        </button>

        <div style={styles.panelContent}>
          <span style={styles.panelEyebrow}>FOR SKINCARE PROFESSIONALS</span>
          <h1 style={styles.panelTitle}>Bring expert care into one connected platform.</h1>
          <p style={styles.panelText}>
            Join Skin Intelligence and support clients with organized,
            data-informed skincare guidance.
          </p>
        </div>

        <div style={styles.panelBottom}>Consultants. Dermatologists. Better care.</div>
      </div>

      <div style={styles.formArea}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardEyebrow}>PROFESSIONAL REGISTRATION</span>
            <h2 style={styles.title}>Create your professional account</h2>
            <p style={styles.subtitle}>
              Register as a consultant, dermatologist, or admin.
            </p>
          </div>

          {error && <div style={styles.error}>{error}</div>}
          {success && <div style={styles.success}>{success}</div>}

          <form onSubmit={handleSubmit}>
            <label style={styles.label} htmlFor="professional-name">Full Name</label>
            <input
              id="professional-name"
              type="text"
              name="name"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
              onFocus={focusInput}
              onBlur={blurInput}
              style={styles.input}
              required
            />

            <label style={styles.label} htmlFor="professional-email">Email</label>
            <input
              id="professional-email"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              onFocus={focusInput}
              onBlur={blurInput}
              style={styles.input}
              required
            />

            <label style={styles.label} htmlFor="professional-username">Username</label>
            <input
              id="professional-username"
              type="text"
              name="username"
              placeholder="Choose a username"
              value={formData.username}
              onChange={handleChange}
              onFocus={focusInput}
              onBlur={blurInput}
              style={styles.input}
              required
            />

            <div style={styles.twoColumn}>
              <div>
                <label style={styles.label} htmlFor="professional-password">Password</label>
                <input
                  id="professional-password"
                  type="password"
                  name="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={focusInput}
                  onBlur={blurInput}
                  style={styles.input}
                  required
                />
              </div>

              <div>
                <label style={styles.label} htmlFor="professional-confirm-password">
                  Confirm Password
                </label>
                <input
                  id="professional-confirm-password"
                  type="password"
                  name="confirm_password"
                  placeholder="Confirm password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  onFocus={focusInput}
                  onBlur={blurInput}
                  style={styles.input}
                  required
                />
              </div>
            </div>

            <label style={styles.label} htmlFor="professional-role">Professional Role</label>
            <select
              id="professional-role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              onFocus={focusInput}
              onBlur={blurInput}
              style={styles.input}
              required
            >
              <option value="">Select Professional Role</option>
              <option value="consultant">Skincare Consultant</option>
              <option value="dermatologist">Dermatologist</option>
              <option value="admin">Admin</option>
            </select>

            <label style={styles.label} htmlFor="professional-license">
              License / Certificate Number
            </label>
            <input
              id="professional-license"
              type="text"
              name="license_number"
              placeholder="Enter license or certificate number"
              value={formData.license_number}
              onChange={handleChange}
              onFocus={focusInput}
              onBlur={blurInput}
              style={styles.input}
              required
            />

            <label style={styles.label} htmlFor="professional-clinic">
              Clinic / Salon Affiliation
            </label>
            <input
              id="professional-clinic"
              type="text"
              name="clinic_affiliation"
              placeholder="Optional"
              value={formData.clinic_affiliation}
              onChange={handleChange}
              onFocus={focusInput}
              onBlur={blurInput}
              style={styles.input}
            />

            <button
              type="submit"
              style={styles.button}
              disabled={loading}
              onMouseEnter={raiseBtn}
              onMouseLeave={lowerBtn}
            >
              {loading ? 'Submitting...' : 'Create Professional Account'}
            </button>
          </form>

          <p style={styles.linkText}>
            Already have an account?{' '}
            <a href="/login" style={styles.link}>
              Login
            </a>
          </p>

          <p style={styles.linkTextSmall}>
            Not a professional?{' '}
            <a href="/register" style={styles.link}>
              Register as a regular user
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'grid',
    gridTemplateColumns: 'minmax(360px, 0.9fr) minmax(520px, 1.1fr)',
    backgroundColor: '#F4F6FB',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  decorativePanel: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '100vh',
    padding: '38px 8%',
    boxSizing: 'border-box',
    overflow: 'hidden',
    color: '#FFFFFF',
    background: 'linear-gradient(150deg, #0E1A33 0%, #172A4D 55%, #26406B 100%)'
  },
  panelGlow: {
    position: 'absolute',
    top: '-120px',
    right: '-140px',
    width: '360px',
    height: '360px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(141,134,242,.28), transparent 70%)',
    pointerEvents: 'none'
  },
  brandButton: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: '11px',
    padding: 0,
    border: 'none',
    backgroundColor: 'transparent',
    color: '#FFFFFF',
    cursor: 'pointer',
    fontSize: '17px',
    fontWeight: '800',
    letterSpacing: '-0.2px',
    fontFamily: 'inherit'
  },
  brandMark: {
    width: '38px',
    height: '38px',
    display: 'grid',
    placeItems: 'center',
    borderRadius: '13px',
    background: 'linear-gradient(135deg, #8E86F5, #5D57C7)',
    color: '#FFFFFF',
    fontSize: '19px',
    boxShadow: '0 10px 24px rgba(108,99,217,.4)'
  },
  panelContent: {
    position: 'relative',
    maxWidth: '470px',
    marginTop: 'auto',
    marginBottom: 'auto'
  },
  panelEyebrow: {
    color: '#BDB8FF',
    fontSize: '11px',
    fontWeight: '800',
    letterSpacing: '1.6px'
  },
  panelTitle: {
    margin: '18px 0',
    fontSize: 'clamp(34px, 4vw, 58px)',
    lineHeight: '1.07',
    letterSpacing: '-2px',
    fontWeight: '800'
  },
  panelText: {
    margin: 0,
    color: '#C8D1E5',
    fontSize: '16px',
    lineHeight: '1.75'
  },
  panelBottom: {
    position: 'relative',
    color: '#9FB0CC',
    fontSize: '12px',
    letterSpacing: '.2px'
  },
  formArea: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 7%'
  },
  card: {
    width: '100%',
    maxWidth: '650px',
    padding: '44px',
    boxSizing: 'border-box',
    border: '1px solid #E9ECF3',
    borderRadius: '26px',
    backgroundColor: '#FFFFFF',
    boxShadow: '0 24px 60px rgba(20,30,55,.10)'
  },
  cardHeader: { marginBottom: '28px' },
  cardEyebrow: {
    color: '#6C63D9',
    fontSize: '11px',
    fontWeight: '800',
    letterSpacing: '1.4px'
  },
  title: {
    margin: '11px 0 8px',
    color: '#17233C',
    fontSize: '32px',
    fontWeight: '800',
    letterSpacing: '-1px'
  },
  subtitle: { margin: 0, color: '#7C879D', fontSize: '14px', lineHeight: '1.55' },
  twoColumn: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '14px'
  },
  label: {
    display: 'block',
    margin: '0 0 8px',
    color: '#34415B',
    fontSize: '12px',
    fontWeight: '800',
    letterSpacing: '.2px'
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    marginBottom: '16px',
    boxSizing: 'border-box',
    border: '1px solid #DDE2EC',
    borderRadius: '12px',
    outline: 'none',
    backgroundColor: '#FBFCFE',
    color: '#17233C',
    fontSize: '14px',
    fontFamily: 'inherit',
    transition: 'border-color .18s ease, box-shadow .18s ease, background-color .18s ease'
  },
  button: {
    width: '100%',
    padding: '15px',
    marginTop: '4px',
    border: 'none',
    borderRadius: '12px',
    backgroundColor: '#6C63D9',
    color: '#FFFFFF',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '800',
    fontFamily: 'inherit',
    boxShadow: '0 10px 22px rgba(108,99,217,.25)',
    transition: 'transform .18s ease, box-shadow .18s ease'
  },
  error: {
    marginBottom: '20px',
    padding: '13px 15px',
    border: '1px solid #F3B5BB',
    borderRadius: '12px',
    backgroundColor: '#FFF1F2',
    color: '#B63B49',
    fontSize: '13px'
  },
  success: {
    marginBottom: '20px',
    padding: '13px 15px',
    border: '1px solid #A9DED5',
    borderRadius: '12px',
    backgroundColor: '#ECFAF7',
    color: '#21776E',
    fontSize: '13px',
    lineHeight: '1.5'
  },
  linkText: {
    margin: '26px 0 0',
    color: '#7C879D',
    fontSize: '13px',
    textAlign: 'center'
  },
  linkTextSmall: {
    margin: '12px 0 0',
    color: '#98A2B7',
    fontSize: '12px',
    textAlign: 'center'
  },
  link: {
    color: '#6C63D9',
    fontWeight: '800',
    textDecoration: 'none'
  }
};

export default ProfessionalRegister;