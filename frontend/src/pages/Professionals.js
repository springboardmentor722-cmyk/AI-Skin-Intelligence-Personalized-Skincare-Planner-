// frontend/src/pages/Professionals.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import PatientSidebar from '../components/PatientSidebar';
import '../styles/patient-theme.css';

function Professionals() {
  const navigate = useNavigate();
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState('/professionals');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentNotes, setAppointmentNotes] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchProfessionals();
  }, [navigate]);

  const fetchProfessionals = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/professionals/approved', { 
        params: { token } 
      });
      setProfessionals(response.data || []);
      setError('');
    } catch (err) {
      console.error('Error fetching professionals:', err);
      setError('Could not load professionals. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (professional) => {
    setSelectedProfessional(professional);
    setShowProfile(true);
    setBookingSuccess(false);
    setAppointmentDate('');
    setAppointmentNotes('');
  };

  const handleCloseProfile = () => {
    setShowProfile(false);
    setSelectedProfessional(null);
    setBookingSuccess(false);
    setAppointmentDate('');
    setAppointmentNotes('');
  };

  const handleBookAppointment = async () => {
    if (!appointmentDate) {
      alert('Please select a date and time for your appointment.');
      return;
    }

    setBookingLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Determine professional type
      const professionalType = selectedProfessional.type === 'dermatologist' ? 'dermatologist' : 'consultant';
      
      const response = await api.post('/appointments/book', 
        { 
          professional_id: selectedProfessional.id,
          professional_type: professionalType,
          appointment_date: appointmentDate,
          notes: appointmentNotes || `Appointment with ${selectedProfessional.name}`
        },
        { params: { token } }
      );
      
      setBookingSuccess(true);
      alert('✅ Appointment booked successfully! The professional will review your request and confirm.');
      
      // Auto close after 3 seconds
      setTimeout(() => {
        handleCloseProfile();
      }, 3000);
      
    } catch (err) {
      console.error('Booking error:', err);
      const errorMsg = err.response?.data?.detail || 'Failed to book appointment. Please try again.';
      alert('❌ ' + errorMsg);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const navigateTo = (path) => {
    setActiveMenu(path);
    navigate(path);
  };

  const mainMenu = [];

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>Loading professionals...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <PatientSidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <button style={{...styles.toggleBtn, left: sidebarOpen ? '250px' : '64px'}} onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? '◀' : '▶'}
      </button>

      <main className={`patient-main ${sidebarOpen ? '' : 'is-collapsed'}`}>
        {/* Top Bar */}
        <div style={styles.topBar}>
          <div>
            <h1 style={styles.pageTitle}>👨‍⚕️ Find a Professional</h1>
            <p style={styles.pageSubtitle}>Connect with verified skincare experts you can trust.</p>
          </div>
          <div style={styles.topBarRight}>
            <div style={styles.dateChip}>📅 {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div style={styles.profileChip}>
              <div style={styles.avatarCircle}>{localStorage.getItem('userName')?.charAt(0)?.toUpperCase() || 'U'}</div>
              <div>
                <div style={styles.profileName}>{localStorage.getItem('userName') || 'User'}</div>
                <div style={styles.profileRole}>User</div>
              </div>
            </div>
          </div>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.professionalsGrid}>
          {professionals.map((prof) => (
            <div key={prof.id} style={styles.professionalCard}>
              <div style={styles.cardHeader}>
                <div style={styles.cardAvatar}>👤</div>
                <div style={styles.cardInfo}>
                  <h3 style={styles.cardName}>{prof.name}</h3>
                  <div style={styles.cardBadgeRow}>
                    <span style={prof.type === 'dermatologist' ? styles.badgeDermatologist : styles.badgeConsultant}>
                      {prof.type === 'dermatologist' ? '🩺 Dermatologist' : '🧴 Consultant'}
                    </span>
                    <span style={styles.verifiedBadge}>
                      ✅ {prof.type === 'dermatologist' ? 'Licensed' : 'Certified'}
                    </span>
                  </div>
                </div>
              </div>
              <div style={styles.cardDetails}>
                <div style={styles.cardTags}>
                  <span style={styles.tag}>{prof.specialty}</span>
                  <span style={styles.tag}>⭐ {prof.rating} ({prof.reviews} reviews)</span>
                  <span style={styles.tag}>📅 {prof.years_experience} years</span>
                </div>
              </div>
              <button style={styles.viewProfileBtn} onClick={() => handleViewProfile(prof)}>
                View Profile →
              </button>
            </div>
          ))}
        </div>

        {/* Modal */}
        {showProfile && selectedProfessional && (
          <div style={styles.modalOverlay} onClick={handleCloseProfile}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <button style={styles.modalClose} onClick={handleCloseProfile}>✕</button>
              
              <div style={styles.modalHeader}>
                <div style={styles.modalAvatar}>👤</div>
                <div style={styles.modalHeaderInfo}>
                  <h2 style={styles.modalName}>{selectedProfessional.name}</h2>
                  <div style={styles.modalBadgeRow}>
                    <span style={selectedProfessional.type === 'dermatologist' ? styles.badgeDermatologist : styles.badgeConsultant}>
                      {selectedProfessional.type === 'dermatologist' ? '🩺 Dermatologist' : '🧴 Consultant'}
                    </span>
                    <span style={styles.verifiedBadgeLarge}>
                      ✅ {selectedProfessional.type === 'dermatologist' ? 'Licensed Medical Professional' : 'Certified'}
                    </span>
                  </div>
                </div>
              </div>

              <div style={styles.modalBody}>
                <p style={styles.modalBio}>{selectedProfessional.bio}</p>
                
                <div style={styles.modalStats}>
                  <div style={styles.modalStat}>
                    <span style={styles.modalStatValue}>{selectedProfessional.years_experience}</span>
                    <span style={styles.modalStatLabel}>Years Experience</span>
                  </div>
                  <div style={styles.modalStat}>
                    <span style={styles.modalStatValue}>⭐ {selectedProfessional.rating}</span>
                    <span style={styles.modalStatLabel}>{selectedProfessional.reviews} Reviews</span>
                  </div>
                  <div style={styles.modalStat}>
                    <span style={styles.modalStatValue}>{selectedProfessional.specialty}</span>
                    <span style={styles.modalStatLabel}>Specialization</span>
                  </div>
                </div>

                <div style={styles.modalDivider} />

                {selectedProfessional.type === 'dermatologist' ? (
                  <>
                    <div style={styles.modalDetailRow}>
                      <span style={styles.modalDetailLabel}>Medical Degree</span>
                      <span style={styles.modalDetailValue}>{selectedProfessional.degree}</span>
                    </div>
                    <div style={styles.modalDetailRow}>
                      <span style={styles.modalDetailLabel}>License Number</span>
                      <span style={styles.modalDetailValue}>••••{selectedProfessional.license_number?.slice(-4) || '4872'}</span>
                    </div>
                    <div style={styles.modalDetailRow}>
                      <span style={styles.modalDetailLabel}>Issuing Council</span>
                      <span style={styles.modalDetailValue}>{selectedProfessional.issuing_council}</span>
                    </div>
                    <div style={styles.modalDetailRow}>
                      <span style={styles.modalDetailLabel}>Clinic Affiliation</span>
                      <span style={styles.modalDetailValue}>{selectedProfessional.clinic_affiliation}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={styles.modalDetailRow}>
                      <span style={styles.modalDetailLabel}>Certification</span>
                      <span style={styles.modalDetailValue}>{selectedProfessional.certification_name}</span>
                    </div>
                    <div style={styles.modalDetailRow}>
                      <span style={styles.modalDetailLabel}>Training Institute</span>
                      <span style={styles.modalDetailValue}>{selectedProfessional.training_institute}</span>
                    </div>
                    <div style={styles.modalDetailRow}>
                      <span style={styles.modalDetailLabel}>Salon Affiliation</span>
                      <span style={styles.modalDetailValue}>{selectedProfessional.salon_affiliation}</span>
                    </div>
                  </>
                )}

                <div style={styles.modalDivider} />

                <div style={styles.modalDetailRow}>
                  <span style={styles.modalDetailLabel}>Languages</span>
                  <span style={styles.modalDetailValue}>{selectedProfessional.languages?.join(', ') || 'English'}</span>
                </div>
                <div style={styles.modalDetailRow}>
                  <span style={styles.modalDetailLabel}>Consultation Mode</span>
                  <span style={styles.modalDetailValue}>{selectedProfessional.consultation_mode?.join(' • ') || 'Video'}</span>
                </div>

                <div style={styles.modalDivider} />

                {/* BOOK APPOINTMENT SECTION - NEW */}
                {!bookingSuccess ? (
                  <div style={styles.bookingSection}>
                    <h4 style={styles.bookingTitle}>📅 Book an Appointment</h4>
                    
                    <div style={styles.bookingField}>
                      <label style={styles.bookingLabel}>Select Date & Time *</label>
                      <input
                        type="datetime-local"
                        value={appointmentDate}
                        onChange={(e) => setAppointmentDate(e.target.value)}
                        style={styles.bookingInput}
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </div>

                    <div style={styles.bookingField}>
                      <label style={styles.bookingLabel}>Notes (optional)</label>
                      <textarea
                        placeholder="Any specific concerns or questions..."
                        value={appointmentNotes}
                        onChange={(e) => setAppointmentNotes(e.target.value)}
                        style={styles.bookingTextarea}
                        rows="2"
                      />
                    </div>

                    <button 
                      style={styles.requestBtn} 
                      onClick={handleBookAppointment}
                      disabled={bookingLoading}
                    >
                      {bookingLoading ? '⏳ Booking...' : '📩 Book Appointment'}
                    </button>
                  </div>
                ) : (
                  <div style={styles.requestSentMessage}>
                    ✅ Appointment booked successfully! 
                    <br />
                    <span style={styles.bookingSubtext}>
                      The professional will review and confirm your appointment.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  container: { display: 'flex', minHeight: '100vh', backgroundColor: '#F5F7FB', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  sidebar: { backgroundColor: '#17233C', borderRight: '1px solid #263B63', padding: '20px 12px', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100vh', overflowY: 'auto', transition: 'width 0.2s ease', zIndex: 100, boxSizing: 'border-box' },
  sidebarLogo: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', padding: '0 8px' },
  sidebarLogoIcon: { fontSize: '24px' },
  sidebarLogoText: { fontSize: '15px', fontWeight: '700', color: '#17233C' },
  sidebarLogoSub: { fontSize: '11px', color: '#6C63D9', fontWeight: '600' },
  sidebarSectionLabel: { fontSize: '11px', fontWeight: '700', color: '#9CA3AF', letterSpacing: '0.5px', padding: '10px 12px 6px' },
  sidebarNav: { display: 'flex', flexDirection: 'column', gap: '2px' },
  sidebarNavItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', width: '100%', backgroundColor: 'transparent', color: '#778198', border: 'none', borderRadius: '14px', cursor: 'pointer', fontSize: '13.5px', fontFamily: 'inherit', textAlign: 'left', whiteSpace: 'nowrap' },
  sidebarNavItemActive: { backgroundColor: '#E8E7FF', color: '#17233C', fontWeight: '600', boxShadow: '0 4px 10px rgba(108,92,231,0.35)' },
  navIcon: { fontSize: '16px', flexShrink: 0, width: '18px', textAlign: 'center' },
  sidebarLogout: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', width: '100%', backgroundColor: 'transparent', color: '#DC2626', border: '1px solid #FCA5A5', borderRadius: '14px', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit', marginTop: 'auto', flexShrink: 0, whiteSpace: 'nowrap' },
  toggleBtn: { position: 'fixed', top: '18px', zIndex: 101, backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', color: '#778198', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', fontSize: '11px', transition: 'left 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'translateX(-50%)' },
  mainContent: { flex: 1, padding: '24px 32px', transition: 'margin-left 0.2s ease' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '15px' },
  pageTitle: { fontSize: '22px', color: '#17233C', margin: 0, fontWeight: '700' },
  pageSubtitle: { fontSize: '14px', color: '#778198', margin: '4px 0 0' },
  topBarRight: { display: 'flex', alignItems: 'center', gap: '14px' },
  dateChip: { background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '14px', padding: '8px 14px', fontSize: '13px', color: '#34415B' },
  profileChip: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatarCircle: { width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#E8E7FF', color: '#17233C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '15px' },
  profileName: { fontSize: '13px', fontWeight: '600', color: '#17233C' },
  profileRole: { fontSize: '11px', color: '#778198' },
  error: { backgroundColor: '#FEF2F2', color: '#DC2626', padding: '12px', borderRadius: '16px', marginBottom: '20px', textAlign: 'center', fontSize: '14px' },
  professionalsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' },
  professionalCard: { backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '16px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' },
  cardAvatar: { fontSize: '36px' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: '17px', fontWeight: '600', color: '#17233C', margin: '0 0 4px 0' },
  cardBadgeRow: { display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' },
  badgeConsultant: { backgroundColor: '#F3F4F6', color: '#17233C', padding: '2px 10px', borderRadius: '16px', fontSize: '11px' },
  badgeDermatologist: { backgroundColor: '#F3F4F6', color: '#17233C', padding: '2px 10px', borderRadius: '16px', fontSize: '11px' },
  verifiedBadge: { backgroundColor: '#ECFDF5', color: '#059669', padding: '2px 10px', borderRadius: '16px', fontSize: '10px' },
  cardTags: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' },
  tag: { backgroundColor: '#FFFFFF', padding: '2px 10px', borderRadius: '16px', fontSize: '12px', color: '#778198', border: '1px solid #E5E7EB' },
  viewProfileBtn: { width: '100%', padding: '8px', backgroundColor: 'transparent', color: '#6C63D9', border: '1px solid #6C5CE7', borderRadius: '16px', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit', fontWeight: '500' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(17,24,39,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' },
  modal: { backgroundColor: '#FFFFFF', borderRadius: '16px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflow: 'auto', padding: '30px', position: 'relative', border: '1px solid #E5E7EB', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
  modalClose: { position: 'absolute', top: '12px', right: '16px', backgroundColor: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#778198' },
  modalHeader: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' },
  modalAvatar: { fontSize: '48px' },
  modalHeaderInfo: { flex: 1 },
  modalName: { fontSize: '22px', fontWeight: '700', color: '#17233C', margin: '0 0 4px 0' },
  modalBadgeRow: { display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' },
  verifiedBadgeLarge: { backgroundColor: '#ECFDF5', color: '#059669', padding: '2px 12px', borderRadius: '16px', fontSize: '12px' },
  modalBody: { marginTop: '10px' },
  modalBio: { fontSize: '15px', color: '#17233C', lineHeight: '1.7', marginBottom: '20px' },
  modalStats: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' },
  modalStat: { backgroundColor: '#FFFFFF', padding: '12px', borderRadius: '16px', textAlign: 'center' },
  modalStatValue: { display: 'block', fontSize: '18px', fontWeight: '600', color: '#17233C' },
  modalStatLabel: { fontSize: '12px', color: '#778198' },
  modalDivider: { borderTop: '1px solid #E5E7EB', margin: '16px 0' },
  modalDetailRow: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '14px', borderBottom: '1px solid #F9FAFB' },
  modalDetailLabel: { color: '#778198' },
  modalDetailValue: { color: '#17233C', fontWeight: '500', textAlign: 'right', maxWidth: '60%' },
  bookingSection: { marginTop: '16px' },
  bookingTitle: { fontSize: '16px', fontWeight: '600', color: '#17233C', marginBottom: '12px' },
  bookingField: { marginBottom: '12px' },
  bookingLabel: { display: 'block', fontSize: '13px', fontWeight: '500', color: '#34415B', marginBottom: '4px' },
  bookingInput: { width: '100%', padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: '16px', fontSize: '14px', fontFamily: 'inherit', backgroundColor: '#FFFFFF' },
  bookingTextarea: { width: '100%', padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: '16px', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical', backgroundColor: '#FFFFFF' },
  requestSentMessage: { backgroundColor: '#ECFDF5', color: '#059669', padding: '14px', borderRadius: '16px', textAlign: 'center', marginTop: '16px', border: '1px solid #A7F3D0' },
  bookingSubtext: { fontSize: '13px', color: '#778198', display: 'block', marginTop: '6px' },
  requestBtn: { width: '100%', padding: '14px', backgroundColor: '#E8E7FF', color: '#17233C', border: 'none', borderRadius: '16px', cursor: 'pointer', fontSize: '16px', fontFamily: 'inherit', fontWeight: '600', marginTop: '8px', boxShadow: '0 10px 22px rgba(108,99,217,0.22)' },
  loadingContainer: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#F5F7FB' },
  loadingSpinner: { border: '4px solid #E5E7EB', borderTop: '4px solid #6C5CE7', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' },
  loadingText: { marginTop: '15px', color: '#778198', fontSize: '16px' },
};

const styleSheet = document.createElement('style');
styleSheet.textContent = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
document.head.appendChild(styleSheet);

export default Professionals;