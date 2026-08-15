// frontend/src/pages/MyDashboard.js

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Chart from 'chart.js/auto';
import PatientSidebar from '../components/PatientSidebar';
import '../styles/patient-theme.css';

const API_BASE_URL = 'http://localhost:8000';
const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_BASE_URL}${url}`;
};

function MyDashboard() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [scoreData, setScoreData] = useState(null);
  const [routineData, setRoutineData] = useState({ AM: [], PM: [], Weekly: [] });
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [skinType, setSkinType] = useState('');
  const [hydrationData, setHydrationData] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState('/dashboard');
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [aiResults, setAiResults] = useState(null);
  const [aiResultsLoaded, setAiResultsLoaded] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Chart refs
  const scoreChartRef = useRef(null);
  const scoreChartInstance = useRef(null);

  // Week days for streak
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const [weekProgress, setWeekProgress] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    const name = localStorage.getItem('userName');
    setUserName(name || 'User');
    fetchDashboardData();
    fetchAiAnalysisResults();
    generateWeekProgress();
  }, [navigate]);

  // Generate fake week progress for demo (will be replaced with real data later)
  const generateWeekProgress = () => {
    const today = new Date().getDay();
    const weekData = [];
    for (let i = 0; i < 7; i++) {
      const dayIndex = (today - i + 7) % 7;
      const isCompleted = Math.random() > 0.3;
      weekData.unshift({
        day: weekDays[dayIndex],
        completed: isCompleted,
        isToday: i === 0
      });
    }
    setWeekProgress(weekData);
  };

  useEffect(() => {
    if (!loading && scoreData?.score !== undefined && scoreData?.score !== null) {
      setTimeout(() => renderScoreChart(), 200);
    }
  }, [loading, scoreData]);

  const renderScoreChart = () => {
    if (scoreChartInstance.current) {
      scoreChartInstance.current.destroy();
    }

    const ctx = scoreChartRef.current?.getContext('2d');
    if (!ctx) return;

    const score = scoreData?.score || 0;
    const maxScore = 100;

    scoreChartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [score, maxScore - score],
          backgroundColor: ['#6C63D9', '#E5E7EB'],
          borderWidth: 0,
          borderRadius: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '82%',
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        },
        animation: {
          animateRotate: true,
          duration: 800
        }
      }
    });
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');

    try {
      const scoreRes = await api.get('/api/v1/assessment/score', { params: { token } });
      setScoreData(scoreRes.data);
    } catch (err) {
      console.error('Score fetch error:', err);
    }

    try {
      const routineRes = await api.get('/api/v1/routine', { params: { token } });
      setRoutineData(routineRes.data);
    } catch (err) {
      console.error('Routine fetch error:', err);
    }

    try {
      const profileRes = await api.get('/skin-profile', { params: { token } });
      setHydrationData(profileRes.data.water_intake || 0);
      setSkinType(profileRes.data.skin_type || '');
    } catch (err) {
      console.error('Profile fetch error:', err);
    }

    try {
      const streakRes = await api.get('/api/v1/routine/streak', { params: { token } });
      setStreak(streakRes.data.streak || 0);
    } catch (err) {
      console.error('Streak fetch error:', err);
    }

    try {
      const productsRes = await api.get('/api/v1/products/recommendations', { params: { token } });
      setRecommendedProducts(productsRes.data || []);
    } catch (err) {
      console.error('Recommendations fetch error:', err);
    } finally {
      setProductsLoaded(true);
    }

    setLoading(false);
  };

  const fetchAiAnalysisResults = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/v1/ai-analysis/latest', { params: { token } });
      if (response.data && response.data.has_results) {
        setAiResults(response.data);
      }
    } catch (err) {
      console.error('AI Results fetch error:', err);
    } finally {
      setAiResultsLoaded(true);
    }
  };

  const exportPDF = () => {
    setExporting(true);
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 15;

      const primaryColor = [108, 92, 231];
      const darkColor = [31, 41, 55];
      const grayColor = [107, 114, 128];
      const lightBg = [249, 250, 251];

      doc.setFontSize(28);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('🌿', 15, y + 5);

      doc.setFontSize(20);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text('Skin Intelligence', 30, y + 5);

      doc.setFontSize(12);
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.text('User Report', 30, y + 10);

      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(1);
      doc.line(15, y + 15, pageWidth - 15, y + 15);
      y += 22;

      doc.setFontSize(10);
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 15, y);
      doc.text(`User: ${userName}`, 15, y + 5);
      y += 15;

      const stats = [
        { label: 'Skin Health Score', value: scoreData?.score || 'N/A' },
        { label: 'Skin Type', value: skinType || 'Not set' },
        { label: 'Daily Streak', value: `${streak} days` },
        { label: 'Hydration Level', value: hydrationData ? `${hydrationData}L` : 'N/A' }
      ];

      const cardWidth = (pageWidth - 30) / 4;
      stats.forEach((stat, index) => {
        const x = 15 + (index * cardWidth);
        doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
        doc.roundedRect(x, y, cardWidth - 4, 25, 3, 3, 'F');
        doc.setFontSize(18);
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        doc.text(String(stat.value), x + (cardWidth - 4) / 2, y + 10, { align: 'center' });
        doc.setFontSize(9);
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        doc.text(stat.label, x + (cardWidth - 4) / 2, y + 20, { align: 'center' });
      });
      y += 32;

      if (scoreData?.breakdown) {
        doc.setFontSize(14);
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        doc.text('Score Breakdown', 15, y);
        y += 8;

        const breakdownData = Object.entries(scoreData.breakdown)
          .filter(([key]) => key !== 'overall' && key !== 'trend')
          .map(([key, value]) => [key.replace(/_/g, ' '), `${Math.round(value)}%`]);

        autoTable(doc, {
          startY: y,
          head: [['Category', 'Score']],
          body: breakdownData,
          theme: 'striped',
          headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontSize: 10, fontStyle: 'bold' },
          bodyStyles: { fontSize: 9, textColor: darkColor },
          alternateRowStyles: { fillColor: lightBg },
          margin: { left: 15, right: 15 }
        });

        y = doc.lastAutoTable.finalY + 10;
      }

      doc.setFontSize(14);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text("Today's Routine", 15, y);
      y += 8;

      const allSteps = [...routineData.AM, ...routineData.PM];
      const routineDataTable = allSteps.slice(0, 10).map(step => [
        step.step_category || 'Step',
        step.step_description || '',
        step.is_completed ? '✓ Completed' : '○ Pending'
      ]);

      if (routineDataTable.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [['Category', 'Description', 'Status']],
          body: routineDataTable,
          theme: 'striped',
          headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontSize: 10, fontStyle: 'bold' },
          bodyStyles: { fontSize: 9, textColor: darkColor },
          alternateRowStyles: { fillColor: lightBg },
          margin: { left: 15, right: 15 }
        });

        y = doc.lastAutoTable.finalY + 10;
      } else {
        doc.setFontSize(10);
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        doc.text('No routine steps yet. Complete your assessment.', 15, y);
        y += 10;
      }

      if (aiResults) {
        doc.setFontSize(14);
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        doc.text('AI Skin Insights', 15, y);
        y += 8;

        const insightTexts = [];
        if (aiResults.predicted_concern) {
          insightTexts.push(`Detected Concern: ${aiResults.predicted_concern} (${aiResults.confidence}% confidence)`);
        }
        if (aiResults.recommendations && aiResults.recommendations.length > 0) {
          insightTexts.push(`Recommended Products: ${aiResults.recommendations.slice(0, 3).map(p => p.name).join(', ')}`);
        }

        insightTexts.slice(0, 5).forEach((text) => {
          doc.setFontSize(10);
          doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
          doc.text(`• ${text}`, 15, y);
          y += 6;
        });

        y += 5;
      }

      if (recommendedProducts.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        doc.text('Recommended Products', 15, y);
        y += 8;

        const productsData = recommendedProducts.slice(0, 5).map(p => [
          p.product?.name || 'Product',
          p.product?.brand || 'Brand',
          p.reason || 'Recommended for you'
        ]);

        autoTable(doc, {
          startY: y,
          head: [['Product', 'Brand', 'Reason']],
          body: productsData,
          theme: 'striped',
          headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontSize: 10, fontStyle: 'bold' },
          bodyStyles: { fontSize: 9, textColor: darkColor },
          alternateRowStyles: { fillColor: lightBg },
          margin: { left: 15, right: 15 }
        });

        y = doc.lastAutoTable.finalY + 10;
      }

      const pageHeight = doc.internal.pageSize.getHeight();
      if (y > pageHeight - 20) { doc.addPage(); y = 15; }
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(15, y, pageWidth - 15, y);
      y += 8;
      doc.setFontSize(9);
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.text(`Generated by Skin Intelligence • © ${new Date().getFullYear()}`, pageWidth / 2, y, { align: 'center' });

      doc.save(`user_report_${new Date().toISOString().split('T')[0]}.pdf`);
      alert('✅ PDF Report downloaded successfully!');
    } catch (err) {
      console.error('PDF Error:', err);
      setError('Failed to generate PDF: ' + err.message);
    } finally {
      setExporting(false);
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

  const quickActions = [];

  const totalSteps = routineData.AM.length + routineData.PM.length + routineData.Weekly.length;
  const completedSteps = [...routineData.AM, ...routineData.PM, ...routineData.Weekly].filter(step => step.is_completed).length;

  const generateInsights = () => {
    if (!scoreData || !scoreData.breakdown) return [];
    const b = scoreData.breakdown;
    const insights = [];
    
    if (aiResults && aiResults.predicted_concern) {
      insights.push({ 
        icon: '🤖', 
        text: `AI detected: ${aiResults.predicted_concern} (${aiResults.confidence}% confidence). Check your AI Analysis for detailed recommendations.`,
        isAI: true 
      });
    }
    
    if (b.hydration !== undefined && b.hydration < 70) {
      insights.push({ icon: '💧', text: 'Your hydration score is low — try increasing your daily water intake toward the 2.5L target.' });
    }
    if (b.sleep_quality !== undefined && b.sleep_quality < 70) {
      insights.push({ icon: '😴', text: 'Your sleep score is below target — aim closer to 8 hours a night for better skin recovery.' });
    }
    if (b.routine_consistency !== undefined && b.routine_consistency < 60) {
      insights.push({ icon: '📋', text: 'Your routine consistency is low this week — completing your daily steps will directly improve your score.' });
    }
    if (b.routine_consistency !== undefined && b.routine_consistency >= 85) {
      insights.push({ icon: '✅', text: 'Great routine consistency — keep this up to maintain your progress.' });
    }
    if (b.skin_condition !== undefined && b.skin_condition < 70) {
      insights.push({ icon: '🧴', text: 'Your skin condition score reflects your active concerns — check your assessment for a targeted suggestion.' });
    }
    return insights;
  };

  const insights = generateInsights();
  const allRoutineSteps = [...routineData.AM, ...routineData.PM];
  const primaryConcern = scoreData?.detected_concerns?.[0] || null;
  const hydrationTarget = 2.5;
  const hydrationPct = hydrationData ? Math.min(100, Math.round((hydrationData / hydrationTarget) * 100)) : 0;
  const hydrationLabel = hydrationPct >= 80 ? 'Good' : hydrationPct >= 50 ? 'Fair' : 'Low';

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="patient-page">
      <PatientSidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <main className={`patient-main ${sidebarOpen ? '' : 'is-collapsed'}`}>
        <div style={styles.topBar}>
          <div>
            <h1 style={styles.pageTitle}>Welcome back, {userName}!</h1>
            <p style={styles.pageSubtitle}>Here's your skin summary and personalized recommendations.</p>
          </div>
          <div style={styles.topBarRight}>
            <button style={styles.exportBtn} onClick={exportPDF} disabled={exporting}>
              {exporting ? '⏳ Generating...' : '📥 Export PDF'}
            </button>
            <button style={styles.iconBtn} onClick={() => alert('Notifications coming soon!')} title="Notifications">🔔</button>
            <div style={styles.dateChip}>📅 {today}</div>
            <div style={styles.profileChip}>
              <div style={styles.avatarCircle}>{userName?.charAt(0)?.toUpperCase() || 'U'}</div>
              <div>
                <div style={styles.profileName}>{userName}</div>
                <div style={styles.profileRole}>User</div>
              </div>
            </div>
          </div>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {/* Stats Grid with Gauge Chart */}
        <div style={styles.statsGrid}>
          <div style={{...styles.statCard, ...styles.statCardHighlight}}>
            <p style={styles.statCardLabel}>Skin Health Score</p>
            <div style={styles.scoreRow}>
              <div style={styles.scoreGaugeWrapper}>
                <canvas ref={scoreChartRef} style={styles.scoreGaugeCanvas}></canvas>
                <div style={styles.scoreGaugeCenter}>
                  <span style={styles.scoreBig}>{scoreData?.score ?? '—'}</span>
                  <span style={styles.scoreOutOf}>/100</span>
                </div>
              </div>
            </div>
            <button style={styles.cardLinkBtn} onClick={() => navigateTo('/progress')}>
              View Details →
            </button>
          </div>

          <div style={styles.statCard}>
            <p style={styles.statCardLabel}>Skin Type</p>
            <p style={styles.statCardValue}>{skinType || 'Not set'}</p>
            <button style={styles.cardLinkBtn} onClick={() => navigateTo('/assessment')}>
              View Details →
            </button>
          </div>

          <div style={styles.statCard}>
            <p style={styles.statCardLabel}>Top Concern</p>
            <p style={styles.statCardValue}>
              {aiResults?.predicted_concern || primaryConcern || 'None detected'}
              {aiResults && <span style={styles.aiBadge}>AI</span>}
            </p>
            <button style={styles.cardLinkBtn} onClick={() => navigateTo('/ai-analysis')}>
              View Analysis →
            </button>
          </div>

          <div style={styles.statCard}>
            <p style={styles.statCardLabel}>Hydration Level</p>
            <p style={{...styles.statCardValue, color: hydrationPct >= 80 ? '#10B981' : hydrationPct >= 50 ? '#F59E0B' : '#DC2626'}}>{hydrationLabel}</p>
            <p style={styles.hydrationSub}>{hydrationData || 0}L / {hydrationTarget}L</p>
            <div style={styles.hydrationBar}><div style={{...styles.hydrationFill, width: `${hydrationPct}%`}} /></div>
          </div>
        </div>

        {/* Week Streak Strip */}
        <div style={styles.weekStreakCard}>
          <div style={styles.weekStreakHeader}>
            <span style={styles.weekStreakTitle}>Weekly Progress</span>
            <span style={styles.weekStreakCount}>{streak} day streak</span>
          </div>
          <div style={styles.weekStrip}>
            {weekProgress.map((day, index) => (
              <div key={index} style={styles.weekDayItem}>
                <span style={styles.weekDayLabel}>{day.day}</span>
                <div style={{...styles.weekDayCircle, ...(day.completed ? styles.weekDayCompleted : styles.weekDayPending), ...(day.isToday ? styles.weekDayToday : {})}}>
                  {day.completed ? '✓' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content Grid - Rebalanced */}
        <div style={styles.contentGrid}>
          <div style={styles.leftColumn}>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Today's Routine</h3>
              {allRoutineSteps.length > 0 ? (
                allRoutineSteps.map((step) => (
                  <div key={step.id} style={styles.checklistItem}>
                    <span style={step.is_completed ? styles.checkIconDone : styles.checkIconPending}>
                      {step.is_completed ? '✓' : '○'}
                    </span>
                    <span style={step.is_completed ? styles.checklistTextDone : styles.checklistText}>
                      {step.step_category} — {step.step_description}
                    </span>
                  </div>
                ))
              ) : (
                <p style={styles.emptyText}>No routine yet. Complete an assessment to generate one.</p>
              )}
              <button style={styles.viewAllBtn} onClick={() => navigateTo('/routine')}>View Full Routine →</button>
            </div>

            {/* Score Breakdown moved here */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Score Breakdown</h3>
              {scoreData?.breakdown ? (
                <div style={styles.breakdownList}>
                  {Object.entries(scoreData.breakdown).map(([key, value]) => {
                    if (key === 'overall' || key === 'trend') return null;
                    return (
                      <div key={key} style={styles.breakdownRow}>
                        <span style={styles.breakdownLabel}>{key.replace(/_/g, ' ')}</span>
                        <div style={styles.breakdownBar}><div style={{...styles.breakdownFill, width: `${value}%`}} /></div>
                        <span style={styles.breakdownValue}>{Math.round(value)}%</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={styles.emptyText}>Complete your skin assessment to see your score breakdown.</p>
              )}
            </div>
          </div>

          <div style={styles.rightColumn}>
            {/* AI Suggested Routine moved here */}
            {aiResults && aiResults.routine_suggestions && aiResults.routine_suggestions.length > 0 && (
              <div style={{...styles.card, ...styles.aiCard}}>
                <h3 style={styles.cardTitle}>AI Suggested Routine</h3>
                {aiResults.routine_suggestions.map((step, i) => (
                  <div key={i} style={styles.checklistItem}>
                    <span style={styles.aiStepIcon}>✦</span>
                    <span style={styles.checklistText}>
                      <strong>{step.step}:</strong> {step.description}
                    </span>
                  </div>
                ))}
                <p style={styles.aiNote}>Based on AI analysis of your skin</p>
              </div>
            )}

            {/* AI Skin Insights */}
            <div style={{...styles.card, ...styles.insightCard}}>
              <h3 style={styles.cardTitle}>AI Skin Insights</h3>
              {insights.length > 0 ? (
                insights.map((insight, i) => (
                  <div key={i} style={{...styles.insightItem, ...(insight.isAI ? styles.insightItemAI : {})}}>
                    <span style={styles.insightIcon}>{insight.icon}</span>
                    <span style={styles.insightText}>{insight.text}</span>
                  </div>
                ))
              ) : (
                <p style={styles.emptyText}>Complete your skin assessment to see personalized insights here.</p>
              )}
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div style={styles.card}>
          <div style={styles.cardHeaderRow}>
            <h3 style={styles.cardTitle}>
              Recommended Products for You
              {aiResults && <span style={styles.aiBadge}>AI</span>}
            </h3>
            <button style={styles.viewAllBtn} onClick={() => navigateTo('/products')}>View All →</button>
          </div>
          {!productsLoaded ? (
            <p style={styles.emptyText}>Loading...</p>
          ) : (aiResults?.recommendations && aiResults.recommendations.length > 0) || recommendedProducts.length > 0 ? (
            <div style={styles.productGrid}>
              {(aiResults?.recommendations || recommendedProducts).slice(0, 5).map((p, idx) => (
                <div 
                  key={idx} 
                  style={styles.productCard}
                  onClick={() => navigate(`/products/${p.id}`)}
                  title="Click to view product details"
                >
                  <img 
                    src={getImageUrl(p.image_url) || 'https://via.placeholder.com/140x90/6C5CE7/ffffff?text=No+Image'} 
                    alt={p.name} 
                    style={styles.productImg}
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/140x90/6C5CE7/ffffff?text=No+Image'; }}
                  />
                  <p style={styles.productCardName}>{p.name}</p>
                  <p style={styles.productCardPrice}>${p.price?.toFixed(2) || 'N/A'}</p>
                  {p.ingredient_matched && (
                    <p style={styles.productMatch}>🔍 {p.ingredient_matched}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={styles.emptyText}>No recommendations yet — complete your assessment or AI analysis to get personalized product suggestions.</p>
          )}
        </div>
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
  quickActionsSidebar: { display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '12px' },
  quickActionSidebarItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', width: '100%', backgroundColor: 'transparent', color: '#778198', border: 'none', borderRadius: '14px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' },
  sidebarLogout: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', width: '100%', backgroundColor: 'transparent', color: '#DC2626', border: '1px solid #FCA5A5', borderRadius: '14px', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit', marginTop: 'auto', flexShrink: 0, whiteSpace: 'nowrap' },
  mainContent: { flex: 1, padding: '24px 32px', transition: 'margin-left 0.2s ease' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '15px' },
  pageTitle: { fontSize: '22px', color: '#17233C', margin: 0, fontWeight: '700' },
  pageSubtitle: { fontSize: '14px', color: '#778198', margin: '4px 0 0' },
  topBarRight: { display: 'flex', alignItems: 'center', gap: '14px' },
  exportBtn: { padding: '8px 16px', backgroundColor: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '16px', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', fontWeight: '600' },
  iconBtn: { background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '14px', width: '38px', height: '38px', cursor: 'pointer', fontSize: '16px' },
  dateChip: { background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '14px', padding: '8px 14px', fontSize: '13px', color: '#34415B' },
  profileChip: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatarCircle: { width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#E8E7FF', color: '#17233C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '15px' },
  profileName: { fontSize: '13px', fontWeight: '600', color: '#17233C' },
  profileRole: { fontSize: '11px', color: '#778198' },
  error: { backgroundColor: '#FEF2F2', color: '#DC2626', padding: '12px', borderRadius: '16px', marginBottom: '20px', textAlign: 'center', fontSize: '14px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' },
  statCard: { backgroundColor: '#FFFFFF', padding: '18px 20px', borderRadius: '16px', border: '1px solid #E5E7EB' },
  statCardHighlight: { border: '1px solid #6C63D9', backgroundColor: '#F8F7FF' },
  statCardLabel: { fontSize: '13px', color: '#778198', margin: '0 0 8px' },
  statCardValue: { fontSize: '18px', fontWeight: '700', color: '#17233C', margin: '0 0 8px' },
  aiBadge: { fontSize: '11px', backgroundColor: '#E8E7FF', color: '#6C63D9', padding: '2px 10px', borderRadius: '12px', marginLeft: '8px', fontWeight: '600' },
  scoreRow: { display: 'flex', justifyContent: 'center', alignItems: 'center' },
  scoreGaugeWrapper: { position: 'relative', width: '130px', height: '130px' },
  scoreGaugeCanvas: { width: '100%', height: '100%' },
  scoreGaugeCenter: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' },
  scoreBig: { fontSize: '32px', fontWeight: '700', color: '#6C63D9' },
  scoreOutOf: { fontSize: '12px', color: '#9CA3AF' },
  scoreRing: { fontSize: '28px' },
  cardLinkBtn: { background: 'none', border: 'none', color: '#6C63D9', fontSize: '12px', fontWeight: '600', cursor: 'pointer', padding: 0, marginTop: '8px', fontFamily: 'inherit' },
  hydrationSub: { fontSize: '12px', color: '#778198', margin: '0 0 8px' },
  hydrationBar: { height: '6px', backgroundColor: '#E5E7EB', borderRadius: '3px', overflow: 'hidden' },
  hydrationFill: { height: '100%', backgroundColor: '#6C63D9', borderRadius: '3px' },
  
  // Week Streak
  weekStreakCard: { backgroundColor: '#FFFFFF', padding: '16px 20px', borderRadius: '16px', border: '1px solid #E5E7EB', marginBottom: '20px' },
  weekStreakHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  weekStreakTitle: { fontSize: '14px', fontWeight: '600', color: '#17233C' },
  weekStreakCount: { fontSize: '13px', color: '#6C63D9', fontWeight: '600' },
  weekStrip: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  weekDayItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' },
  weekDayLabel: { fontSize: '11px', color: '#778198' },
  weekDayCircle: { width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '600' },
  weekDayCompleted: { backgroundColor: '#6C63D9', color: '#FFFFFF' },
  weekDayPending: { backgroundColor: '#F3F4F6', color: '#D1D5DB' },
  weekDayToday: { border: '2px solid #6C63D9' },

  contentGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' },
  leftColumn: { display: 'flex', flexDirection: 'column', gap: '20px' },
  rightColumn: { display: 'flex', flexDirection: 'column', gap: '20px' },
  card: { backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '16px', border: '1px solid #E5E7EB' },
  aiCard: { border: '1px solid #6C63D9', backgroundColor: '#F8F7FF' },
  insightCard: { backgroundColor: '#F8F7FF', border: '1px solid #E5E7EB' },
  cardHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #F3F4F6', paddingBottom: '10px' },
  cardTitle: { fontSize: '15px', fontWeight: '700', color: '#17233C', marginTop: 0, marginBottom: '14px', borderBottom: '1px solid #F3F4F6', paddingBottom: '10px' },
  insightItem: { display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '8px 0', borderBottom: '1px solid #F9FAFB', fontSize: '14px', color: '#17233C' },
  insightItemAI: { backgroundColor: '#EDE9FF', padding: '8px 10px', borderRadius: '16px', borderLeft: '3px solid #6C5CE7' },
  insightIcon: { fontSize: '16px' },
  insightText: { flex: 1 },
  checklistItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 0', fontSize: '14px', color: '#17233C' },
  checkIconPending: { color: '#D1D5DB', fontSize: '16px', width: '20px', textAlign: 'center' },
  checkIconDone: { color: '#6C63D9', fontSize: '16px', width: '20px', textAlign: 'center' },
  checklistText: { color: '#17233C' },
  checklistTextDone: { color: '#9CA3AF', textDecoration: 'line-through' },
  aiStepIcon: { color: '#6C63D9', fontSize: '14px', width: '20px', textAlign: 'center' },
  aiNote: { fontSize: '12px', color: '#778198', fontStyle: 'italic', marginTop: '8px' },
  breakdownList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  breakdownRow: { display: 'grid', gridTemplateColumns: '130px 1fr 40px', alignItems: 'center', gap: '10px', fontSize: '13px' },
  breakdownLabel: { color: '#34415B', textTransform: 'capitalize' },
  breakdownBar: { height: '6px', backgroundColor: '#E5E7EB', borderRadius: '3px', overflow: 'hidden' },
  breakdownFill: { height: '100%', backgroundColor: '#6C63D9', borderRadius: '3px' },
  breakdownValue: { color: '#778198', textAlign: 'right' },
  productGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' },
  productCard: { border: '1px solid #E5E7EB', borderRadius: '14px', padding: '12px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s ease', backgroundColor: '#FFFFFF' },
  productImg: { width: '100%', height: '100px', objectFit: 'cover', marginBottom: '8px', backgroundColor: '#FFFFFF', borderRadius: '4px' },
  productCardName: { fontSize: '13px', fontWeight: '500', color: '#17233C', margin: '0 0 4px', minHeight: '34px' },
  productCardPrice: { fontSize: '14px', fontWeight: '700', color: '#6C63D9', margin: 0 },
  productMatch: { fontSize: '10px', color: '#778198', marginTop: '4px' },
  viewAllBtn: { background: 'none', border: 'none', color: '#6C63D9', fontSize: '13px', cursor: 'pointer', padding: '4px 0 0', fontWeight: '600', fontFamily: 'inherit' },
  emptyText: { fontSize: '13px', color: '#778198', margin: 0, padding: '8px 0' },
  loadingContainer: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#F5F7FB' },
  loadingSpinner: { border: '4px solid #E5E7EB', borderTop: '4px solid #6C5CE7', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' },
  loadingText: { marginTop: '15px', color: '#778198', fontSize: '16px' },
};

const styleSheet = document.createElement('style');
styleSheet.textContent = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
document.head.appendChild(styleSheet);

export default MyDashboard;