import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/Dashboard.css';
import '../styles/Auth.css';

export default function RoleAuth() {
  const { login, register } = useContext(AuthContext);
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    first_name: '',
    last_name: '',
    role_id: 1
  });

  // ============ LOGIN HANDLERS ============
  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!loginData.email || !loginData.password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      const result = await login(loginData.email, loginData.password);
      
      if (result.success) {
        const roleRedirects = {
          1: '/user/dashboard',
          2: '/dermatologist/dashboard',
          3: '/consultant/dashboard',
          4: '/admin/dashboard'
        };
        setTimeout(() => navigate(roleRedirects[result.user.role_id] || '/user/dashboard'), 100);
      } else {
        setError(result.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('Error logging in: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ============ REGISTER HANDLERS ============
  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!registerData.email || !registerData.password || !registerData.username || 
        !registerData.first_name || !registerData.last_name) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (registerData.password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      const result = await register({
        email: registerData.email,
        password: registerData.password,
        username: registerData.username,
        first_name: registerData.first_name,
        last_name: registerData.last_name,
        role_id: parseInt(registerData.role_id)
      });

      if (result.success) {
        setError('');
        setMode('login');
        setLoginData({ email: registerData.email, password: registerData.password });
        alert('Registration successful! Please wait for admin approval before logging in.');
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (err) {
      setError('Error registering: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-background"></div>
      
      <div className="auth-content">
        {mode === 'login' ? (
          <div className="auth-card login-card">
            <div className="auth-header">
              <h1>Glow & Thrive</h1>
              <p>Your Personal Skincare Companion</p>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleLogin} className="auth-form">
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={loginData.email}
                  onChange={handleLoginChange}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  placeholder="Enter your password"
                  required
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary btn-large"
                disabled={loading}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <div className="auth-divider">
              <span>New to Glow & Thrive?</span>
            </div>

            <button 
              className="btn btn-secondary btn-large"
              onClick={() => {
                setMode('register');
                setError('');
              }}
            >
              Create Account
            </button>

            <div className="auth-footer">
              <p>Experience personalized skincare recommendations powered by AI</p>
            </div>
          </div>
        ) : (
          <div className="auth-card register-card">
            <div className="auth-header">
              <h1>Join Glow & Thrive</h1>
              <p>Start Your Skincare Journey</p>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleRegister} className="auth-form">
              <div className="form-row">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    value={registerData.first_name}
                    onChange={handleRegisterChange}
                    placeholder="First name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={registerData.last_name}
                    onChange={handleRegisterChange}
                    placeholder="Last name"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  name="username"
                  value={registerData.username}
                  onChange={handleRegisterChange}
                  placeholder="Choose a username"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={registerData.email}
                  onChange={handleRegisterChange}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="form-group">
                <label>I am a:</label>
                <select 
                  name="role_id" 
                  value={registerData.role_id} 
                  onChange={handleRegisterChange}
                  required
                >
                  <option value="1">Individual (Skincare User)</option>
                  <option value="2">Dermatologist</option>
                  <option value="3">Skincare Consultant</option>
                </select>
                <small>Select your account type</small>
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={registerData.password}
                  onChange={handleRegisterChange}
                  placeholder="At least 8 characters"
                  required
                />
                <small>Must be at least 8 characters</small>
              </div>

              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={registerData.confirmPassword}
                  onChange={handleRegisterChange}
                  placeholder="Confirm your password"
                  required
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary btn-large"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <div className="auth-divider">
              <span>Already have an account?</span>
            </div>

            <button 
              className="btn btn-secondary btn-large"
              onClick={() => {
                setMode('login');
                setError('');
              }}
            >
              Sign In
            </button>

            <div className="auth-footer">
              <p>Admin approval required for non-individual accounts</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}