import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { profileAPI } from '../utils/api';
import '../styles/Dashboard.css';

export default function Dashboard() {
  const { user, logout, loading } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [skinHealthScore] = useState(78);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const response = await profileAPI.get();
      setProfile(response.data);
    } catch (error) {
      console.log('Profile not found or not created yet');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>AI Skincare Intelligence</h1>
        </div>
        <div className="navbar-menu">
          <span className="user-info">Welcome, {user.first_name}!</span>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Left Section: Skin Health Score */}
        <div className="dashboard-card large">
          <h2>Skin Health Score</h2>
          <div className="skin-score-box">
            <div className="score-display">
              <div className="score-circle">
                <span className="score-number">{skinHealthScore}</span>
                <span className="score-label">/100</span>
              </div>
              <div className="score-bar">
                <div className="progress" style={{ width: `${skinHealthScore}%` }}></div>
              </div>
              <span className="score-percentage">{skinHealthScore}%</span>
            </div>
            
            <div className="score-breakdown">
              <div className="breakdown-item">
                <span className="label">Skin Condition</span>
                <span className="value">75/100</span>
              </div>
              <div className="breakdown-item">
                <span className="label">Lifestyle Score</span>
                <span className="value">82/100</span>
              </div>
              <div className="breakdown-item">
                <span className="label">Hydration</span>
                <span className="value">70/100</span>
              </div>
              <div className="breakdown-item">
                <span className="label">Routine Consistency</span>
                <span className="value">85/100</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-card">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <Link to="/profile" className="btn-action">
              📋 Update Profile
            </Link>
            <Link to="/lifestyle" className="btn-action">
              📊 Log Progress
            </Link>
            <Link to="/profile" className="btn-action">
              💊 View Products
            </Link>
            <Link to="/lifestyle" className="btn-action">
              🏃 Track Lifestyle
            </Link>
          </div>
        </div>

        {/* Skin Profile Info */}
        <div className="dashboard-card">
          <h2>Skin Profile</h2>
          {profile ? (
            <div className="profile-summary">
              <p><strong>Skin Type:</strong> {profile.skin_type}</p>
              <p><strong>Skin Tone:</strong> {profile.skin_tone || 'Not set'}</p>
              <p><strong>Allergies:</strong> {profile.allergies || 'None'}</p>
              <p><strong>Sensitivities:</strong> {profile.sensitivities || 'None'}</p>
            </div>
          ) : (
            <p className="empty-state">
              No skin profile yet.{' '}
              <Link to="/profile">Create one now →</Link>
            </p>
          )}
          <Link to="/profile" className="btn-primary">
            View/Edit Profile
          </Link>
        </div>

        {/* Today's Routine */}
        <div className="dashboard-card large">
          <h2>Today's Skincare Routine</h2>
          
          <div className="routine-section">
            <h3>Morning Routine</h3>
            <div className="routine-items">
              <label className="routine-item">
                <input type="checkbox" />
                <span>1. Cleanser - 5 min</span>
              </label>
              <label className="routine-item">
                <input type="checkbox" />
                <span>2. Toner - 2 min</span>
              </label>
              <label className="routine-item">
                <input type="checkbox" />
                <span>3. Serum - 3 min</span>
              </label>
              <label className="routine-item">
                <input type="checkbox" />
                <span>4. Moisturizer - 3 min</span>
              </label>
              <label className="routine-item">
                <input type="checkbox" />
                <span>5. SPF 50 - 5 min</span>
              </label>
            </div>
          </div>

          <div className="routine-section">
            <h3>Evening Routine</h3>
            <div className="routine-items">
              <label className="routine-item">
                <input type="checkbox" />
                <span>1. Cleanser - 5 min</span>
              </label>
              <label className="routine-item">
                <input type="checkbox" />
                <span>2. Treatment - 5 min</span>
              </label>
              <label className="routine-item">
                <input type="checkbox" />
                <span>3. Night Cream - 3 min</span>
              </label>
            </div>
          </div>

          <button className="btn-primary">Mark All Complete</button>
        </div>

        {/* Recommended Products */}
        <div className="dashboard-card large">
          <h2>Recommended Products For You</h2>
          <div className="products-grid">
            <div className="product-card">
              <div className="product-image">
                <img 
                  src="https://via.placeholder.com/200x200?text=Retinol+Serum" 
                  alt="Retinol Serum"
                />
              </div>
              <h3>Retinol Serum</h3>
              <p className="brand">Brand: SkinCare Pro</p>
              <p className="price">$35.99</p>
              <div className="rating">
                <span>⭐⭐⭐⭐⭐ (124 reviews)</span>
              </div>
              <button className="btn-product">Learn More</button>
            </div>

            <div className="product-card">
              <div className="product-image">
                <img 
                  src="https://via.placeholder.com/200x200?text=Moisturizer" 
                  alt="Moisturizer"
                />
              </div>
              <h3>Hydra Moisturizer</h3>
              <p className="brand">Brand: Glow Labs</p>
              <p className="price">$28.50</p>
              <div className="rating">
                <span>⭐⭐⭐⭐⭐ (89 reviews)</span>
              </div>
              <button className="btn-product">Learn More</button>
            </div>

            <div className="product-card">
              <div className="product-image">
                <img 
                  src="https://via.placeholder.com/200x200?text=Vitamin+C" 
                  alt="Vitamin C"
                />
              </div>
              <h3>Vitamin C Serum</h3>
              <p className="brand">Brand: Bright Labs</p>
              <p className="price">$45.00</p>
              <div className="rating">
                <span>⭐⭐⭐⭐⭐ (156 reviews)</span>
              </div>
              <button className="btn-product">Learn More</button>
            </div>
          </div>
          <Link to="/products" className="btn-primary full-width">
            View All Recommendations
          </Link>
        </div>
      </div>
    </div>
  );
}