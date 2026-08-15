import React from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    const token = localStorage.getItem('token');
    navigate(token ? '/dashboard' : '/login');
  };

  const scrollToSection = (id) => {
    const section = document.getElementById(id);

    if (section) {
      section.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const goToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // --- UI-only micro-interaction helpers (no logic changes) ---
  const raiseBtn = (e) => {
    e.currentTarget.style.transform = 'translateY(-2px)';
    e.currentTarget.style.boxShadow = '0 16px 34px rgba(108,99,217,.4)';
  };
  const lowerBtn = (e) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = '0 10px 24px rgba(108,99,217,.35)';
  };
  const raiseCard = (e) => {
    e.currentTarget.style.transform = 'translateY(-4px)';
    e.currentTarget.style.boxShadow = '0 22px 48px rgba(23,35,60,.12)';
    e.currentTarget.style.borderColor = '#D6DAE6';
  };
  const lowerCard = (e) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = '0 10px 30px rgba(23,35,60,.05)';
    e.currentTarget.style.borderColor = '#E6E9F1';
  };

  return (
    <div style={styles.container}>
      <header style={styles.navbar}>
        <button
          type="button"
          style={styles.logoButton}
          onClick={goToTop}
          aria-label="Go to Home"
        >
          <span style={styles.logoMark}>✦</span>
          <span style={styles.logoText}>Skin Intelligence</span>
        </button>

        <nav style={styles.desktopNav} aria-label="Public navigation">
          <button type="button" style={styles.navLinkActive} onClick={goToTop}>
            Home
          </button>

          <button
            type="button"
            style={styles.navLink}
            onClick={() => scrollToSection('features')}
          >
            Features
          </button>

          <button
            type="button"
            style={styles.navLink}
            onClick={() => scrollToSection('how-it-works')}
          >
            How It Works
          </button>

          <button
            type="button"
            style={styles.navLink}
            onClick={() => scrollToSection('about-us')}
          >
            About Us
          </button>

          <button
            type="button"
            style={styles.navLink}
            onClick={() => scrollToSection('for-professionals')}
          >
            For Professionals
          </button>

          <button
            type="button"
            style={styles.navLink}
            onClick={() => scrollToSection('contact')}
          >
            Contact
          </button>
        </nav>

        <div style={styles.navActions}>
          <button
            type="button"
            style={styles.navButton}
            onClick={() => navigate('/login')}
          >
            Login
          </button>

          <button
            type="button"
            style={styles.navButtonPrimary}
            onClick={() => navigate('/register')}
          >
            Sign Up
          </button>
        </div>
      </header>

      <main>
        <section id="home" style={styles.heroSection}>
          <div style={styles.heroContent}>
            <div style={styles.heroEyebrow}>
              <span style={styles.eyebrowDot}></span>
              AI-powered skincare intelligence
            </div>

            <h1 style={styles.heroTitle}>
              Your Personal
                

              <span style={styles.heroTitleAccent}>
                AI Skincare Assistant
              </span>
            </h1>

            <p style={styles.heroSubtitle}>
              Understand your skin, receive personalized recommendations,
              connect with professionals, and build healthier skincare habits
              with intelligent guidance.
            </p>

            <div style={styles.heroActions}>
              <button
                type="button"
                style={styles.heroButton}
                onClick={handleGetStarted}
                onMouseEnter={raiseBtn}
                onMouseLeave={lowerBtn}
              >
                Get Started <span>→</span>
              </button>

              <button
                type="button"
                style={styles.heroSecondaryButton}
                onClick={() => scrollToSection('how-it-works')}
              >
                See How It Works
              </button>
            </div>

            <div style={styles.trustRow}>
              <span style={styles.trustIcon}>✓</span>
              <span>Your skincare data stays private and secure.</span>
            </div>
          </div>

          <div style={styles.heroVisual}>
            <img
              src="/realistic-skincare-hero-products-navy.jpg.webp"
              alt="Realistic skincare products with botanical ingredients"
              style={styles.heroProductImage}
            />
          </div>
        </section>

        <section id="features" style={styles.sectionLight}>
          <div style={styles.sectionInner}>
            <div style={styles.sectionHeading}>
              <span style={styles.sectionEyebrow}>
                ONE CONNECTED EXPERIENCE
              </span>
              <h2 style={styles.sectionTitle}>
                Everything your skin needs to improve
              </h2>
              <p style={styles.sectionSubtitle}>
                Move from understanding your skin to building consistent habits
                with one connected platform.
              </p>
            </div>

            <div style={styles.featureGrid}>
              <article
                style={styles.featureCard}
                onMouseEnter={raiseCard}
                onMouseLeave={lowerCard}
              >
                <div
                  style={{
                    ...styles.featureIcon,
                    backgroundColor: '#EEEAFE',
                    color: '#6C63D9'
                  }}
                >
                  ◎
                </div>
                <h3 style={styles.featureTitle}>AI Skin Analysis</h3>
                <p style={styles.featureText}>
                  Analyze your skin concerns with intelligent image-based
                  insights and personalized guidance.
                </p>
                <button
                  type="button"
                  style={styles.cardLink}
                  onClick={handleGetStarted}
                >
                  Explore analysis →
                </button>
              </article>

              <article
                style={styles.featureCard}
                onMouseEnter={raiseCard}
                onMouseLeave={lowerCard}
              >
                <div
                  style={{
                    ...styles.featureIcon,
                    backgroundColor: '#E4F7F4',
                    color: '#26A69A'
                  }}
                >
                  ✓
                </div>
                <h3 style={styles.featureTitle}>Personalized Routine</h3>
                <p style={styles.featureText}>
                  Follow a structured routine tailored to your skin type,
                  concerns, goals, and lifestyle.
                </p>
                <button
                  type="button"
                  style={styles.cardLink}
                  onClick={handleGetStarted}
                >
                  Build your routine →
                </button>
              </article>

              <article
                style={styles.featureCard}
                onMouseEnter={raiseCard}
                onMouseLeave={lowerCard}
              >
                <div
                  style={{
                    ...styles.featureIcon,
                    backgroundColor: '#FFF2DF',
                    color: '#D98B32'
                  }}
                >
                  ↗
                </div>
                <h3 style={styles.featureTitle}>Track & Improve</h3>
                <p style={styles.featureText}>
                  Monitor progress over time and make better decisions with
                  clear skin-health insights.
                </p>
                <button
                  type="button"
                  style={styles.cardLink}
                  onClick={handleGetStarted}
                >
                  Track progress →
                </button>
              </article>
            </div>
          </div>
        </section>

        <section id="how-it-works" style={styles.sectionWhite}>
          <div style={styles.sectionInner}>
            <div style={styles.sectionHeading}>
              <span style={styles.sectionEyebrow}>
                SIMPLE AND PERSONALIZED
              </span>
              <h2 style={styles.sectionTitle}>
                How Skin Intelligence works
              </h2>
              <p style={styles.sectionSubtitle}>
                Start with your skin profile and let the platform guide your
                next best step.
              </p>
            </div>

            <div style={styles.stepsGrid}>
              <div style={styles.stepItem}>
                <div style={styles.stepNumber}>01</div>
                <h3 style={styles.stepTitle}>Create your profile</h3>
                <p style={styles.stepText}>
                  Tell us about your skin type, lifestyle, sensitivities, and
                  personal concerns.
                </p>
              </div>

              <div style={styles.stepConnector}></div>

              <div style={styles.stepItem}>
                <div style={styles.stepNumber}>02</div>
                <h3 style={styles.stepTitle}>Understand your skin</h3>
                <p style={styles.stepText}>
                  Complete your assessment and use AI analysis to identify
                  important skin patterns.
                </p>
              </div>

              <div style={styles.stepConnector}></div>

              <div style={styles.stepItem}>
                <div style={styles.stepNumber}>03</div>
                <h3 style={styles.stepTitle}>Build better habits</h3>
                <p style={styles.stepText}>
                  Follow recommendations, track progress, and connect with
                  skincare professionals when needed.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="about-us" style={styles.aboutSection}>
          <div style={styles.aboutContent}>
            <div style={styles.aboutCopy}>
              <span style={styles.sectionEyebrow}>
                ABOUT SKIN INTELLIGENCE
              </span>
              <h2 style={styles.aboutTitle}>
                Technology that makes skincare feel more personal.
              </h2>
              <p style={styles.aboutText}>
                Skin Intelligence brings together AI-powered analysis,
                personalized routines, product guidance, progress tracking, and
                professional support in one connected experience.
              </p>
              <p style={styles.aboutText}>
                Our goal is to help people make informed, consistent, and
                confident decisions about their skin health.
              </p>
            </div>

            <div style={styles.aboutPanel}>
              <div style={styles.aboutPanelIcon}>✦</div>
              <h3 style={styles.aboutPanelTitle}>
                Personal care, supported by intelligence.
              </h3>
              <p style={styles.aboutPanelText}>
                Your skin journey is unique. Your recommendations should be,
                too.
              </p>
            </div>
          </div>
        </section>

        <section id="for-professionals" style={styles.sectionLight}>
          <div style={styles.sectionInner}>
            <div style={styles.professionalBanner}>
              <div>
                <span style={styles.sectionEyebrowLight}>FOR PROFESSIONALS</span>
                <h2 style={styles.professionalTitle}>
                  Bring expert skincare guidance into one connected platform.
                </h2>
                <p style={styles.professionalText}>
                  Consultants and dermatologists can join the platform to
                  support clients with organized, data-informed care.
                </p>
              </div>

              <button
                type="button"
                style={styles.professionalButton}
                onClick={() => navigate('/register/professional')}
              >
                Join as a Professional →
              </button>
            </div>
          </div>
        </section>

        <section id="contact" style={styles.contactSection}>
          <div style={styles.sectionInner}>
            <div style={styles.contactCard}>
              <div>
                <span style={styles.sectionEyebrow}>CONTACT</span>
                <h2 style={styles.contactTitle}>
                  Ready to understand your skin better?
                </h2>
                <p style={styles.contactText}>
                  Create your account and begin your personalized skincare
                  journey today.
                </p>
              </div>

              <button
                type="button"
                style={styles.contactButton}
                onClick={handleGetStarted}
                onMouseEnter={raiseBtn}
                onMouseLeave={lowerBtn}
              >
                Get Started →
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <button type="button" style={styles.footerBrand} onClick={goToTop}>
            <span style={styles.footerBrandMark}>✦</span>
            Skin Intelligence
          </button>

          <p style={styles.footerText}>
            © {new Date().getFullYear()} Skin Intelligence. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#F4F6FB',
    color: '#17233C',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },

  navbar: {
    position: 'sticky',
    top: 0,
    zIndex: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '24px',
    padding: '15px 48px',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderBottom: '1px solid #E6E9F1',
    backdropFilter: 'blur(16px)'
  },

  logoButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '11px',
    padding: 0,
    border: 'none',
    backgroundColor: 'transparent',
    color: '#17233C',
    cursor: 'pointer',
    fontFamily: 'inherit'
  },

  logoMark: {
    width: '36px',
    height: '36px',
    display: 'grid',
    placeItems: 'center',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #8E86F5, #5D57C7)',
    color: '#FFFFFF',
    fontSize: '18px',
    boxShadow: '0 8px 20px rgba(108,99,217,0.3)'
  },

  logoText: {
    fontSize: '17px',
    fontWeight: '800',
    letterSpacing: '-0.4px'
  },

  desktopNav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '26px',
    flex: 1
  },

  navLink: {
    padding: '8px 0',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#6B7690',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap'
  },

  navLinkActive: {
    padding: '8px 0',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#6C63D9',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '800',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap'
  },

  navActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },

  navButton: {
    padding: '10px 20px',
    border: '1px solid #DCE1EC',
    borderRadius: '11px',
    backgroundColor: '#FFFFFF',
    color: '#17233C',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '700',
    fontFamily: 'inherit'
  },

  navButtonPrimary: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '11px',
    backgroundColor: '#6C63D9',
    color: '#FFFFFF',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '700',
    fontFamily: 'inherit',
    boxShadow: '0 8px 18px rgba(108,99,217,0.28)'
  },

  heroSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '42px',
    minHeight: '640px',
    padding: '78px 7%',
    overflow: 'hidden',
    background: 'linear-gradient(120deg, #0E1A33 0%, #172A4D 58%, #26406B 100%)',
    scrollMarginTop: '80px'
  },

  heroContent: {
    position: 'relative',
    zIndex: 2,
    width: '48%',
    maxWidth: '620px'
  },

  heroEyebrow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '22px',
    padding: '8px 14px',
    border: '1px solid rgba(255,255,255,0.18)',
    borderRadius: '999px',
    backgroundColor: 'rgba(255,255,255,0.07)',
    color: '#C8C5FF',
    fontSize: '11px',
    fontWeight: '800',
    letterSpacing: '0.6px',
    textTransform: 'uppercase'
  },

  eyebrowDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    backgroundColor: '#26A69A',
    boxShadow: '0 0 0 4px rgba(38,166,154,0.16)'
  },

  heroTitle: {
    margin: 0,
    color: '#FFFFFF',
    fontSize: 'clamp(38px, 5vw, 68px)',
    lineHeight: '1.05',
    letterSpacing: '-2.6px',
    fontWeight: '850'
  },

  heroTitleAccent: {
    color: '#BDB8FF'
  },

  heroSubtitle: {
    maxWidth: '560px',
    margin: '24px 0 32px',
    color: '#C8D1E5',
    fontSize: '17px',
    lineHeight: '1.75'
  },

  heroActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px'
  },

  heroButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '15px 24px',
    border: 'none',
    borderRadius: '12px',
    backgroundColor: '#6C63D9',
    color: '#FFFFFF',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '800',
    fontFamily: 'inherit',
    boxShadow: '0 10px 24px rgba(108,99,217,0.35)',
    transition: 'transform .18s ease, box-shadow .18s ease'
  },

  heroSecondaryButton: {
    padding: '15px 24px',
    border: '1px solid rgba(255,255,255,0.35)',
    borderRadius: '12px',
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: '#FFFFFF',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '700',
    fontFamily: 'inherit'
  },

  trustRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
    marginTop: '26px',
    color: '#AAB8D1',
    fontSize: '12px'
  },

  trustIcon: {
    width: '20px',
    height: '20px',
    display: 'grid',
    placeItems: 'center',
    border: '1px solid rgba(255,255,255,0.24)',
    borderRadius: '50%',
    color: '#8BE2D8',
    fontWeight: '800'
  },

  heroVisual: {
    position: 'relative',
    zIndex: 2,
    width: '52%',
    maxWidth: '760px',
    minWidth: '420px',
    overflow: 'hidden',
    borderRadius: '26px',
    boxShadow: '0 30px 70px rgba(6,12,26,.45)'
  },

  heroProductImage: {
    display: 'block',
    width: '100%',
    height: 'auto',
    minHeight: '430px',
    objectFit: 'cover',
    objectPosition: 'right center',
    borderRadius: '26px',
    opacity: 0.98
  },

  sectionLight: {
    padding: '96px 9%',
    backgroundColor: '#F4F6FB',
    scrollMarginTop: '80px'
  },

  sectionWhite: {
    padding: '96px 9%',
    backgroundColor: '#FFFFFF',
    scrollMarginTop: '80px'
  },

  sectionInner: {
    maxWidth: '1120px',
    margin: '0 auto'
  },

  sectionHeading: {
    maxWidth: '670px',
    margin: '0 auto 46px',
    textAlign: 'center'
  },

  sectionEyebrow: {
    display: 'block',
    marginBottom: '12px',
    color: '#6C63D9',
    fontSize: '11px',
    fontWeight: '850',
    letterSpacing: '1.5px'
  },

  sectionEyebrowLight: {
    display: 'block',
    marginBottom: '12px',
    color: '#BDB8FF',
    fontSize: '11px',
    fontWeight: '850',
    letterSpacing: '1.5px'
  },

  sectionTitle: {
    margin: 0,
    color: '#17233C',
    fontSize: 'clamp(28px, 3.5vw, 42px)',
    lineHeight: '1.15',
    letterSpacing: '-1.2px',
    fontWeight: '800'
  },

  sectionSubtitle: {
    margin: '16px auto 0',
    color: '#6B7690',
    fontSize: '15px',
    lineHeight: '1.7'
  },

  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '20px'
  },

  featureCard: {
    padding: '30px',
    border: '1px solid #E6E9F1',
    borderRadius: '20px',
    backgroundColor: '#FFFFFF',
    boxShadow: '0 10px 30px rgba(23,35,60,.05)',
    transition: 'transform .2s ease, box-shadow .2s ease, border-color .2s ease'
  },

  featureIcon: {
    width: '50px',
    height: '50px',
    display: 'grid',
    placeItems: 'center',
    marginBottom: '22px',
    borderRadius: '15px',
    fontSize: '24px',
    fontWeight: '800'
  },

  featureTitle: {
    margin: '0 0 10px',
    color: '#17233C',
    fontSize: '18px',
    fontWeight: '800'
  },

  featureText: {
    minHeight: '76px',
    margin: 0,
    color: '#6B7690',
    fontSize: '14px',
    lineHeight: '1.7'
  },

  cardLink: {
    marginTop: '20px',
    padding: 0,
    border: 'none',
    backgroundColor: 'transparent',
    color: '#6C63D9',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '800',
    fontFamily: 'inherit'
  },

  stepsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr auto 1fr',
    alignItems: 'start',
    gap: '18px'
  },

  stepItem: {
    padding: '28px',
    border: '1px solid #E6E9F1',
    borderRadius: '20px',
    backgroundColor: '#F8F9FC',
    textAlign: 'center'
  },

  stepNumber: {
    marginBottom: '18px',
    color: '#6C63D9',
    fontSize: '13px',
    fontWeight: '850',
    letterSpacing: '1px'
  },

  stepTitle: {
    margin: '0 0 10px',
    color: '#17233C',
    fontSize: '17px',
    fontWeight: '800'
  },

  stepText: {
    margin: 0,
    color: '#6B7690',
    fontSize: '14px',
    lineHeight: '1.7'
  },

  stepConnector: {
    width: '42px',
    height: '1px',
    marginTop: '46px',
    backgroundColor: '#C8C5FF'
  },

  aboutSection: {
    padding: '100px 9%',
    background: 'linear-gradient(135deg, #EDEBFF 0%, #F4F6FB 52%, #E4F7F4 100%)',
    scrollMarginTop: '80px'
  },

  aboutContent: {
    display: 'grid',
    gridTemplateColumns: '1.1fr .9fr',
    alignItems: 'center',
    gap: '70px',
    maxWidth: '1020px',
    margin: '0 auto'
  },

  aboutCopy: {
    maxWidth: '570px'
  },

  aboutTitle: {
    margin: 0,
    color: '#17233C',
    fontSize: 'clamp(29px, 3.5vw, 44px)',
    lineHeight: '1.14',
    letterSpacing: '-1.4px',
    fontWeight: '800'
  },

  aboutText: {
    margin: '18px 0 0',
    color: '#5F6B84',
    fontSize: '15px',
    lineHeight: '1.8'
  },

  aboutPanel: {
    padding: '40px',
    border: '1px solid rgba(108,99,217,.15)',
    borderRadius: '26px',
    backgroundColor: 'rgba(255,255,255,.78)',
    boxShadow: '0 22px 48px rgba(23,35,60,.09)',
    backdropFilter: 'blur(6px)'
  },

  aboutPanelIcon: {
    width: '56px',
    height: '56px',
    display: 'grid',
    placeItems: 'center',
    marginBottom: '22px',
    borderRadius: '18px',
    backgroundColor: '#E8E7FF',
    color: '#6C63D9',
    fontSize: '24px'
  },

  aboutPanelTitle: {
    margin: '0 0 12px',
    color: '#17233C',
    fontSize: '22px',
    lineHeight: '1.3',
    fontWeight: '800'
  },

  aboutPanelText: {
    margin: 0,
    color: '#6B7690',
    fontSize: '15px',
    lineHeight: '1.7'
  },

  professionalBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '30px',
    padding: '42px',
    borderRadius: '24px',
    background: 'linear-gradient(120deg, #17233C, #26406B)',
    boxShadow: '0 22px 48px rgba(23,35,60,.16)'
  },

  professionalTitle: {
    maxWidth: '650px',
    margin: 0,
    color: '#FFFFFF',
    fontSize: 'clamp(24px, 3vw, 35px)',
    lineHeight: '1.2',
    fontWeight: '800'
  },

  professionalText: {
    maxWidth: '620px',
    margin: '14px 0 0',
    color: '#C8D1E5',
    fontSize: '14px',
    lineHeight: '1.7'
  },

  professionalButton: {
    flexShrink: 0,
    padding: '15px 22px',
    border: 'none',
    borderRadius: '12px',
    backgroundColor: '#FFFFFF',
    color: '#17233C',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '800',
    fontFamily: 'inherit',
    boxShadow: '0 12px 28px rgba(0,0,0,.2)'
  },

  contactSection: {
    padding: '92px 9%',
    backgroundColor: '#FFFFFF',
    scrollMarginTop: '80px'
  },

  contactCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '26px',
    padding: '38px 42px',
    border: '1px solid #E6E9F1',
    borderRadius: '22px',
    backgroundColor: '#F8F9FC'
  },

  contactTitle: {
    margin: 0,
    color: '#17233C',
    fontSize: 'clamp(24px, 3vw, 35px)',
    lineHeight: '1.2',
    fontWeight: '800'
  },

  contactText: {
    margin: '12px 0 0',
    color: '#6B7690',
    fontSize: '14px'
  },

  contactButton: {
    flexShrink: 0,
    padding: '15px 24px',
    border: 'none',
    borderRadius: '12px',
    backgroundColor: '#6C63D9',
    color: '#FFFFFF',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '800',
    fontFamily: 'inherit',
    boxShadow: '0 10px 24px rgba(108,99,217,.35)',
    transition: 'transform .18s ease, box-shadow .18s ease'
  },

  footer: {
    padding: '24px 9%',
    backgroundColor: '#0E1A33'
  },

  footerInner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '18px',
    maxWidth: '1120px',
    margin: '0 auto'
  },

  footerBrand: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: 0,
    border: 'none',
    backgroundColor: 'transparent',
    color: '#FFFFFF',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '800',
    fontFamily: 'inherit'
  },

  footerBrandMark: {
    color: '#BDB8FF',
    fontSize: '18px'
  },

  footerText: {
    margin: 0,
    color: '#8D99B3',
    fontSize: '12px'
  }
};

export default Home;