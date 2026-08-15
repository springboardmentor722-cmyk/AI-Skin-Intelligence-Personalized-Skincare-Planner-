// frontend/src/pages/DermatologistDashboard.js

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Chart from 'chart.js/auto';
import ProfessionalSidebar from '../components/ProfessionalSidebar';
import '../styles/professional-theme.css';

function DermatologistDashboard() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [error, setError] = useState('');
  
  const [patients, setPatients] = useState([]);
  const [stats, setStats] = useState({
    totalPatients: 0,
    assessmentsDone: 0,
    activeTreatments: 0,
    improvingPatients: 0,
  });
  const [skinTypeData, setSkinTypeData] = useState({});
  const [concernData, setConcernData] = useState({});
  const [insights, setInsights] = useState([]);
  const [clinicalTip, setClinicalTip] = useState('');

  const skinTypeChartRef = useRef(null);
  const concernChartRef = useRef(null);
  const skinTypeChartInstance = useRef(null);
  const concernChartInstance = useRef(null);

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [patientProfile, setPatientProfile] = useState(null);
  const [patientAssessment, setPatientAssessment] = useState(null);
  const [patientAIResults, setPatientAIResults] = useState(null);
  const [recommendationText, setRecommendationText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    const name = localStorage.getItem('userName');
    setUserName(name || 'Dermatologist');
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');

    try {
      const patientsRes = await api.get('/dermatologist/patients', { params: { token } });
      let patientList = patientsRes.data || [];

      if (patientList.length === 0) {
        setPatients([]);
        setStats({
          totalPatients: 0,
          assessmentsDone: 0,
          activeTreatments: 0,
          improvingPatients: 0,
        });
        setInsights(['📋 No patients yet. When a patient books an appointment, they will appear here.']);
        setClinicalTip('💡 Share your profile link with patients so they can book appointments with you.');
        setLoading(false);
        return;
      }

      const enrichedPatients = [];
      let totalAssessments = 0;
      let totalScores = 0;
      const skinTypes = {};
      const concerns = {};

      for (const patient of patientList) {
        try {
          const profileRes = await api.get('/user/profile', { 
            params: { token, user_id: patient.user_id } 
          });
          const profile = profileRes.data;

          let assessment = null;
          let score = null;
          let detectedConcerns = [];
          try {
            const scoreRes = await api.get('/api/v1/assessment/score', { 
              params: { token, user_id: patient.user_id } 
            });
            if (scoreRes.data && scoreRes.data.score) {
              assessment = scoreRes.data;
              score = assessment.score;
              detectedConcerns = assessment.detected_concerns || [];
              totalScores += score;
              totalAssessments += 1;
            }
          } catch (e) {}

          let aiResults = null;
          try {
            const aiRes = await api.get('/api/v1/ai-analysis/latest', { 
              params: { token, user_id: patient.user_id } 
            });
            if (aiRes.data && aiRes.data.has_results) {
              aiResults = aiRes.data;
            }
          } catch (e) {}

          if (profile && profile.skin_type) {
            const skinType = profile.skin_type || 'Not set';
            skinTypes[skinType] = (skinTypes[skinType] || 0) + 1;
          }

          if (detectedConcerns && detectedConcerns.length > 0) {
            detectedConcerns.forEach(c => {
              const concern = c || 'Other';
              concerns[concern] = (concerns[concern] || 0) + 1;
            });
          } else if (profile && profile.skin_concerns) {
            const profileConcerns = profile.skin_concerns.split(',').map(c => c.trim());
            profileConcerns.forEach(c => {
              if (c) {
                concerns[c] = (concerns[c] || 0) + 1;
              }
            });
          }

          enrichedPatients.push({
            ...patient,
            profile,
            assessment,
            score,
            detectedConcerns,
            aiResults,
            status: score >= 70 ? 'Active' : score >= 50 ? 'Follow-up Due' : 'Needs Attention'
          });

        } catch (err) {
          console.error('Error fetching patient data:', err);
          enrichedPatients.push({
            ...patient,
            profile: null,
            assessment: null,
            score: null,
            detectedConcerns: [],
            aiResults: null,
            status: 'Pending'
          });
        }
      }

      setPatients(enrichedPatients);

      const avgScore = totalAssessments > 0 ? Math.round(totalScores / totalAssessments) : 0;

      setStats({
        totalPatients: enrichedPatients.length,
        assessmentsDone: totalAssessments,
        activeTreatments: enrichedPatients.filter(c => c.routine).length,
        improvingPatients: avgScore,
      });

      setSkinTypeData(skinTypes);
      setConcernData(concerns);

      const generatedInsights = [];
      const lowScorePatients = enrichedPatients.filter(c => c.score && c.score < 60);
      if (lowScorePatients.length > 0) {
        generatedInsights.push(`⚠️ ${lowScorePatients.length} patients have skin health scores below 60 — consider reviewing their treatment plans.`);
      }

      const highScorePatients = enrichedPatients.filter(c => c.score && c.score >= 80);
      if (highScorePatients.length > 0) {
        generatedInsights.push(`✅ ${highScorePatients.length} patients are showing excellent improvement. Consider maintenance plans.`);
      }

      const pendingReviews = enrichedPatients.filter(c => c.status === 'Pending');
      if (pendingReviews.length > 0) {
        generatedInsights.push(`📋 ${pendingReviews.length} patients are waiting for your review.`);
      }

      if (generatedInsights.length === 0) {
        generatedInsights.push(`💪 All your patients are doing well! Keep up the great work!`);
      }

      setInsights(generatedInsights);
      setClinicalTip('🩺 Patients who follow treatment plans consistently show 2x better improvement. Encourage adherence to prescribed routines!');

    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Could not load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && Object.keys(skinTypeData).length > 0) {
      renderSkinTypeChart();
    }
  }, [loading, skinTypeData]);

  useEffect(() => {
    if (!loading && Object.keys(concernData).length > 0) {
      renderConcernChart();
    }
  }, [loading, concernData]);

  const renderSkinTypeChart = () => {
    if (skinTypeChartInstance.current) {
      skinTypeChartInstance.current.destroy();
    }

    const ctx = skinTypeChartRef.current?.getContext('2d');
    if (!ctx) return;

    const sorted = Object.entries(skinTypeData).sort((a, b) => b[1] - a[1]);
    const labels = sorted.map(([key]) => key);
    const data = sorted.map(([, value]) => value);
    const total = data.reduce((a, b) => a + b, 0);
    const percentages = data.map(v => Math.round((v / total) * 100));

    const colors = ['#6c63d9', '#0d9488', '#d97706', '#dc2626', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

    skinTypeChartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels.map((label, i) => `${label} (${percentages[i]}%)`),
        datasets: [{
          data: data,
          backgroundColor: colors.slice(0, labels.length),
          borderWidth: 3,
          borderColor: '#FFFFFF'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 14,
              padding: 14,
              font: { size: 12, weight: '500' }
            }
          }
        },
        cutout: '55%'
      }
    });
  };

  const renderConcernChart = () => {
    if (concernChartInstance.current) {
      concernChartInstance.current.destroy();
    }

    const ctx = concernChartRef.current?.getContext('2d');
    if (!ctx) return;

    const sorted = Object.entries(concernData).sort((a, b) => b[1] - a[1]);
    const labels = sorted.slice(0, 5).map(([key]) => key);
    const data = sorted.slice(0, 5).map(([, value]) => value);
    const total = data.reduce((a, b) => a + b, 0);
    const percentages = data.map(v => Math.round((v / total) * 100));

    const colors = ['#6c63d9', '#0d9488', '#d97706', '#dc2626', '#3b82f6'];

    concernChartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels.map((label, i) => `${label} (${percentages[i]}%)`),
        datasets: [{
          data: data,
          backgroundColor: colors.slice(0, labels.length),
          borderWidth: 3,
          borderColor: '#FFFFFF'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 14,
              padding: 14,
              font: { size: 12, weight: '500' }
            }
          }
        },
        cutout: '55%'
      }
    });
  };

  const openPatientReview = (patient) => {
    setSelectedPatient(patient);
    setShowReviewModal(true);
    setPatientProfile(patient.profile || null);
    setPatientAssessment(patient.assessment || null);
    setPatientAIResults(patient.aiResults || null);
    setRecommendationText('');
  };

  const closePatientModal = () => {
    setShowReviewModal(false);
    setSelectedPatient(null);
    setPatientProfile(null);
    setPatientAssessment(null);
    setPatientAIResults(null);
    setRecommendationText('');
  };

  const submitRecommendation = async () => {
    if (!recommendationText.trim()) {
      alert('Please enter your medical recommendation before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await api.post(`/expert/complete-review/${selectedPatient.request_id}`, {
        recommendation_text: recommendationText
      }, { params: { token } });
      
      alert('✅ Medical recommendation submitted successfully! The patient will see it on their dashboard.');
      closePatientModal();
      fetchAllData();
    } catch (err) {
      alert('Failed to submit recommendation: ' + (err.response?.data?.detail || 'Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const navigateTo = (path) => {
    navigate(path);
  };

  if (loading) {
    return (
      <div className="professional-loading-page">
        <div className="professional-loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="professional-page role-dermatologist">
      <ProfessionalSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main className={`professional-main ${sidebarOpen ? '' : 'is-collapsed'}`}>
        <div className="professional-header">
          <div>
            <div className="professional-kicker">DASHBOARD</div>
            <h1 className="professional-title">Welcome back, Dr. {userName}! 👋</h1>
            <p className="professional-subtitle">Here's what's happening with your patients today.</p>
          </div>
          <button className="professional-secondary-button" onClick={fetchAllData}>
            🔄 Refresh
          </button>
        </div>

        {error && <div className="professional-alert-error">{error}</div>}

        <div className="professional-stats-grid">
          <div className="professional-stat-card">
            <h3 className="professional-stat-number">{stats.totalPatients}</h3>
            <p className="professional-stat-label">Total Patients</p>
          </div>
          <div className="professional-stat-card">
            <h3 className="professional-stat-number">{stats.assessmentsDone}</h3>
            <p className="professional-stat-label">Assessments Done</p>
          </div>
          <div className="professional-stat-card">
            <h3 className="professional-stat-number">{stats.activeTreatments}</h3>
            <p className="professional-stat-label">Active Treatments</p>
          </div>
          <div className="professional-stat-card">
            <h3 className="professional-stat-number">{stats.improvingPatients}%</h3>
            <p className="professional-stat-label">Patients Improving</p>
          </div>
        </div>

        <div className="professional-surface">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #E7EAF1', paddingBottom: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#17233C', margin: 0 }}>👤 Your Patients</h3>
            <span style={{ fontSize: '12px', color: '#778198', backgroundColor: '#F5F7FB', padding: '4px 12px', borderRadius: '20px' }}>{patients.length} patients</span>
          </div>
          
          {patients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ fontSize: '48px', marginBottom: '10px' }}>📋</p>
              <p style={{ fontSize: '18px', fontWeight: '600', color: '#17233C' }}>No patients yet</p>
              <p style={{ fontSize: '14px', color: '#778198' }}>When a patient books an appointment, they will appear here.</p>
            </div>
          ) : (
            <table className="professional-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Skin Type</th>
                  <th>Top Concern</th>
                  <th>Score</th>
                  <th>AI Analysis</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {patients.slice(0, 10).map((patient) => (
                  <tr key={patient.request_id || patient.user_id}>
                    <td>
                      <div style={{ fontWeight: '500', color: '#17233C' }}>{patient.user_name || 'Unknown'}</div>
                      <div style={{ fontSize: '11px', color: '#778198' }}>{patient.email || ''}</div>
                    </td>
                    <td>{patient.profile?.skin_type || '—'}</td>
                    <td>
                      {patient.detectedConcerns?.length > 0 
                        ? patient.detectedConcerns.slice(0, 2).join(', ') 
                        : patient.profile?.skin_concerns || '—'}
                    </td>
                    <td>
                      <span className={patient.score >= 70 ? 'score-good' : patient.score >= 50 ? 'score-fair' : 'score-bad'}>
                        {patient.score ? `${patient.score}/100` : '—'}
                      </span>
                    </td>
                    <td>{patient.aiResults ? '✅ Yes' : '❌ No'}</td>
                    <td>
                      <span className={patient.status === 'Active' ? 'status-active' : patient.status === 'Follow-up Due' ? 'status-followup' : 'status-pending'}>
                        {patient.status}
                      </span>
                    </td>
                    <td>
                      <button 
                        onClick={() => openPatientReview(patient)} 
                        style={{ padding: '6px 14px', backgroundColor: '#6c63d9', color: '#FFFFFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit', fontWeight: '600' }}
                      >
                        {patient.status === 'Pending' ? 'Review →' : 'View →'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {patients.length > 10 && (
            <button style={{ background: 'none', border: 'none', color: '#6c63d9', fontSize: '13px', cursor: 'pointer', padding: '8px 0 0', fontWeight: '600', fontFamily: 'inherit' }} onClick={() => navigateTo('/dermatologist/patients')}>
              View All Patients →
            </button>
          )}
        </div>

        <div className="professional-charts-row">
          <div className="professional-surface">
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#17233C', margin: '0 0 12px 0' }}>Patients by Skin Type</h4>
            <div className="professional-chart-wrapper">
              <canvas ref={skinTypeChartRef}></canvas>
            </div>
          </div>
          <div className="professional-surface">
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#17233C', margin: '0 0 12px 0' }}>Top Skin Concerns</h4>
            <div className="professional-chart-wrapper">
              <canvas ref={concernChartRef}></canvas>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div className="professional-surface">
            <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#17233C', margin: 0 }}>🧠 Clinical Insights</h4>
            {insights.length > 0 ? (
              insights.map((insight, i) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid #F0F2F6', fontSize: '14px', color: '#17233C' }}>
                  {insight}
                </div>
              ))
            ) : (
              <p style={{ textAlign: 'center', color: '#778198', padding: '12px 0', fontSize: '14px' }}>No clinical insights available yet.</p>
            )}
          </div>
          <div className="professional-surface">
            <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#17233C', margin: 0 }}>💡 Clinical Tip</h4>
            <div style={{ backgroundColor: '#EEECFF', borderRadius: '12px', padding: '14px 16px', border: '1px solid #D8D4F5' }}>
              <p style={{ fontSize: '13px', color: '#17233C', margin: 0, lineHeight: '1.5' }}>{clinicalTip}</p>
            </div>
            <button style={{ background: 'none', border: 'none', color: '#6c63d9', fontSize: '13px', cursor: 'pointer', padding: '8px 0 0', fontWeight: '600', fontFamily: 'inherit' }} onClick={() => navigateTo('/dermatologist/skin-conditions-guide')}>
              View Skin Conditions Guide →
            </button>
          </div>
        </div>
      </main>

      {/* Patient Review Modal */}
      {showReviewModal && selectedPatient && (
        <div style={styles.modalOverlay} onClick={closePatientModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button style={styles.modalClose} onClick={closePatientModal}>✕</button>
            <h2 style={styles.modalTitle}>Patient Review — {selectedPatient.user_name}</h2>

            {patientProfile && (
              <div style={styles.modalSection}>
                <h4 style={styles.sectionTitle}>👤 Patient Profile</h4>
                <div style={styles.profileGrid}>
                  <div><strong>Name:</strong> {patientProfile.full_name}</div>
                  <div><strong>Age:</strong> {patientProfile.age}</div>
                  <div><strong>Gender:</strong> {patientProfile.gender}</div>
                  <div><strong>Skin Type:</strong> {patientProfile.skin_type}</div>
                  <div><strong>Concerns:</strong> {patientProfile.skin_concerns || 'None'}</div>
                  <div><strong>Water Intake:</strong> {patientProfile.water_intake}L</div>
                  <div><strong>Sleep:</strong> {patientProfile.sleep_duration}h</div>
                  <div><strong>Stress Level:</strong> {patientProfile.stress_level}</div>
                </div>
              </div>
            )}

            {patientAIResults && patientAIResults.image_url && (
              <div style={styles.modalSection}>
                <h4 style={styles.sectionTitle}>📸 AI Analysis Photo</h4>
                <img 
                  src={patientAIResults.image_url} 
                  alt="AI Analysis"
                  style={styles.aiPhoto}
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/200x200/6c63d9/ffffff?text=No+Image'; }}
                />
                {patientAIResults.predicted_concern && (
                  <p style={styles.aiResultText}>
                    <strong>AI Detected:</strong> {patientAIResults.predicted_concern} 
                    ({patientAIResults.confidence}% confidence)
                  </p>
                )}
              </div>
            )}

            {patientAssessment && (
              <div style={styles.modalSection}>
                <h4 style={styles.sectionTitle}>📊 Latest Assessment</h4>
                <p style={styles.scoreDisplay}>{patientAssessment.score}/100</p>
                {patientAssessment.breakdown && (
                  <div style={styles.breakdownList}>
                    {Object.entries(patientAssessment.breakdown).map(([key, value]) => (
                      <div key={key} style={styles.breakdownRow}>
                        <span>{key.replace(/_/g, ' ')}</span>
                        <div style={styles.breakdownBar}><div style={{...styles.breakdownFill, width: `${value}%`}} /></div>
                        <span>{Math.round(value)}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={styles.modalSection}>
              <h4 style={styles.sectionTitle}>✍️ Your Medical Recommendation</h4>
              <textarea
                style={styles.textarea}
                rows="5"
                placeholder="Enter your medical advice, treatment plan adjustments, and prescription recommendations..."
                value={recommendationText}
                onChange={(e) => setRecommendationText(e.target.value)}
              />
              <button style={styles.submitBtn} onClick={submitRecommendation} disabled={submitting}>
                {submitting ? '⏳ Submitting...' : '✅ Submit Medical Recommendation'}
              </button>
              <p style={styles.noteText}>💡 This will appear on the patient's dashboard.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(23,35,60,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '20px',
    backdropFilter: 'blur(4px)',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    maxWidth: '720px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    padding: '30px',
    position: 'relative',
    border: '1px solid #E7EAF1',
    boxShadow: '0 24px 60px rgba(23,35,60,0.15)',
  },
  modalClose: {
    position: 'absolute',
    top: '12px',
    right: '16px',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#778198',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#17233C',
    marginBottom: '20px',
  },
  modalSection: {
    marginBottom: '20px',
    paddingBottom: '18px',
    borderBottom: '1px solid #F0F2F6',
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#778198',
    marginBottom: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  profileGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    fontSize: '13px',
    color: '#17233C',
  },
  scoreDisplay: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#6c63d9',
    margin: '0 0 12px',
  },
  breakdownList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  breakdownRow: {
    display: 'grid',
    gridTemplateColumns: '130px 1fr 40px',
    alignItems: 'center',
    gap: '10px',
    fontSize: '12px',
    color: '#34415B',
    textTransform: 'capitalize',
  },
  breakdownBar: {
    height: '6px',
    backgroundColor: '#E7EAF1',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  breakdownFill: {
    height: '100%',
    backgroundColor: '#6c63d9',
    borderRadius: '3px',
  },
  aiPhoto: {
    maxWidth: '200px',
    maxHeight: '200px',
    borderRadius: '12px',
    border: '1px solid #E7EAF1',
    objectFit: 'cover',
    marginBottom: '8px',
  },
  aiResultText: {
    fontSize: '13px',
    color: '#17233C',
    margin: 0,
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid #DCE1EC',
    borderRadius: '12px',
    fontSize: '14px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    resize: 'vertical',
  },
  submitBtn: {
    marginTop: '10px',
    padding: '10px 24px',
    backgroundColor: '#6c63d9',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '14px',
    fontFamily: 'inherit',
    fontWeight: '600',
  },
  noteText: {
    fontSize: '12px',
    color: '#778198',
    fontStyle: 'italic',
    marginTop: '8px',
  },
};

export default DermatologistDashboard;