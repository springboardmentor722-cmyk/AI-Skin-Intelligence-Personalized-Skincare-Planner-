import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Landing.css';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">Glow & Thrive</h1>
            <p className="hero-subtitle">Your Personal Skincare Companion</p>
            <p className="hero-description">
              Discover personalized skincare solutions designed for your unique skin. 
              Get expert guidance, track your progress, and achieve your best skin ever.
            </p>
            
            <div className="hero-buttons">
              <button 
                className="btn btn-primary btn-lg"
                onClick={() => navigate('/auth')}
              >
                Get Started
              </button>
              <button 
                className="btn btn-secondary btn-lg"
                onClick={() => navigate('/auth?tab=login')}
              >
                Login
              </button>
            </div>
          </div>
          
          <div className="hero-image">
            <div className="hero-visual">
              <span className="visual-icon">✨</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2 className="text-center">Why Choose Glow & Thrive?</h2>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">💆‍♀️</div>
              <h3>Personalized Assessment</h3>
              <p>Get a complete skin analysis tailored to your skin type and concerns</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Track Progress</h3>
              <p>Monitor your skin's transformation with before & after photos</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">👨‍⚕️</div>
              <h3>Expert Consultation</h3>
              <p>Connect with dermatologists and skincare consultants anytime</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">💄</div>
              <h3>Product Recommendations</h3>
              <p>Discover curated products matched to your skin profile</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <h2>Ready to Start Your Skincare Journey?</h2>
          <p>Join thousands of users achieving their skin goals</p>
          <button 
            className="btn btn-primary btn-lg"
            onClick={() => navigate('/auth')}
          >
            Begin Your Assessment
          </button>
        </div>
      </section>
    </div>
  );
}