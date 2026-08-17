import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Landing.css';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      {/* NAVIGATION BAR */}
      <nav className="landing-nav">
        <h1 className="landing-logo">✨ Aurelia</h1>
        <div className="landing-nav-links">
          <button 
            className="nav-btn nav-login"
            onClick={() => navigate('/auth')}
          >
            Sign In
          </button>
          <button 
            className="nav-btn nav-register"
            onClick={() => navigate('/auth')}
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="hero-section">
        <div className="hero-content">
          <span className="hero-badge">Welcome to Beautiful Skin</span>
          
          <h1>
            Your Personal <span className="highlight">Skincare Companion</span>
          </h1>
          
          <p>
            Discover personalized skincare solutions powered by AI and guided by expert dermatologists. Transform your skin, boost your confidence.
          </p>

          <div className="hero-buttons">
            <button
              className="hero-btn hero-btn-primary"
              onClick={() => navigate('/auth')}
            >
              Create Free Account
            </button>
            <button
              className="hero-btn hero-btn-secondary"
              onClick={() => navigate('/auth')}
            >
              Sign In
            </button>
          </div>

          <div className="hero-stats">
            <div className="stat">
              <span className="stat-number">15K+</span>
              <span className="stat-label">Happy Users</span>
            </div>
            <div className="stat">
              <span className="stat-number">500+</span>
              <span className="stat-label">Products</span>
            </div>
            <div className="stat">
              <span className="stat-number">4.9★</span>
              <span className="stat-label">Rated</span>
            </div>
          </div>
        </div>

        <div className="hero-image">
          <div className="hero-image-placeholder">
            <div className="image-content">
              <span style={{ fontSize: '80px', display: 'block' }}>✨</span>
              <span style={{ fontSize: '60px', display: 'block' }}></span>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="features-section">
        <div className="section-header">
          <h2>Why Choose Glow & Thrive?</h2>
          <p>Science-backed skincare guidance tailored just for you</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🧪</div>
            <h3>AI Skin Analysis</h3>
            <p>Advanced technology analyzes your skin condition and provides instant insights with personalized recommendations</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">👩‍⚕️</div>
            <h3>Expert Dermatologists</h3>
            <p>Connect with certified dermatologists for medical-grade assessment and clinical treatment plans</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">💄</div>
            <h3>Beauty Consultants</h3>
            <p>Get personalized advice from skincare consultants to build your perfect routine</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Progress Tracking</h3>
            <p>Monitor your skin transformation with before & after photos and detailed progress analytics</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">💊</div>
            <h3>Smart Recommendations</h3>
            <p>Discover curated products and ingredients that match your skin type and concerns perfectly</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Custom Routines</h3>
            <p>Get step-by-step skincare routines designed specifically for your unique skin needs</p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-it-works">
        <div className="section-header">
          <h2>Your Journey to Radiant Skin</h2>
          <p>Simple steps to achieve your skincare goals</p>
        </div>

        <div className="steps-container">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>Create Profile</h3>
            <p>Sign up and tell us about your skin type, concerns, and beauty goals</p>
          </div>

          <div className="step-card">
            <div className="step-number">2</div>
            <h3>AI Assessment</h3>
            <p>Get an instant AI analysis of your skin condition and skin type</p>
          </div>

          <div className="step-card">
            <div className="step-number">3</div>
            <h3>Get Routine</h3>
            <p>Receive a personalized skincare routine tailored to your needs</p>
          </div>

          <div className="step-card">
            <div className="step-number">4</div>
            <h3>Expert Guidance</h3>
            <p>Consult with professionals for customized treatment plans</p>
          </div>

          <div className="step-card">
            <div className="step-number">5</div>
            <h3>Track Progress</h3>
            <p>Monitor improvements with detailed before & after tracking</p>
          </div>

          <div className="step-card">
            <div className="step-number">6</div>
            <h3>Keep Glowing</h3>
            <p>Continuously refine your routine based on your skin's progress</p>
          </div>
        </div>
      </section>

      {/* ROLES SECTION */}
      <section id="roles" className="roles-section">
        <div className="section-header">
          <h2>For Everyone</h2>
          <p>Different tools designed for different skincare needs</p>
        </div>

        <div className="roles-grid">
          <div className="role-card">
            <div className="role-emoji">👩</div>
            <h3>For Beauty Enthusiasts</h3>
            <p>Get personalized skincare guidance and track your journey to healthier, glowing skin</p>
            <ul className="role-features">
              <li>AI Skin Analysis</li>
              <li>Personal Routines</li>
              <li>Progress Tracking</li>
              <li>Expert Consultation</li>
              <li>Product Discovery</li>
            </ul>
            <button 
              className="role-btn"
              onClick={() => navigate('/auth')}
            >
              Get Started
            </button>
          </div>

          <div className="role-card">
            <div className="role-emoji">💼</div>
            <h3>For Consultants</h3>
            <p>Build your client base and provide professional skincare guidance</p>
            <ul className="role-features">
              <li>Client Management</li>
              <li>Consultation Tools</li>
              <li>Treatment Plans</li>
              <li>Progress Monitoring</li>
              <li>Professional Dashboard</li>
            </ul>
            <button 
              className="role-btn"
              onClick={() => navigate('/auth')}
            >
              Join as Consultant
            </button>
          </div>

          <div className="role-card">
            <div className="role-emoji">🏥</div>
            <h3>For Dermatologists</h3>
            <p>Provide clinical expertise and medical-grade treatment recommendations</p>
            <ul className="role-features">
              <li>Patient Cases</li>
              <li>Clinical Assessment</li>
              <li>Treatment Protocols</li>
              <li>Medical Guidance</li>
              <li>Patient Network</li>
            </ul>
            <button 
              className="role-btn"
              onClick={() => navigate('/auth')}
            >
              Join as Doctor
            </button>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="testimonials-section">
        <div className="section-header">
          <h2>Loved by Our Community</h2>
          <p>See what our users have to say</p>
        </div>

        <div className="testimonials-grid">
          <div className="testimonial-card">
            <div className="rating">⭐⭐⭐⭐⭐</div>
            <p>"My skin has never looked better! The personalized routine changed everything for me."</p>
            <div className="testimonial-author">
              <div className="author-avatar">SJ</div>
              <div>
                <p className="author-name">Sarah Johnson</p>
                <p className="author-role">Beauty Enthusiast</p>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <div className="rating">⭐⭐⭐⭐⭐</div>
            <p>"As a consultant, this platform has helped me reach more clients and provide better care."</p>
            <div className="testimonial-author">
              <div className="author-avatar">AM</div>
              <div>
                <p className="author-name">Amanda Miller</p>
                <p className="author-role">Skincare Consultant</p>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <div className="rating">⭐⭐⭐⭐⭐</div>
            <p>"An excellent platform for dermatological practice and patient engagement."</p>
            <div className="testimonial-author">
              <div className="author-avatar">DR</div>
              <div>
                <p className="author-name">Dr. Rachel</p>
                <p className="author-role">Dermatologist</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Transform Your Skin?</h2>
          <p>Join thousands of users who have achieved their skincare goals with Glow & Thrive</p>
          
          <div className="cta-buttons">
            <button 
              className="cta-button cta-button-primary"
              onClick={() => navigate('/auth')}
            >
              Create Free Account
            </button>
            <button 
              className="cta-button cta-button-secondary"
              onClick={() => navigate('/auth')}
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>Glow & Thrive</h4>
            <p>Your personal skincare companion powered by AI and expert guidance.</p>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="#features">Features</a></li>
              <li><a href="#roles">For Everyone</a></li>
              <li><a href="#features">About</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Support</h4>
            <ul>
              <li><a href="#features">Help Center</a></li>
              <li><a href="#features">Privacy Policy</a></li>
              <li><a href="#features">Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 Glow & Thrive. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}