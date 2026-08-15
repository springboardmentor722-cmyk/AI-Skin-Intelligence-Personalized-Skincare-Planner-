// frontend/src/pages/ConsultantProgress.js

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import Chart from 'chart.js/auto';
import ProfessionalSidebar from '../components/ProfessionalSidebar';
import '../styles/professional-theme.css';

const API_BASE_URL = 'http://localhost:8000';

const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  if (url.startsWith('data:')) return url;
  return `${API_BASE_URL}${url}`;
};

const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/200x200/0d9488/FFFFFF?text=No+Image';

function ConsultantProgress() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('consultant');
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [scoreHistory, setScoreHistory] = useState([]);
  const [adherence, setAdherence] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [selectedDays, setSelectedDays] = useState(7);

  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    const name = localStorage.getItem('userName');
    const role = localStorage.getItem('role') || 'consultant';
    setUserName(name || 'Consultant');
    setUserRole(role);
    fetchClients();

    if (location.state?.clientId) {
      setSelectedClient(location.state.clientId);
    }
  }, []);

  useEffect(() => {
    if (selectedClient) {
      fetchProgressData(selectedClient);
      fetchPhotos(selectedClient);
      fetchComparison(selectedClient);
    }
  }, [selectedClient, selectedDays]);

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role') || 'consultant';
      
      let endpoint = '/consultant/reviews';
      if (role === 'dermatologist') {
        endpoint = '/dermatologist/patients';
      }

      const res = await api.get(endpoint, { params: { token } });
      const clientList = res.data || [];

      const enriched = [];
      for (const client of clientList) {
        try {
          const profileRes = await api.get('/user/profile', {
            params: { token, user_id: client.user_id }
          });
          enriched.push({
            ...client,
            profile: profileRes.data
          });
        } catch (e) {
          enriched.push(client);
        }
      }
      setClients(enriched);
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  };

  const fetchProgressData = async (clientId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      const historyRes = await api.get('/api/v1/progress/score-history', {
        params: { token, user_id: clientId, limit: 30 }
      });
      setScoreHistory(historyRes.data.history || []);

      const adherenceRes = await api.get('/api/v1/progress/adherence', {
        params: { token, user_id: clientId, days: selectedDays }
      });
      setAdherence(adherenceRes.data.adherence);

      setError('');
    } catch (err) {
      console.error('Error fetching progress:', err);
      setError('Could not load progress data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPhotos = async (clientId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/api/v1/photos', {
        params: { token, user_id: clientId, limit: 20 }
      });
      setPhotos(res.data.photos || []);
    } catch (err) {
      console.error('Error fetching photos:', err);
    }
  };

  const fetchComparison = async (clientId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/api/v1/photos/comparison', {
        params: { token, user_id: clientId }
      });
      setComparison(res.data.comparison || null);
    } catch (err) {
      console.error('Error fetching comparison:', err);
    }
  };

  useEffect(() => {
    if (!loading && scoreHistory.length > 0) {
      renderChart();
    }
  }, [loading, scoreHistory]);

  const renderChart = () => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current?.getContext('2d');
    if (!ctx) return;

    const labels = scoreHistory.map(h => {
      const date = new Date(h.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    const scores = scoreHistory.map(h => h.score);

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Skin Health Score',
          data: scores,
          borderColor: userRole === 'dermatologist' ? '#6c63d9' : '#0d9488',
          backgroundColor: userRole === 'dermatologist' ? 'rgba(108,99,217,0.1)' : 'rgba(13,148,136,0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: scores.map(s => s >= 70 ? (userRole === 'dermatologist' ? '#6c63d9' : '#0d9488') : s >= 50 ? '#d97706' : '#dc2626'),
          pointBorderColor: '#FFFFFF',
          pointBorderWidth: 2,
          pointRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `Score: ${context.parsed.y}/100`;
              }
            }
          }
        },
        scales: {
          y: {
            min: 0,
            max: 100,
            grid: { color: 'rgba(0,0,0,0.05)' }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const navigateTo = (path) => {
    navigate(path);
  };

  // Dynamic labels
  const pageTitle = userRole === 'dermatologist' ? '📈 Patient Progress' : '📈 Progress Tracking';
  const pageSubtitle = userRole === 'dermatologist' ? 'Track patient progress and treatment adherence.' : 'Track client progress and adherence.';
  const clientLabel = userRole === 'dermatologist' ? 'patient' : 'client';

  return (
    <div className={`professional-page role-${userRole}`}>
      <ProfessionalSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main className={`professional-main ${sidebarOpen ? '' : 'is-collapsed'}`}>
        <div className="professional-header">
          <div>
            <div className="professional-kicker">{userRole === 'dermatologist' ? 'PATIENT PROGRESS' : 'PROGRESS TRACKING'}</div>
            <h1 className="professional-title">{pageTitle}</h1>
            <p className="professional-subtitle">{pageSubtitle}</p>
          </div>
        </div>

        {error && <div className="professional-alert-error">{error}</div>}

        <div className="professional-surface">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#17233C' }}>
              Select {clientLabel}:
            </label>
            <select
              value={selectedClient || ''}
              onChange={(e) => setSelectedClient(Number(e.target.value))}
              style={{ padding: '10px 14px', border: '1px solid #DCE1EC', borderRadius: '12px', fontSize: '14px', fontFamily: 'inherit', minWidth: '200px', backgroundColor: '#FFFFFF' }}
            >
              <option value="">Choose a {clientLabel}...</option>
              {clients.map((client) => (
                <option key={client.user_id} value={client.user_id}>
                  {client.user_name || client.profile?.full_name || 'Unknown'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!selectedClient && (
          <div className="professional-surface">
            <p style={{ textAlign: 'center', color: '#778198', padding: '20px 0', fontSize: '14px' }}>
              Select a {clientLabel} above to view their progress.
            </p>
          </div>
        )}

        {selectedClient && (
          <>
            {loading ? (
              <div className="professional-surface">
                <p style={{ textAlign: 'center', color: '#778198', padding: '20px 0', fontSize: '14px' }}>Loading progress data...</p>
              </div>
            ) : (
              <>
                <div className="professional-surface">
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#17233C', marginTop: 0, marginBottom: '16px', borderBottom: '1px solid #E7EAF1', paddingBottom: '12px' }}>
                    📊 Score History
                  </h3>
                  {scoreHistory.length > 0 ? (
                    <div style={{ position: 'relative', height: '250px' }}>
                      <canvas ref={chartRef} style={{ maxHeight: '250px', maxWidth: '100%' }}></canvas>
                    </div>
                  ) : (
                    <p style={{ textAlign: 'center', color: '#778198', padding: '20px 0', fontSize: '14px' }}>No score history available for this {clientLabel}.</p>
                  )}
                </div>

                {adherence && (
                  <div className="professional-surface">
                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#17233C', marginTop: 0, marginBottom: '16px', borderBottom: '1px solid #E7EAF1', paddingBottom: '12px' }}>
                      📋 Adherence
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                      <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#F5F7FB', borderRadius: '12px' }}>
                        <div style={{ fontSize: '28px', fontWeight: '700', color: '#17233C' }}>{adherence.adherence_percentage || 0}%</div>
                        <div style={{ fontSize: '13px', color: '#778198' }}>7-Day Adherence</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#F5F7FB', borderRadius: '12px' }}>
                        <div style={{ fontSize: '28px', fontWeight: '700', color: '#17233C' }}>{adherence.completed_steps || 0}</div>
                        <div style={{ fontSize: '13px', color: '#778198' }}>Steps Completed</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#F5F7FB', borderRadius: '12px' }}>
                        <div style={{ fontSize: '28px', fontWeight: '700', color: '#17233C' }}>{adherence.total_steps || 0}</div>
                        <div style={{ fontSize: '13px', color: '#778198' }}>Total Steps</div>
                      </div>
                    </div>
                  </div>
                )}

                {comparison && comparison.has_both && (
                  <div className="professional-surface">
                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#17233C', marginTop: 0, marginBottom: '16px', borderBottom: '1px solid #E7EAF1', paddingBottom: '12px' }}>
                      📸 Before & After
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#F5F7FB', borderRadius: '12px' }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#17233C', marginBottom: '10px' }}>Baseline</div>
                        {comparison.baseline ? (
                          <>
                            <img
                              src={getImageUrl(comparison.baseline.image_url) || PLACEHOLDER_IMAGE}
                              alt="Before"
                              style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '12px', objectFit: 'cover' }}
                              onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
                            />
                            <div style={{ fontSize: '12px', color: '#778198', marginTop: '8px' }}>
                              Score: {comparison.baseline.skin_score || 'N/A'} • {new Date(comparison.baseline.uploaded_at).toLocaleDateString()}
                            </div>
                          </>
                        ) : (
                          <p style={{ textAlign: 'center', color: '#778198', padding: '12px 0', fontSize: '14px' }}>No baseline photo</p>
                        )}
                      </div>
                      <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#F5F7FB', borderRadius: '12px' }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#17233C', marginBottom: '10px' }}>Current</div>
                        {comparison.latest ? (
                          <>
                            <img
                              src={getImageUrl(comparison.latest.image_url) || PLACEHOLDER_IMAGE}
                              alt="After"
                              style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '12px', objectFit: 'cover' }}
                              onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
                            />
                            <div style={{ fontSize: '12px', color: '#778198', marginTop: '8px' }}>
                              Score: {comparison.latest.skin_score || 'N/A'} • {new Date(comparison.latest.uploaded_at).toLocaleDateString()}
                            </div>
                          </>
                        ) : (
                          <p style={{ textAlign: 'center', color: '#778198', padding: '12px 0', fontSize: '14px' }}>No current photo</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {photos.length > 0 && (
                  <div className="professional-surface">
                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#17233C', marginTop: 0, marginBottom: '16px', borderBottom: '1px solid #E7EAF1', paddingBottom: '12px' }}>
                      🖼️ Photo Gallery
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
                      {photos.slice(0, 8).map((photo) => (
                        <div key={photo.id} style={{ backgroundColor: '#F5F7FB', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E7EAF1' }}>
                          <img
                            src={getImageUrl(photo.thumbnail_url || photo.image_url) || PLACEHOLDER_IMAGE}
                            alt={photo.tag}
                            style={{ width: '100%', height: '100px', objectFit: 'cover' }}
                            onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
                          />
                          <div style={{ padding: '8px 10px' }}>
                            <div style={{ fontSize: '11px', fontWeight: '600', color: userRole === 'dermatologist' ? '#6c63d9' : '#0d9488' }}>{photo.tag}</div>
                            <div style={{ fontSize: '10px', color: '#9AA3B5' }}>{new Date(photo.uploaded_at).toLocaleDateString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default ConsultantProgress;