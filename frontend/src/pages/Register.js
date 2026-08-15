import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../services/api';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirm_password: ''
  });
  const [error, setError] = useState('');
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

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await register({
        name: formData.name,
        email: formData.email,
        username: formData.username,
        password: formData.password,
        confirm_password: formData.confirm_password
      });

      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('role', response.data.role);
      localStorage.setItem('userName', response.data.name);
      localStorage.setItem('userId', response.data.user_id);

      navigate('/profile');
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
          <span style={styles.panelEyebrow}>START YOUR JOURNEY</span>
          <h1 style={styles.panelTitle}>Personalized care begins with understanding.</h1>
          <p style={styles.panelText}>
            Create your profile and receive skincare guidance designed around
            your skin, goals, and lifestyle.
          </p>
        </div>

        <div style={styles.panelBottom}>Your skin. Your data. Your journey.</div>
      </div>

      <div style={styles.formArea}>
        <div style={styles.card}>
          <div style={styles.mobileBrand}>
            <span style={styles.brandMark}>✦</span>
            <span>Skin Intelligence</span>
          </div>

          <div style={styles.cardHeader}>
            <span style={styles.cardEyebrow}>PATIENT REGISTRATION</span>
            <h2 style={styles.title}>Create your account</h2>
            <p style={styles.subtitle}>
              Join us for personalized skincare recommendations.
            </p>
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <label style={styles.label} htmlFor="register-name">Full Name</label>
            <input
              id="register-name"
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

            <label style={styles.label} htmlFor="register-email">Email</label>
            <input
              id="register-email"
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

            <label style={styles.label} htmlFor="register-username">Username</label>
            <input
              id="register-username"
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

            <label style={styles.label} htmlFor="register-password">Password</label>
            <input
              id="register-password"
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

            <label style={styles.label} htmlFor="register-confirm-password">
              Confirm Password
            </label>
            <input
              id="register-confirm-password"
              type="password"
              name="confirm_password"
              placeholder="Confirm your password"
              value={formData.confirm_password}
              onChange={handleChange}
              onFocus={focusInput}
              onBlur={blurInput}
              style={styles.input}
              required
            />

            <button
              type="submit"
              style={styles.button}
              disabled={loading}
              onMouseEnter={raiseBtn}
              onMouseLeave={lowerBtn}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p style={styles.linkText}>
            Already have an account?{' '}
            <a href="/login" style={styles.link}>
              Login
            </a>
          </p>

          <p style={styles.professionalText}>
            Are you a skincare professional?{' '}
            <a href="/register/professional" style={styles.link}>
              Sign up here
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
    gridTemplateColumns: 'minmax(360px, 0.9fr) minmax(460px, 1.1fr)',
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
    maxWidth: '500px',
    padding: '44px',
    boxSizing: 'border-box',
    border: '1px solid #E9ECF3',
    borderRadius: '26px',
    backgroundColor: '#FFFFFF',
    boxShadow: '0 24px 60px rgba(20,30,55,.10)'
  },
  mobileBrand: { display: 'none' },
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
  linkText: {
    margin: '26px 0 0',
    color: '#7C879D',
    fontSize: '13px',
    textAlign: 'center'
  },
  professionalText: {
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

export default Register;