// frontend/src/pages/ConsultantDashboard.js

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Chart from 'chart.js/auto';
import ProfessionalSidebar from '../components/ProfessionalSidebar';
import '../styles/professional-theme.css';

function ConsultantDashboard() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [error, setError] = useState('');
  
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState({
    totalClients: 0,
    assessmentsDone: 0,
    activeRoutines: 0,
    avgImprovement: 0,
  });
  const [skinTypeData, setSkinTypeData] = useState({});
  const [concernData, setConcernData] = useState({});
  const [insights, setInsights] = useState([]);
  const [consultantTip, setConsultantTip] = useState('');

  const skinTypeChartRef = useRef(null);
  const concernChartRef = useRef(null);
  const skinTypeChartInstance = useRef(null);
  const concernChartInstance = useRef(null);

  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientProfile, setClientProfile] = useState(null);
  const [clientAssessment, setClientAssessment] = useState(null);
  const [clientAIResults, setClientAIResults] = useState(null);
  const [recommendationText, setRecommendationText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    const name = localStorage.getItem('userName');
    setUserName(name || 'Consultant');
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');

    try {
      const clientsRes = await api.get('/consultant/reviews', { params: { token } });
      let clientList = clientsRes.data || [];
      
      if (clientList.length === 0) {
        setClients([]);
        setStats({
          totalClients: 0,
          assessmentsDone: 0,
          activeRoutines: 0,
          avgImprovement: 0,
        });
        setInsights(['📋 No clients yet. When a patient books an appointment, they will appear here.']);
        setConsultantTip('💡 Share your profile link with patients so they can book appointments with you.');
        setLoading(false);
        return;
      }

      const enrichedClients = [];
      let totalAssessments = 0;
      let totalScores = 0;
      const skinTypes = {};
      const concerns = {};

      for (const client of clientList) {
        try {
          const profileRes = await api.get('/user/profile', { 
            params: { token, user_id: client.user_id } 
          });
          const profile = profileRes.data;

          let assessment = null;
          let score = null;
          let detectedConcerns = [];
          try {
            const scoreRes = await api.get('/api/v1/assessment/score', { 
              params: { token, user_id: client.user_id } 
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
              params: { token, user_id: client.user_id } 
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

          enrichedClients.push({
            ...client,
            profile,
            assessment,
            score,
            detectedConcerns,
            aiResults,
            status: score >= 70 ? 'Active' : score >= 50 ? 'Follow-up Due' : 'Needs Attention'
          });

        } catch (err) {
          console.error('Error fetching client data:', err);
          enrichedClients.push({
            ...client,
            profile: null,
            assessment: null,
            score: null,
            detectedConcerns: [],
            aiResults: null,
            status: 'Pending'
          });
        }
      }

      setClients(enrichedClients);

      const avgScore = totalAssessments > 0 ? Math.round(totalScores / totalAssessments) : 0;

      setStats({
        totalClients: enrichedClients.length,
        assessmentsDone: totalAssessments,
        activeRoutines: enrichedClients.filter(c => c.routine).length,
        avgImprovement: avgScore,
      });

      setSkinTypeData(skinTypes);
      setConcernData(concerns);

      const generatedInsights = [];
      const lowScoreClients = enrichedClients.filter(c => c.score && c.score < 60);
      if (lowScoreClients.length > 0) {
        generatedInsights.push(`⚠️ ${lowScoreClients.length} clients have skin health scores below 60 — consider reviewing their routines.`);
      }

      const highScoreClients = enrichedClients.filter(c => c.score && c.score >= 80);
      if (highScoreClients.length > 0) {
        generatedInsights.push(`✅ ${highScoreClients.length} clients are showing excellent improvement.`);
      }

      const pendingReviews = enrichedClients.filter(c => c.status === 'Pending');
      if (pendingReviews.length > 0) {
        generatedInsights.push(`📋 ${pendingReviews.length} clients are waiting for your review.`);
      }

      if (generatedInsights.length === 0) {
        generatedInsights.push(`💪 All your clients are doing well! Keep up the great work!`);
      }

      setInsights(generatedInsights);
      setConsultantTip('💡 Clients who follow routines consistently show 2x better improvement. Encourage hydration and sunscreen daily!');

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

    const colors = ['#0d9488', '#6c63d9', '#d97706', '#dc2626', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

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

    const colors = ['#0d9488', '#6c63d9', '#d97706', '#dc2626', '#3b82f6'];

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

  const openClientReview = (client) => {
    setSelectedClient(client);
    setShowClientModal(true);
    setClientProfile(client.profile || null);
    setClientAssessment(client.assessment || null);
    setClientAIResults(client.aiResults || null);
    setRecommendationText('');
  };

  const closeClientModal = () => {
    setShowClientModal(false);
    setSelectedClient(null);
    setClientProfile(null);
    setClientAssessment(null);
    setClientAIResults(null);
    setRecommendationText('');
  };

  const submitRecommendation = async () => {
    if (!recommendationText.trim()) {
      alert('Please enter your recommendation before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await api.post(`/expert/complete-review/${selectedClient.request_id}`, {
        recommendation_text: recommendationText
      }, { params: { token } });
      
      alert('✅ Recommendation submitted successfully! The client will see it on their dashboard.');
      closeClientModal();
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
    <div className="professional-page role-consultant">
      <ProfessionalSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main className={`professional-main ${sidebarOpen ? '' : 'is-collapsed'}`}>
        <div className="professional-header">
          <div>
            <div className="professional-kicker">DASHBOARD</div>
            <h1 className="professional-title">Welcome back, {userName}! 👋</h1>
            <p className="professional-subtitle">Here's what's happening with your clients today.</p>
          </div>
          <button className="professional-secondary-button" onClick={fetchAllData}>
            🔄 Refresh
          </button>
        </div>

        {error && <div className="professional-alert-error">{error}</div>}

        <div className="professional-stats-grid">
          <div className="professional-stat-card">
            <h3 className="professional-stat-number">{stats.totalClients}</h3>
            <p className="professional-stat-label">Total Clients</p>
          </div>
          <div className="professional-stat-card">
            <h3 className="professional-stat-number">{stats.assessmentsDone}</h3>
            <p className="professional-stat-label">Assessments Done</p>
          </div>
          <div className="professional-stat-card">
            <h3 className="professional-stat-number">{stats.activeRoutines}</h3>
            <p className="professional-stat-label">Active Routines</p>
          </div>
          <div className="professional-stat-card">
            <h3 className="professional-stat-number">{stats.avgImprovement}%</h3>
            <p className="professional-stat-label">Avg. Improvement</p>
          </div>
        </div>

        <div className="professional-surface">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #E7EAF1', paddingBottom: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#17233C', margin: 0 }}>👤 Your Clients</h3>
            <span style={{ fontSize: '12px', color: '#778198', backgroundColor: '#F5F7FB', padding: '4px 12px', borderRadius: '20px' }}>{clients.length} clients</span>
          </div>
          
          {clients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ fontSize: '48px', marginBottom: '10px' }}>📋</p>
              <p style={{ fontSize: '18px', fontWeight: '600', color: '#17233C' }}>No clients yet</p>
              <p style={{ fontSize: '14px', color: '#778198' }}>When a patient books an appointment, they will appear here.</p>
            </div>
          ) : (
            <table className="professional-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Skin Type</th>
                  <th>Top Concern</th>
                  <th>Score</th>
                  <th>AI Analysis</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {clients.slice(0, 10).map((client) => (
                  <tr key={client.request_id || client.user_id}>
                    <td>
                      <div style={{ fontWeight: '500', color: '#17233C' }}>{client.user_name || 'Unknown'}</div>
                      <div style={{ fontSize: '11px', color: '#778198' }}>{client.email || ''}</div>
                    </td>
                    <td>{client.profile?.skin_type || '—'}</td>
                    <td>
                      {client.detectedConcerns?.length > 0 
                        ? client.detectedConcerns.slice(0, 2).join(', ') 
                        : client.profile?.skin_concerns || '—'}
                    </td>
                    <td>
                      <span className={client.score >= 70 ? 'score-good' : client.score >= 50 ? 'score-fair' : 'score-bad'}>
                        {client.score ? `${client.score}/100` : '—'}
                      </span>
                    </td>
                    <td>{client.aiResults ? '✅ Yes' : '❌ No'}</td>
                    <td>
                      <span className={client.status === 'Active' ? 'status-active' : client.status === 'Follow-up Due' ? 'status-followup' : 'status-pending'}>
                        {client.status}
                      </span>
                    </td>
                    <td>
                      <button 
                        onClick={() => openClientReview(client)} 
                        style={{ padding: '6px 14px', backgroundColor: '#0d9488', color: '#FFFFFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit', fontWeight: '600' }}
                      >
                        {client.status === 'Pending' ? 'Review →' : 'View →'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {clients.length > 10 && (
            <button style={{ background: 'none', border: 'none', color: '#0d9488', fontSize: '13px', cursor: 'pointer', padding: '8px 0 0', fontWeight: '600', fontFamily: 'inherit' }} onClick={() => navigateTo('/consultant/clients')}>
              View All Clients →
            </button>
          )}
        </div>

        <div className="professional-charts-row">
          <div className="professional-surface">
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#17233C', margin: '0 0 12px 0' }}>Clients by Skin Type</h4>
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
            <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#17233C', margin: 0 }}>💡 AI Insights</h4>
            {insights.length > 0 ? (
              insights.map((insight, i) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid #F0F2F6', fontSize: '14px', color: '#17233C' }}>
                  {insight}
                </div>
              ))
            ) : (
              <p style={{ textAlign: 'center', color: '#778198', padding: '12px 0', fontSize: '14px' }}>No insights available yet.</p>
            )}
          </div>
          <div className="professional-surface">
            <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#17233C', margin: 0 }}>💡 Tip</h4>
            <div style={{ backgroundColor: '#E4F7F4', borderRadius: '12px', padding: '14px 16px', border: '1px solid #A8D9D2' }}>
              <p style={{ fontSize: '13px', color: '#17233C', margin: 0, lineHeight: '1.5' }}>{consultantTip}</p>
            </div>
            <button style={{ background: 'none', border: 'none', color: '#0d9488', fontSize: '13px', cursor: 'pointer', padding: '8px 0 0', fontWeight: '600', fontFamily: 'inherit' }} onClick={() => navigateTo('/consultant/skin-concerns-guide')}>
              View Skin Concerns Guide →
            </button>
          </div>
        </div>
      </main>

      {/* Client Review Modal */}
      {showClientModal && selectedClient && (
        <div style={styles.modalOverlay} onClick={closeClientModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button style={styles.modalClose} onClick={closeClientModal}>✕</button>
            <h2 style={styles.modalTitle}>Client Review — {selectedClient.user_name}</h2>

            {clientProfile && (
              <div style={styles.modalSection}>
                <h4 style={styles.sectionTitle}>👤 Client Profile</h4>
                <div style={styles.profileGrid}>
                  <div><strong>Name:</strong> {clientProfile.full_name}</div>
                  <div><strong>Age:</strong> {clientProfile.age}</div>
                  <div><strong>Gender:</strong> {clientProfile.gender}</div>
                  <div><strong>Skin Type:</strong> {clientProfile.skin_type}</div>
                  <div><strong>Concerns:</strong> {clientProfile.skin_concerns || 'None'}</div>
                  <div><strong>Water Intake:</strong> {clientProfile.water_intake}L</div>
                  <div><strong>Sleep:</strong> {clientProfile.sleep_duration}h</div>
                  <div><strong>Stress Level:</strong> {clientProfile.stress_level}</div>
                </div>
              </div>
            )}

            {clientAIResults && clientAIResults.image_url && (
              <div style={styles.modalSection}>
                <h4 style={styles.sectionTitle}>📸 AI Analysis Photo</h4>
                <img 
                  src={clientAIResults.image_url} 
                  alt="AI Analysis"
                  style={styles.aiPhoto}
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/200x200/0d9488/ffffff?text=No+Image'; }}
                />
                {clientAIResults.predicted_concern && (
                  <p style={styles.aiResultText}>
                    <strong>AI Detected:</strong> {clientAIResults.predicted_concern} 
                    ({clientAIResults.confidence}% confidence)
                  </p>
                )}
              </div>
            )}

            {clientAssessment && (
              <div style={styles.modalSection}>
                <h4 style={styles.sectionTitle}>📊 Latest Assessment</h4>
                <p style={styles.scoreDisplay}>{clientAssessment.score}/100</p>
                {clientAssessment.breakdown && (
                  <div style={styles.breakdownList}>
                    {Object.entries(clientAssessment.breakdown).map(([key, value]) => (
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
              <h4 style={styles.sectionTitle}>✍️ Your Recommendation</h4>
              <textarea
                style={styles.textarea}
                rows="5"
                placeholder="Enter your professional advice, product suggestions, and routine guidance for this client..."
                value={recommendationText}
                onChange={(e) => setRecommendationText(e.target.value)}
              />
              <button style={styles.submitBtn} onClick={submitRecommendation} disabled={submitting}>
                {submitting ? '⏳ Submitting...' : '✅ Submit Recommendation'}
              </button>
              <p style={styles.noteText}>💡 This will appear on the client's dashboard.</p>
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
    color: '#0d9488',
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
    backgroundColor: '#0d9488',
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
    backgroundColor: '#0d9488',
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

export default ConsultantDashboard;