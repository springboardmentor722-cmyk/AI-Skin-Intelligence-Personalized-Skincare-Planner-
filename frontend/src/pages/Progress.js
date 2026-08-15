import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import PatientSidebar from '../components/PatientSidebar';
import '../styles/patient-theme.css';

function Progress() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [adherenceData, setAdherenceData] = useState(null);
  const [scoreHistory, setScoreHistory] = useState([]);
  const [progressSummary, setProgressSummary] = useState(null);
  const [insights, setInsights] = useState([]);
  const [selectedDays, setSelectedDays] = useState(7);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchAllProgressData();
  }, [navigate, selectedDays]);

  const fetchAllProgressData = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');

    try {
      const adherenceRes = await api.get('/api/v1/progress/adherence', {
        params: { token, days: selectedDays }
      });
      setAdherenceData(adherenceRes.data.adherence);

      const historyRes = await api.get('/api/v1/progress/score-history', {
        params: { token, limit: 30 }
      });
      setScoreHistory(historyRes.data.history || []);

      const summaryRes = await api.get('/api/v1/progress/summary', {
        params: { token }
      });
      setProgressSummary(summaryRes.data.progress);

      const insightsRes = await api.get('/api/v1/progress/insights', {
        params: { token }
      });
      setInsights(insightsRes.data.insights || []);
    } catch (err) {
      console.error('Error fetching progress data:', err);
      setError('Could not load progress data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#26A69A';
    if (score >= 60) return '#D98B32';
    return '#C54B58';
  };

  const getAdherenceColor = (percentage) => {
    if (percentage >= 80) return '#26A69A';
    if (percentage >= 60) return '#D98B32';
    return '#C54B58';
  };

  const navigateTo = (path) => navigate(path);

  const currentScore = Number(progressSummary?.current_score || 0);
  const scoreChange = Number(progressSummary?.score_change || 0);
  const adherence = Number(progressSummary?.adherence?.['7_days']?.adherence_percentage || 0);
  const maxScore = Math.max(...scoreHistory.map((item) => Number(item.score || 0)), 100);
  const chartHistory = scoreHistory.slice(-12);

  if (loading) {
    return (
      <div className="patient-loading-page">
        <div className="patient-loading-spinner"></div>
        <p>Loading your progress...</p>
      </div>
    );
  }

  return (
    <div className="patient-page">
      <PatientSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main className={`patient-main ${sidebarOpen ? '' : 'is-collapsed'}`}>
        <header className="patient-header">
          <div>
            <p className="patient-kicker">PROGRESS TRACKING</p>
            <h1 className="patient-title">Your skin progress</h1>
            <p className="patient-subtitle">
              See how your routine consistency and skin-health score change over time.
            </p>
          </div>
          <div className="progress-header-actions">
            <span className="progress-date-chip">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <div className="progress-user-chip">
              <span>{localStorage.getItem('userName')?.charAt(0)?.toUpperCase() || 'U'}</span>
              <strong>{localStorage.getItem('userName') || 'User'}</strong>
            </div>
          </div>
        </header>

        {error && <div className="patient-alert-error progress-alert">{error}</div>}

        {progressSummary && (
          <section className="progress-summary-grid">
            <article className="progress-score-card">
              <div>
                <p className="progress-card-label">CURRENT SKIN SCORE</p>
                <h2>{currentScore}<small>/100</small></h2>
                <span className={`progress-trend ${scoreChange >= 0 ? 'positive' : 'negative'}`}>
                  {scoreChange >= 0 ? '↗' : '↘'} {Math.abs(scoreChange)} points {progressSummary.score_trend || 'stable'}
                </span>
              </div>
              <div
                className="progress-score-ring"
                style={{ '--score': `${currentScore * 3.6}deg`, '--score-color': getScoreColor(currentScore) }}
              >
                <div><strong>{currentScore}</strong><span>score</span></div>
              </div>
            </article>

            <article className="progress-stat-card">
              <span className="progress-stat-icon purple">◎</span>
              <p className="progress-card-label">PRIMARY CONCERN</p>
              <h3>{progressSummary.primary_concern || 'None detected'}</h3>
              <span className="progress-stat-note">{progressSummary.total_assessments || 0} total assessments</span>
            </article>

            <article className="progress-stat-card">
              <span className="progress-stat-icon teal">✓</span>
              <p className="progress-card-label">ROUTINE ADHERENCE</p>
              <h3 style={{ color: getAdherenceColor(adherence) }}>{adherence}%</h3>
              <span className="progress-stat-note">
                {progressSummary.adherence?.['7_days']?.completed_steps || 0} of {progressSummary.adherence?.['7_days']?.total_steps || 0} steps completed
              </span>
              <div className="mini-progress"><span style={{ width: `${Math.min(adherence, 100)}%`, background: getAdherenceColor(adherence) }} /></div>
            </article>
          </section>
        )}

        <section className="progress-main-grid">
          <article className="patient-card progress-visual-card">
            <div className="progress-card-header">
              <div>
                <p className="progress-card-label">ROUTINE CONSISTENCY</p>
                <h2>Adherence overview</h2>
              </div>
              <div className="progress-period-switcher">
                {[7, 30, 90].map((days) => (
                  <button key={days} type="button" className={selectedDays === days ? 'active' : ''} onClick={() => setSelectedDays(days)}>
                    {days}D
                  </button>
                ))}
              </div>
            </div>

            {adherenceData ? (
              <>
                <div className="adherence-highlight">
                  <div><strong>{adherenceData.adherence_percentage || 0}%</strong><span>adherence</span></div>
                  <div><strong>{adherenceData.completed_steps || 0}</strong><span>completed</span></div>
                  <div><strong>{adherenceData.total_steps || 0}</strong><span>total steps</span></div>
                </div>
                <div className="professional-bars adherence-bars">
                  {(adherenceData.daily_breakdown || []).map((day, index) => {
                    const value = Number(day.percentage || 0);
                    return (
                      <div className="professional-bar-column" key={index}>
                        <div className="professional-bar-track"><span style={{ height: `${Math.min(value, 100)}%`, background: getAdherenceColor(value) }} /></div>
                        <strong>{value}%</strong>
                        <small>{new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</small>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="progress-empty">No adherence data is available yet.</div>
            )}
          </article>

          <article className="patient-card progress-visual-card">
            <div className="progress-card-header">
              <div>
                <p className="progress-card-label">HEALTH SCORE</p>
                <h2>Score history</h2>
              </div>
              <span className="trend-pill">{progressSummary?.score_trend || 'stable'}</span>
            </div>

            {chartHistory.length > 0 ? (
              <>
                <div className="score-chart-area">
                  <div className="score-y-labels"><span>100</span><span>75</span><span>50</span><span>25</span><span>0</span></div>
                  <div className="score-chart">
                    <div className="chart-grid-lines"><i /><i /><i /><i /><i /></div>
                    <div className="score-columns">
                      {chartHistory.map((item, index) => {
                        const value = Number(item.score || 0);
                        return (
                          <div className="score-column" key={index} title={`${value}/100`}>
                            <div className="score-column-value">{value}</div>
                            <span style={{ height: `${Math.max((value / maxScore) * 100, 4)}%`, background: getScoreColor(value) }} />
                            <small>{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</small>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="chart-footer-note"><span className="chart-dot" /> Each assessment contributes to your trend.</div>
              </>
            ) : (
              <div className="progress-empty">Complete an assessment to start your score history.</div>
            )}
          </article>
        </section>

        <section className="patient-card insight-panel">
          <div className="progress-card-header">
            <div>
              <p className="progress-card-label">PERSONALIZED FEEDBACK</p>
              <h2>AI insights for you</h2>
            </div>
            <span className="insight-spark">✦</span>
          </div>

          {insights.length > 0 ? (
            <div className="insight-grid">
              {insights.map((insight, index) => (
                <div className={`insight-tile ${insight.type || 'neutral'}`} key={index}>
                  <span className="insight-tile-icon">{insight.icon || '✦'}</span>
                  <div><h3>{insight.title}</h3><p>{insight.description}</p></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="progress-empty">Complete more assessments and follow your routine to unlock personalized insights.</div>
          )}
        </section>

        <div className="progress-actions">
          <button type="button" className="patient-primary-button" onClick={() => navigateTo('/assessment')}>Take Assessment →</button>
          <button type="button" className="patient-secondary-button" onClick={() => navigateTo('/routine')}>View Routine</button>
          <button type="button" className="patient-secondary-button" onClick={fetchAllProgressData}>Refresh Data</button>
        </div>
      </main>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
.progress-header-actions { display:flex; align-items:center; gap:12px; }
.progress-date-chip { padding:10px 14px; border:1px solid #E7EAF1; border-radius:12px; background:#fff; color:#778198; font-size:12px; }
.progress-user-chip { display:flex; align-items:center; gap:8px; color:#17233C; font-size:13px; }
.progress-user-chip span { width:36px; height:36px; display:grid; place-items:center; border-radius:12px; background:#E8E7FF; color:#6C63D9; font-weight:800; }
.progress-summary-grid { display:grid; grid-template-columns:1.35fr 1fr 1fr; gap:18px; margin-bottom:18px; }
.progress-score-card, .progress-stat-card { min-height:150px; padding:22px; border:1px solid #E7EAF1; border-radius:20px; background:#fff; box-shadow:0 12px 34px rgba(23,35,60,.06); }
.progress-score-card { display:flex; align-items:center; justify-content:space-between; background:linear-gradient(135deg,#17233C,#263B63); color:#fff; overflow:hidden; }
.progress-card-label { margin:0 0 8px; color:#8894AE; font-size:10px; font-weight:800; letter-spacing:1.2px; }
.progress-score-card .progress-card-label { color:#BDB8FF; }
.progress-score-card h2 { margin:0 0 10px; font-size:34px; letter-spacing:-1px; }
.progress-score-card h2 small { margin-left:3px; color:#AAB8D1; font-size:15px; font-weight:500; }
.progress-trend { font-size:12px; font-weight:800; }
.progress-trend.positive { color:#8BE2D8; } .progress-trend.negative { color:#FFB1B8; }
.progress-score-ring { width:92px; height:92px; display:grid; place-items:center; flex:0 0 92px; border-radius:50%; background:conic-gradient(var(--score-color) var(--score), rgba(255,255,255,.16) 0); }
.progress-score-ring > div { width:70px; height:70px; display:flex; flex-direction:column; align-items:center; justify-content:center; border-radius:50%; background:#17233C; }
.progress-score-ring strong { font-size:20px; } .progress-score-ring span { color:#AAB8D1; font-size:10px; }
.progress-stat-card { position:relative; } .progress-stat-icon { position:absolute; top:18px; right:20px; width:34px; height:34px; display:grid; place-items:center; border-radius:11px; font-size:19px; font-weight:800; }
.progress-stat-icon.purple { background:#EEEAFE; color:#6C63D9; } .progress-stat-icon.teal { background:#E4F7F4; color:#26A69A; }
.progress-stat-card h3 { margin:10px 0 7px; color:#17233C; font-size:23px; } .progress-stat-note { color:#778198; font-size:12px; }
.mini-progress { height:6px; margin-top:17px; overflow:hidden; border-radius:999px; background:#EEF0F5; } .mini-progress span { display:block; height:100%; border-radius:inherit; }
.progress-main-grid { display:grid; grid-template-columns:1fr 1fr; gap:18px; margin-bottom:18px; }
.progress-visual-card { min-height:365px; padding:24px; }
.progress-card-header { display:flex; align-items:flex-start; justify-content:space-between; gap:15px; margin-bottom:22px; }
.progress-card-header h2 { margin:0; color:#17233C; font-size:20px; letter-spacing:-.4px; }
.progress-period-switcher { display:flex; gap:4px; padding:4px; border-radius:10px; background:#F5F7FB; } .progress-period-switcher button { padding:7px 9px; border:0; border-radius:7px; background:transparent; color:#778198; cursor:pointer; font:inherit; font-size:11px; font-weight:800; } .progress-period-switcher button.active { background:#6C63D9; color:#fff; }
.adherence-highlight { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:28px; } .adherence-highlight div { padding:12px; border-radius:12px; background:#F8F9FC; } .adherence-highlight strong,.adherence-highlight span { display:block; } .adherence-highlight strong { color:#17233C; font-size:22px; } .adherence-highlight span { margin-top:4px; color:#778198; font-size:11px; }
.professional-bars { display:flex; align-items:flex-end; justify-content:space-between; gap:8px; height:190px; padding:12px 0 0; border-bottom:1px solid #E7EAF1; }
.professional-bar-column { display:flex; flex:1; min-width:0; height:100%; flex-direction:column; align-items:center; justify-content:flex-end; gap:6px; } .professional-bar-track { position:relative; width:100%; max-width:28px; height:135px; overflow:hidden; border-radius:8px 8px 3px 3px; background:#F0F1F6; } .professional-bar-track span { position:absolute; right:0; bottom:0; left:0; border-radius:8px 8px 3px 3px; } .professional-bar-column strong { color:#17233C; font-size:10px; } .professional-bar-column small { overflow:hidden; max-width:48px; color:#8B94A8; font-size:9px; text-overflow:ellipsis; white-space:nowrap; }
.trend-pill { padding:7px 10px; border-radius:999px; background:#E4F7F4; color:#21776E; font-size:11px; font-weight:800; text-transform:capitalize; }
.score-chart-area { display:flex; gap:10px; height:230px; } .score-y-labels { display:flex; flex-direction:column; justify-content:space-between; padding-bottom:23px; color:#A0A8B8; font-size:10px; } .score-chart { position:relative; flex:1; } .chart-grid-lines { position:absolute; inset:0 0 24px; display:flex; flex-direction:column; justify-content:space-between; } .chart-grid-lines i { border-top:1px dashed #E4E7EF; } .score-columns { position:absolute; inset:0 0 0; display:flex; align-items:flex-end; gap:8px; } .score-column { position:relative; display:flex; min-width:0; height:100%; flex:1; flex-direction:column; align-items:center; justify-content:flex-end; gap:5px; } .score-column span { width:100%; max-width:25px; min-height:6px; border-radius:7px 7px 2px 2px; box-shadow:0 5px 12px rgba(108,99,217,.12); } .score-column-value { color:#6C63D9; font-size:10px; font-weight:800; } .score-column small { overflow:hidden; max-width:48px; color:#8B94A8; font-size:9px; text-overflow:ellipsis; white-space:nowrap; } .chart-footer-note { margin-top:15px; color:#8B94A8; font-size:11px; } .chart-dot { display:inline-block; width:7px; height:7px; margin-right:6px; border-radius:50%; background:#6C63D9; }
.insight-panel { padding:24px; margin-bottom:18px; } .insight-spark { display:grid; width:34px; height:34px; place-items:center; border-radius:11px; background:#EEEAFE; color:#6C63D9; font-weight:800; } .insight-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; } .insight-tile { display:flex; gap:12px; min-height:92px; padding:15px; border:1px solid #E7EAF1; border-radius:14px; background:#F8F9FC; } .insight-tile.positive { border-color:#BCE7DE; background:#F0FBF8; } .insight-tile.warning { border-color:#F1D8A5; background:#FFF9ED; } .insight-tile-icon { width:30px; height:30px; display:grid; place-items:center; flex:0 0 30px; border-radius:9px; background:#E8E7FF; color:#6C63D9; } .insight-tile h3 { margin:0 0 5px; color:#17233C; font-size:13px; } .insight-tile p { margin:0; color:#778198; font-size:11px; line-height:1.5; }
.progress-actions { display:flex; justify-content:flex-end; gap:10px; padding-bottom:20px; } .progress-empty { display:grid; min-height:190px; place-items:center; border:1px dashed #DCE1EC; border-radius:14px; color:#8B94A8; font-size:13px; text-align:center; }
@media (max-width: 1050px) { .progress-summary-grid,.progress-main-grid { grid-template-columns:1fr 1fr; } .progress-score-card { grid-column:span 2; } .insight-grid { grid-template-columns:1fr 1fr; } }
@media (max-width: 720px) { .progress-header-actions { width:100%; justify-content:space-between; } .progress-summary-grid,.progress-main-grid,.insight-grid { grid-template-columns:1fr; } .progress-score-card { grid-column:auto; } .progress-actions { flex-wrap:wrap; justify-content:flex-start; } }
`;

export default Progress;
