// frontend/src/pages/SkinAssessment.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import PatientSidebar from '../components/PatientSidebar';
import '../styles/patient-theme.css';

function SkinAssessment() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [resultsData, setResultsData] = useState(null);
  const [formData, setFormData] = useState({
    skin_type: '',
    skin_concerns: [],
    sleep_hours: '',
    water_intake: '',
    exercise: '',
    stress: '',
    sun_exposure: '',
  });

  // ============================================================
  // SKIN TYPE DATA WITH IMAGES
  // ============================================================
  const skinTypes = [
    {
      value: 'Oily',
      image: '/images/types/oilyskin.png',
      desc: 'Excess sebum, shiny appearance'
    },
    {
      value: 'Dry',
      image: '/images/types/dryskin.png',
      desc: 'Flaky, tight, rough texture'
    },
    {
      value: 'Combination',
      image: '/images/types/combination.png',
      desc: 'Oily T-zone, dry cheeks'
    },
    {
      value: 'Sensitive',
      image: '/images/types/sensitive.png',
      desc: 'Easily irritated, redness prone'
    },
    {
      value: 'Normal',
      image: '/images/types/normal.png',
      desc: 'Balanced, healthy skin'
    },
  ];

  // ============================================================
  // SKIN CONCERNS WITH IMAGES
  // ============================================================
  const skinConcerns = [
    { value: 'Acne', image: '/images/concerns/acne.jpeg' },
    { value: 'Dark Spots', image: '/images/concerns/darkspots.jpeg' },
    { value: 'Pigmentation', image: '/images/concerns/pigmentation.png' },
    { value: 'Pores', image: '/images/concerns/pores.png' },
    { value: 'Redness', image: '/images/concerns/redness.png' },
    { value: 'Wrinkles', image: '/images/concerns/wrinkles.jpeg' },
  ];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    api.get('/skin-profile', { params: { token } })
      .catch(() => navigate('/profile'));

    const checkAssessment = async () => {
      try {
        const response = await api.get('/api/v1/assessment/score', { params: { token } });
        if (response.data && response.data.score > 0) {
          setShowResults(true);
          setResultsData(response.data);
        }
      } catch (err) {
        console.log('No assessment found - starting new assessment');
      }
    };
    checkAssessment();

    const saved = localStorage.getItem('assessment_draft');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(parsed);
      } catch (e) {}
    }
  }, [navigate]);

  useEffect(() => {
    localStorage.setItem('assessment_draft', JSON.stringify(formData));
  }, [formData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleConcernToggle = (concern) => {
    setFormData(prev => {
      const concerns = prev.skin_concerns || [];
      if (concerns.includes(concern)) {
        return { ...prev, skin_concerns: concerns.filter(c => c !== concern) };
      } else {
        return { ...prev, skin_concerns: [...concerns, concern] };
      }
    });
  };

  const nextStep = () => {
    if (step === 1 && !formData.skin_type) {
      setError('Please select your skin type.');
      return;
    }
    if (step === 2 && (!formData.skin_concerns || formData.skin_concerns.length === 0)) {
      setError('Please select at least one skin concern.');
      return;
    }
    if (step === 3 && (!formData.sleep_hours || !formData.water_intake)) {
      setError('Please fill in sleep and water intake.');
      return;
    }
    setError('');
    setStep(step + 1);
  };

  const prevStep = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');

      // FIRST: Get the existing profile
      const profileRes = await api.get('/skin-profile', { params: { token } });
      const existingProfile = profileRes.data;

      // SECOND: Send ALL fields with updated values from form
      await api.put('/skin-profile', {
        full_name: existingProfile.full_name || '',
        age: existingProfile.age || 0,
        gender: existingProfile.gender || '',
        contact_number: existingProfile.contact_number || '',
        skin_type: formData.skin_type,
        skin_concerns: formData.skin_concerns.join(', '),
        water_intake: parseFloat(formData.water_intake) || 0,
        sleep_duration: parseFloat(formData.sleep_hours) || 0,
        exercise_habits: formData.exercise || '',
        stress_level: formData.stress || '',
        environmental_exposure: formData.sun_exposure || '',
        image_data: existingProfile.image_data || '',
      }, { params: { token } });

      // Run the assessment - scoring engine reads from profile
      await api.post('/api/v1/assessment/evaluate', {}, { params: { token } });

      localStorage.removeItem('assessment_draft');
      navigate('/dashboard');
    } catch (err) {
      console.error('Assessment error:', err);
      let errorMsg = 'Assessment failed. Please ensure your profile is complete.';
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') {
          errorMsg = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          errorMsg = err.response.data.detail.map(d => d.msg || JSON.stringify(d)).join(', ');
        }
      } else if (err.message) {
        errorMsg = err.message;
      }
      setError(errorMsg);
      setLoading(false);
    }
  };

  const handleRetakeAssessment = () => {
    setShowResults(false);
    setResultsData(null);
    setStep(1);
    setFormData({
      skin_type: '',
      skin_concerns: [],
      sleep_hours: '',
      water_intake: '',
      exercise: '',
      stress: '',
      sun_exposure: '',
    });
  };

  const totalSteps = 5;
  const progress = ((step - 1) / totalSteps) * 100;

  if (showResults && resultsData) {
    return (
      <div className="patient-page">
        <PatientSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className={`patient-main ${sidebarOpen ? '' : 'is-collapsed'}`}>
          <header className="patient-header">
            <div><p className="patient-kicker">SKIN ASSESSMENT</p><h1 className="patient-title">Understand your skin</h1><p className="patient-subtitle">Complete each step to create a clearer picture of your skin health.</p></div>
          </header>
          <div style={styles.card}>
            <div style={styles.resultsIcon}>◍</div>
            <h2 style={styles.stepTitle}>Your Assessment Results</h2>
            <p style={styles.stepDesc}>Here&apos;s a summary of your skin health assessment.</p>

            <div style={styles.resultsCard}>
              <div style={styles.resultScore}>
                <span style={styles.resultScoreNumber}>{resultsData.score}</span>
                <span style={styles.resultScoreLabel}>/100</span>
              </div>

              <div style={styles.resultDetails}>
                <div style={styles.resultDetailRow}>
                  <span style={styles.resultDetailLabel}>Detected Concerns</span>
                  <span style={styles.resultDetailValue}>
                    {resultsData.detected_concerns?.length > 0
                      ? resultsData.detected_concerns.join(', ')
                      : 'No concerns detected'}
                  </span>
                </div>

                {resultsData.breakdown && (
                  <div style={styles.breakdownSection}>
                    <h4 style={styles.breakdownTitle}>Score Breakdown</h4>
                    {Object.entries(resultsData.breakdown).map(([key, value]) => {
                      if (key === 'overall' || key === 'trend') return null;
                      const label = key.replace('_', ' ');
                      return (
                        <div key={key} style={styles.breakdownRow}>
                          <span style={styles.breakdownLabel}>
                            {label.charAt(0).toUpperCase() + label.slice(1)}
                          </span>
                          <div style={styles.breakdownBar}>
                            <div style={{ ...styles.breakdownFill, width: `${value}%` }} />
                          </div>
                          <span style={styles.breakdownValue}>{Math.round(value)}%</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div style={styles.buttonRow}>
              <button style={styles.buttonSecondary} onClick={handleRetakeAssessment}>
                ↻ Retake Assessment
              </button>
              <button style={styles.buttonPrimary} onClick={() => navigate('/dashboard')}>
                Go to Dashboard →
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="patient-page">
      <PatientSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <main className={`patient-main ${sidebarOpen ? '' : 'is-collapsed'}`}>
        <header className="patient-header">
          <div><p className="patient-kicker">SKIN ASSESSMENT</p><h1 className="patient-title">Understand your skin</h1><p className="patient-subtitle">Complete each step to create a clearer picture of your skin health.</p></div>
        </header>
        <div style={styles.card}>
          <div style={styles.progressContainer}>
            <div style={{ ...styles.progressBar, width: `${progress}%` }} />
            <div style={styles.stepLabel}>Step {step} of {totalSteps}</div>
          </div>

          {error && <div style={styles.error}>{error}</div>}

          {step === 1 && (
            <div>
              <h2 style={styles.stepTitle}>Step 1: Select Your Skin Type</h2>
              <p style={styles.stepDesc}>Choose the skin type that best describes your skin.</p>
              <div style={styles.skinTypeGrid}>
                {skinTypes.map(function (type) {
                  const isActive = formData.skin_type === type.value;
                  return (
                    <button
                      key={type.value}
                      style={{
                        ...styles.choiceCard,
                        ...(isActive ? styles.choiceCardActive : {})
                      }}
                      onClick={function () { setFormData(function (prev) { return { ...prev, skin_type: type.value }; }); }}
                    >
                      <div style={styles.choiceImageWrapper}>
                        <img
                          src={type.image}
                          alt={type.value}
                          style={styles.choiceImage}
                          onError={function (e) {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                      <div style={styles.choiceCaption}>
                        <span style={styles.choiceName}>{type.value}</span>
                        <span style={styles.choiceDesc}>{type.desc}</span>
                      </div>
                      {isActive && <span style={styles.choiceCheck}>✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 style={styles.stepTitle}>Step 2: Select Your Skin Concerns</h2>
              <p style={styles.stepDesc}>Select all skin concerns that apply to you.</p>
              <div style={styles.concernGrid}>
                {skinConcerns.map(function (concern) {
                  var isSelected = formData.skin_concerns && formData.skin_concerns.indexOf(concern.value) !== -1;
                  return (
                    <button
                      key={concern.value}
                      style={{
                        ...styles.choiceCard,
                        ...(isSelected ? styles.choiceCardActive : {})
                      }}
                      onClick={function () { handleConcernToggle(concern.value); }}
                    >
                      <div style={styles.choiceImageWrapper}>
                        <img
                          src={concern.image}
                          alt={concern.value}
                          style={styles.choiceImage}
                          onError={function (e) {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                      <div style={styles.choiceCaption}>
                        <span style={styles.choiceName}>{concern.value}</span>
                      </div>
                      {isSelected && <span style={styles.choiceCheck}>✓</span>}
                    </button>
                  );
                })}
              </div>
              {formData.skin_concerns && formData.skin_concerns.length > 0 && (
                <p style={styles.selectedCount}>Selected: {formData.skin_concerns.length} concerns</p>
              )}
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 style={styles.stepTitle}>Step 3: Sleep & Hydration</h2>
              <p style={styles.stepDesc}>Tell us about your daily habits.</p>
              <div style={styles.row}>
                <div style={styles.field}>
                  <label style={styles.label}>Average sleep (hours per night) *</label>
                  <input
                    type="number"
                    name="sleep_hours"
                    value={formData.sleep_hours}
                    onChange={handleChange}
                    placeholder="e.g., 7.5"
                    style={styles.input}
                    step="0.5"
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Daily water intake (liters) *</label>
                  <input
                    type="number"
                    name="water_intake"
                    value={formData.water_intake}
                    onChange={handleChange}
                    placeholder="e.g., 2.0"
                    style={styles.input}
                    step="0.1"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 style={styles.stepTitle}>Step 4: Lifestyle & Environment</h2>
              <p style={styles.stepDesc}>These factors affect your skin health.</p>
              <div style={styles.field}>
                <label style={styles.label}>Exercise habits *</label>
                <select name="exercise" value={formData.exercise} onChange={handleChange} style={styles.select}>
                  <option value="">Select</option>
                  <option value="Daily">Daily</option>
                  <option value="3-4 times a week">3-4 times a week</option>
                  <option value="1-2 times a week">1-2 times a week</option>
                  <option value="Rarely">Rarely</option>
                  <option value="Never">Never</option>
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Stress level *</label>
                <select name="stress" value={formData.stress} onChange={handleChange} style={styles.select}>
                  <option value="">Select</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Very High">Very High</option>
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Sun exposure (unprotected) *</label>
                <select name="sun_exposure" value={formData.sun_exposure} onChange={handleChange} style={styles.select}>
                  <option value="">Select</option>
                  <option value="Low">Low</option>
                  <option value="Moderate">Moderate</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <h2 style={styles.stepTitle}>Step 5: Review & Submit</h2>
              <p style={styles.stepDesc}>Please review your answers before submitting.</p>
              <div style={styles.reviewCard}>
                <div style={styles.reviewRow}><span style={styles.reviewLabel}>Skin Type</span><span>{formData.skin_type || 'Not provided'}</span></div>
                <div style={styles.reviewRow}><span style={styles.reviewLabel}>Concerns</span><span>{formData.skin_concerns && formData.skin_concerns.length > 0 ? formData.skin_concerns.join(', ') : 'Not provided'}</span></div>
                <div style={styles.reviewRow}><span style={styles.reviewLabel}>Sleep</span><span>{formData.sleep_hours || 'Not provided'} hours</span></div>
                <div style={styles.reviewRow}><span style={styles.reviewLabel}>Water</span><span>{formData.water_intake || 'Not provided'} liters</span></div>
                <div style={styles.reviewRow}><span style={styles.reviewLabel}>Exercise</span><span>{formData.exercise || 'Not provided'}</span></div>
                <div style={styles.reviewRow}><span style={styles.reviewLabel}>Stress</span><span>{formData.stress || 'Not provided'}</span></div>
                <div style={styles.reviewRow}><span style={styles.reviewLabel}>Sun Exposure</span><span>{formData.sun_exposure || 'Not provided'}</span></div>
              </div>
              <button style={styles.submitButton} onClick={handleSubmit} disabled={loading}>
                {loading ? 'Analyzing…' : '◎ Submit Assessment'}
              </button>
            </div>
          )}

          <div style={styles.buttonRow}>
            {step > 1 && (
              <button onClick={prevStep} style={styles.buttonSecondary}>
                ← Back
              </button>
            )}
            {step < totalSteps && (
              <button onClick={nextStep} style={styles.buttonPrimary}>
                Next →
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: '#FFFFFF',
    padding: '30px',
    borderRadius: '20px',
    boxShadow: '0 14px 38px rgba(23,35,60,0.07)',
    maxWidth: '960px',
    width: '100%',
    border: '1px solid #E7EAF1',
    boxSizing: 'border-box',
  },
  resultsIcon: {
    width: '52px',
    height: '52px',
    display: 'grid',
    placeItems: 'center',
    marginBottom: '16px',
    borderRadius: '16px',
    backgroundColor: '#EEECFF',
    color: '#6C63D9',
    fontSize: '24px',
  },
  progressContainer: {
    backgroundColor: '#F0F1F6',
    borderRadius: '20px',
    height: '20px',
    marginBottom: '24px',
    position: 'relative',
    overflow: 'hidden',
  },
  progressBar: {
    backgroundColor: '#6C63D9',
    height: '100%',
    borderRadius: '20px',
    transition: 'width 0.4s ease',
  },
  stepLabel: {
    position: 'absolute',
    top: '0',
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '11px',
    fontWeight: '700',
    color: '#17233C',
    lineHeight: '20px',
  },
  stepTitle: {
    fontSize: '22px',
    color: '#17233C',
    marginTop: 0,
    marginBottom: '8px',
    fontWeight: '800',
    letterSpacing: '-0.4px',
  },
  stepDesc: {
    fontSize: '14px',
    color: '#778198',
    marginBottom: '22px',
    lineHeight: '1.6',
  },
  error: {
    backgroundColor: '#FFF1F2',
    color: '#B63B49',
    padding: '13px 15px',
    borderRadius: '12px',
    marginBottom: '20px',
    textAlign: 'center',
    fontSize: '13px',
    border: '1px solid #F1B7BD',
  },
  resultsCard: {
    backgroundColor: '#F8F9FC',
    padding: '24px',
    borderRadius: '16px',
    border: '1px solid #E7EAF1',
    marginBottom: '20px',
  },
  resultScore: {
    textAlign: 'center',
    padding: '16px 0',
  },
  resultScoreNumber: {
    fontSize: '64px',
    fontWeight: '800',
    color: '#17233C',
    letterSpacing: '-2px',
  },
  resultScoreLabel: {
    fontSize: '24px',
    color: '#778198',
  },
  resultDetails: {
    marginTop: '16px',
  },
  resultDetailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    padding: '10px 0',
    borderBottom: '1px solid #E7EAF1',
    fontSize: '14px',
  },
  resultDetailLabel: {
    fontWeight: '700',
    color: '#778198',
  },
  resultDetailValue: {
    fontWeight: '700',
    color: '#17233C',
    textAlign: 'right',
  },
  breakdownSection: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #E7EAF1',
  },
  breakdownTitle: {
    fontSize: '15px',
    fontWeight: '800',
    color: '#17233C',
    marginBottom: '14px',
  },
  skinTypeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
  },
  concernGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
  },
  choiceCard: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    border: '2px solid #E7EAF1',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease',
    fontFamily: 'inherit',
    overflow: 'hidden',
    padding: 0,
    boxShadow: '0 7px 20px rgba(23,35,60,0.05)',
  },
  choiceCardActive: {
    borderColor: '#6C63D9',
    boxShadow: '0 0 0 4px rgba(108,99,217,0.12), 0 14px 28px rgba(23,35,60,0.10)',
  },
  choiceImageWrapper: {
    width: '100%',
    height: '160px',
    display: 'grid',
    placeItems: 'center',
    overflow: 'hidden',
    background: 'linear-gradient(135deg, #F0EFFF, #EDF8F6)',
  },
  choiceImage: {
    maxWidth: '100%',
    maxHeight: '100%',
    width: 'auto',
    height: 'auto',
    objectFit: 'contain',
    display: 'block',
  },
  choiceCaption: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    padding: '13px 14px 15px',
    textAlign: 'left',
  },
  choiceName: {
    fontSize: '14px',
    fontWeight: '850',
    color: '#17233C',
  },
  choiceDesc: {
    fontSize: '11px',
    color: '#778198',
    lineHeight: '1.5',
  },
  choiceCheck: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    width: '25px',
    height: '25px',
    display: 'grid',
    placeItems: 'center',
    borderRadius: '50%',
    backgroundColor: '#6C63D9',
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: '900',
    boxShadow: '0 4px 10px rgba(108,99,217,0.4)',
  },
  selectedCount: {
    marginTop: '16px',
    fontSize: '13px',
    fontWeight: '700',
    color: '#6C63D9',
    textAlign: 'center',
  },
  row: {
    display: 'flex',
    gap: '18px',
    flexWrap: 'wrap',
  },
  field: {
    flex: 1,
    minWidth: '200px',
    marginBottom: '15px',
  },
  label: {
    fontSize: '12px',
    fontWeight: '800',
    color: '#34415B',
    marginBottom: '7px',
    display: 'block',
  },
  input: {
    width: '100%',
    padding: '13px 14px',
    border: '1px solid #DCE1EC',
    borderRadius: '11px',
    fontSize: '14px',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    backgroundColor: '#FBFCFE',
    color: '#17233C',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  select: {
    width: '100%',
    padding: '13px 14px',
    border: '1px solid #DCE1EC',
    borderRadius: '11px',
    fontSize: '14px',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    backgroundColor: '#FBFCFE',
    color: '#17233C',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  reviewCard: {
    backgroundColor: '#F8F9FC',
    borderRadius: '16px',
    padding: '20px 22px',
    marginBottom: '22px',
    border: '1px solid #E7EAF1',
  },
  reviewRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    padding: '10px 0',
    borderBottom: '1px solid #E7EAF1',
    fontSize: '14px',
    color: '#17233C',
  },
  reviewLabel: {
    fontWeight: '800',
    color: '#778198',
  },
  submitButton: {
    width: '100%',
    padding: '16px',
    backgroundColor: '#6C63D9',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '800',
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 10px 22px rgba(108,99,217,0.28)',
    transition: 'background-color 0.2s',
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '24px',
    gap: '12px',
  },
  buttonPrimary: {
    padding: '13px 30px',
    backgroundColor: '#6C63D9',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '11px',
    fontSize: '14px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontWeight: '800',
    boxShadow: '0 10px 22px rgba(108,99,217,0.22)',
  },
  buttonSecondary: {
    padding: '13px 30px',
    backgroundColor: '#FFFFFF',
    color: '#17233C',
    border: '1px solid #DCE1EC',
    borderRadius: '11px',
    fontSize: '14px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontWeight: '700',
  },
  breakdownRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '8px',
    gap: '12px',
  },
  breakdownLabel: {
    fontSize: '13px',
    color: '#778198',
    minWidth: '70px',
  },
  breakdownBar: {
    flex: 1,
    height: '7px',
    backgroundColor: '#E7EAF1',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  breakdownFill: {
    height: '100%',
    backgroundColor: '#6C63D9',
    borderRadius: '4px',
    transition: 'width 1s ease',
  },
  breakdownValue: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#17233C',
    minWidth: '30px',
    textAlign: 'right',
  },
};

export default SkinAssessment;