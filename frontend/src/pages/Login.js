import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');

    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

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

    try {
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);

      const response = await api.post('/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const token = response.data.access_token;
      const role = response.data.role;
      const userId = response.data.user_id;
      const userName = response.data.name;

      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('userName', userName);
      localStorage.setItem('userId', userId);

      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      if (role === 'admin') {
        navigate('/dashboard/admin');
        setLoading(false);
        return;
      }

      if (role === 'consultant' || role === 'dermatologist') {
        try {
          const statusRes = await api.get('/professional/profile/status', {
            params: { token }
          });

          if (statusRes.data.has_profile && statusRes.data.status === 'approved') {
            navigate(
              role === 'consultant'
                ? '/dashboard/consultant'
                : '/dashboard/dermatologist'
            );
          } else {
            navigate(
              role === 'consultant'
                ? '/consultant/profile'
                : '/dermatologist/profile'
            );
          }
        } catch {
          navigate(
            role === 'consultant'
              ? '/consultant/profile'
              : '/dermatologist/profile'
          );
        }

        setLoading(false);
        return;
      }

      try {
        const profileRes = await api.get('/skin-profile', {
          params: { token }
        });

        if (profileRes.status === 200 && profileRes.data) {
          try {
            const assessmentRes = await api.get('/api/v1/assessment/score', {
              params: { token }
            });

            if (
              assessmentRes.status === 200 &&
              assessmentRes.data &&
              assessmentRes.data.score > 0
            ) {
              navigate('/dashboard');
            } else {
              navigate('/assessment');
            }
          } catch {
            navigate('/assessment');
          }
        } else {
          navigate('/profile');
        }
      } catch {
        navigate('/profile');
      }
    } catch (err) {
      console.error('Login error:', err);

      if (err.response && err.response.status === 403) {
        setError('Your account is pending approval. Please wait for admin verification.');
      } else if (err.response && err.response.status === 401) {
        setError('Invalid email or password');
      } else if (err.response && err.response.status === 422) {
        setError('Invalid request format. Please try again.');
      } else {
        setError('Login failed. Please try again.');
      }

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
          <span style={styles.panelEyebrow}>WELCOME BACK</span>
          <h1 style={styles.panelTitle}>Your skin journey continues here.</h1>
          <p style={styles.panelText}>
            Access your personalized skin insights, routines, progress tracking,
            and professional guidance.
          </p>
        </div>

        <div style={styles.panelBottom}>Intelligent care. Personal progress.</div>
      </div>

      <div style={styles.formArea}>
        <div style={styles.card}>
          <div style={styles.mobileBrand}>
            <span style={styles.brandMark}>✦</span>
            <span>Skin Intelligence</span>
          </div>

          <div style={styles.cardHeader}>
            <span style={styles.cardEyebrow}>PATIENT PORTAL</span>
            <h2 style={styles.title}>Welcome back</h2>
            <p style={styles.subtitle}>Log in to access your account.</p>
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <label style={styles.label} htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={focusInput}
              onBlur={blurInput}
              style={styles.input}
              required
            />

            <label style={styles.label} htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={focusInput}
              onBlur={blurInput}
              style={styles.input}
              required
            />

            <div style={styles.optionsRow}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={styles.checkbox}
                />
                Remember me
              </label>

              <a href="/forgot-password" style={styles.smallLink}>
                Forgot Password?
              </a>
            </div>

            <button
              type="submit"
              style={styles.button}
              disabled={loading}
              onMouseEnter={raiseBtn}
              onMouseLeave={lowerBtn}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p style={styles.linkText}>
            Don’t have an account?{' '}
            <a href="/register" style={styles.link}>
              Create account
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
    maxWidth: '472px',
    padding: '44px',
    boxSizing: 'border-box',
    border: '1px solid #E9ECF3',
    borderRadius: '26px',
    backgroundColor: '#FFFFFF',
    boxShadow: '0 24px 60px rgba(20,30,55,.10)'
  },
  mobileBrand: {
    display: 'none'
  },
  cardHeader: {
    marginBottom: '30px'
  },
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
  subtitle: {
    margin: 0,
    color: '#7C879D',
    fontSize: '14px',
    lineHeight: '1.55'
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
    marginBottom: '18px',
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
  optionsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    margin: '-3px 0 24px'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#7C879D',
    fontSize: '12px',
    cursor: 'pointer'
  },
  checkbox: {
    width: '15px',
    height: '15px',
    accentColor: '#6C63D9'
  },
  smallLink: {
    color: '#6C63D9',
    fontSize: '12px',
    fontWeight: '700',
    textDecoration: 'none'
  },
  button: {
    width: '100%',
    padding: '15px',
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
    fontSize: '13px',
    lineHeight: '1.5'
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

export default Login;