// frontend/src/pages/MyRoutine.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import PatientSidebar from '../components/PatientSidebar';
import '../styles/patient-theme.css';

function MyRoutine() {
  const navigate = useNavigate();
  const [routineData, setRoutineData] = useState({ AM: [], PM: [], Weekly: [] });
  const [aiRoutine, setAiRoutine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchRoutine();
    fetchAiRoutine();
  }, [navigate]);

  const fetchRoutine = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/v1/routine', {
        params: { token }
      });
      setRoutineData(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching routine:', err);
      setError('Could not load your routine. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAiRoutine = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/v1/ai-analysis/latest', { params: { token } });
      if (response.data && response.data.has_results && response.data.routine_suggestions) {
        setAiRoutine(response.data.routine_suggestions);
      }
    } catch (err) {
      console.error('AI Routine fetch error:', err);
    }
  };

  const toggleStep = async (stepId) => {
    try {
      const token = localStorage.getItem('token');
      await api.post('/api/v1/routine/toggle', null, {
        params: { token, step_id: stepId }
      });
      const response = await api.get('/api/v1/routine', {
        params: { token }
      });
      setRoutineData(response.data);
    } catch (err) {
      console.error('Toggle error:', err);
      alert('Failed to update routine step. Please try again.');
    }
  };

  const navigateTo = (path) => {
    navigate(path);
  };

  if (loading) {
    return (
      <div className="patient-loading-page">
        <div className="patient-loading-spinner"></div>
        <p>Loading your routine...</p>
      </div>
    );
  }

  const hasRoutineSteps = routineData.AM.length > 0 || routineData.PM.length > 0 || routineData.Weekly.length > 0;

  return (
    <div className="patient-page">
      <PatientSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main className={`patient-main ${sidebarOpen ? '' : 'is-collapsed'}`}>
        <div className="patient-header">
          <div>
            <div className="patient-kicker">MY ROUTINE</div>
            <h1 className="patient-title">📋 Your Skincare Routine</h1>
            <p className="patient-subtitle">Follow your personalized routine to achieve healthier skin.</p>
          </div>
        </div>

        {error && <div className="patient-alert-error">{error}</div>}

        {aiRoutine && aiRoutine.length > 0 && (
          <div className="patient-surface" style={{ border: '2px solid #6C63D9', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#17233C', marginTop: 0, marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid #E7EAF1' }}>
              🤖 AI Suggested Routine
            </h3>
            <p style={{ fontSize: '13px', color: '#778198', marginTop: '-6px', marginBottom: '16px', fontStyle: 'italic' }}>
              Based on your AI skin analysis
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {aiRoutine.map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', backgroundColor: '#F5F7FB', borderRadius: '12px', border: '1px solid #E7EAF1' }}>
                  <span style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#6C63D9', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', flexShrink: 0 }}>{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#17233C' }}>{step.step}</span>
                    <span style={{ display: 'block', fontSize: '13px', color: '#778198' }}>{step.description}</span>
                  </div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: '12px', color: '#778198', fontStyle: 'italic', marginTop: '12px', textAlign: 'center' }}>
              💡 These steps are recommended based on your AI analysis results
            </p>
          </div>
        )}

        {hasRoutineSteps ? (
          <>
            <div className="patient-surface" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#17233C', marginTop: 0, marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid #E7EAF1' }}>
                🌅 Morning (AM)
              </h3>
              {routineData.AM && routineData.AM.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {routineData.AM.map((step) => (
                    <li key={step.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 0', borderBottom: '1px solid #F0F2F6' }}>
                      <input
                        type="checkbox"
                        checked={step.is_completed || false}
                        onChange={() => toggleStep(step.id)}
                        style={{ marginTop: '3px', width: '18px', height: '18px', cursor: 'pointer', flexShrink: 0, accentColor: '#6C63D9' }}
                      />
                      <span style={step.is_completed ? { fontSize: '14px', color: '#9AA3B5', textDecoration: 'line-through', lineHeight: '1.5' } : { fontSize: '14px', color: '#17233C', lineHeight: '1.5' }}>
                        <strong>Step {step.step_number}:</strong> {step.step_category} – {step.step_description}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ fontSize: '14px', color: '#778198', textAlign: 'center', padding: '20px 0' }}>No morning routine steps yet.</p>
              )}
            </div>

            <div className="patient-surface" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#17233C', marginTop: 0, marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid #E7EAF1' }}>
                🌙 Evening (PM)
              </h3>
              {routineData.PM && routineData.PM.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {routineData.PM.map((step) => (
                    <li key={step.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 0', borderBottom: '1px solid #F0F2F6' }}>
                      <input
                        type="checkbox"
                        checked={step.is_completed || false}
                        onChange={() => toggleStep(step.id)}
                        style={{ marginTop: '3px', width: '18px', height: '18px', cursor: 'pointer', flexShrink: 0, accentColor: '#6C63D9' }}
                      />
                      <span style={step.is_completed ? { fontSize: '14px', color: '#9AA3B5', textDecoration: 'line-through', lineHeight: '1.5' } : { fontSize: '14px', color: '#17233C', lineHeight: '1.5' }}>
                        <strong>Step {step.step_number}:</strong> {step.step_category} – {step.step_description}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ fontSize: '14px', color: '#778198', textAlign: 'center', padding: '20px 0' }}>No evening routine steps yet.</p>
              )}
            </div>

            <div className="patient-surface" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#17233C', marginTop: 0, marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid #E7EAF1' }}>
                📅 Weekly Highlights
              </h3>
              {routineData.Weekly && routineData.Weekly.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {routineData.Weekly.map((step) => (
                    <li key={step.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 0', borderBottom: '1px solid #F0F2F6' }}>
                      <input
                        type="checkbox"
                        checked={step.is_completed || false}
                        onChange={() => toggleStep(step.id)}
                        style={{ marginTop: '3px', width: '18px', height: '18px', cursor: 'pointer', flexShrink: 0, accentColor: '#6C63D9' }}
                      />
                      <span style={step.is_completed ? { fontSize: '14px', color: '#9AA3B5', textDecoration: 'line-through', lineHeight: '1.5' } : { fontSize: '14px', color: '#17233C', lineHeight: '1.5' }}>
                        <strong>Step {step.step_number}:</strong> {step.step_category} – {step.step_description}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ fontSize: '14px', color: '#778198', textAlign: 'center', padding: '20px 0' }}>No weekly steps yet.</p>
              )}
            </div>
          </>
        ) : (
          <div className="patient-surface" style={{ textAlign: 'center', padding: '50px 20px' }}>
            <p style={{ fontSize: '48px', marginBottom: '10px' }}>📋</p>
            <p style={{ fontSize: '18px', fontWeight: '600', color: '#17233C' }}>No routine yet</p>
            <p style={{ fontSize: '14px', color: '#778198' }}>Complete your skin assessment to generate a personalized routine.</p>
            <button className="patient-primary-button" onClick={() => navigateTo('/assessment')} style={{ marginTop: '16px', padding: '12px 32px' }}>
              Take Assessment
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default MyRoutine;