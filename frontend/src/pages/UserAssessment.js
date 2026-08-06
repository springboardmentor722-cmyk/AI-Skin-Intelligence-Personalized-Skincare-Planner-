import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { profileAPI, lifestyleAPI } from '../utils/api';
import '../styles/Assessment.css';

export default function UserAssessment() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    // Step 1: Skin Profile
    skin_type: 'Normal',
    skin_tone: '',
    allergies: '',
    sensitivities: '',
    
    // Step 2: Skin Concerns
    acne: false,
    wrinkles: false,
    dry_skin: false,
    dark_spots: false,
    oily_skin: false,
    redness: false,
    sensitive_skin: false,
    uneven_tone: false,
    
    // Step 3: Lifestyle
    sleep_duration: '',
    water_intake: '',
    exercise_frequency: 'Never',
    stress_level: 5,
    environmental_exposure: []
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name === 'environmental_exposure') {
        setFormData(prev => ({
          ...prev,
          environmental_exposure: checked
            ? [...prev.environmental_exposure, value]
            : prev.environmental_exposure.filter(e => e !== value)
        }));
      } else {
        setFormData(prev => ({ ...prev, [name]: checked }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSlider = (value) => {
    setFormData(prev => ({ ...prev, stress_level: parseInt(value) }));
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    if (!token) {
      setError('Not authenticated. Please login again.');
      setLoading(false);
      return;
    }

    // Create profile with token in header
    const profileResponse = await fetch('http://127.0.0.1:8000/api/profile/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        skin_type: formData.skin_type,
        skin_tone: formData.skin_tone,
        allergies: formData.allergies,
        sensitivities: formData.sensitivities
      })
    });

    if (!profileResponse.ok) {
      throw new Error(`Profile creation failed: ${profileResponse.status}`);
    }

    // Save lifestyle with token in header
    const today = new Date().toISOString().split('T')[0];
    const lifestyleResponse = await fetch('http://127.0.0.1:8000/api/lifestyle/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        tracking_date: today,
        sleep_duration: formData.sleep_duration ? parseFloat(formData.sleep_duration) : null,
        sleep_quality: 'Good',
        water_intake: formData.water_intake ? parseInt(formData.water_intake) : null,
        exercise_duration: 0,
        exercise_type: formData.exercise_frequency,
        stress_level: formData.stress_level,
        environmental_exposure: formData.environmental_exposure.join(', '),
        notes: ''
      })
    });

    if (!lifestyleResponse.ok) {
      throw new Error(`Lifestyle logging failed: ${lifestyleResponse.status}`);
    }

    // Redirect to dashboard
    navigate('/user/dashboard');
  } catch (err) {
    setError(err.message || 'Error saving assessment');
    console.error('Assessment error:', err);
  }

  setLoading(false);
};

  return (
    <div className="assessment-container">
      <div className="assessment-card">
        <h1>Skin Assessment</h1>
        <p>Let's understand your skin better</p>

        {/* Step Indicator */}
        <div className="step-indicator">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>
            <span>1</span>
            <p>Skin Info</p>
          </div>
          <div className={`step-line ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>
            <span>2</span>
            <p>Concerns</p>
          </div>
          <div className={`step-line ${step >= 3 ? 'active' : ''}`}></div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>
            <span>3</span>
            <p>Lifestyle</p>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* STEP 1: SKIN INFORMATION */}
          {step === 1 && (
            <>
              <h3>Step 1: Skin Information</h3>

              <div className="form-group">
                <label>Skin Type *</label>
                <select name="skin_type" value={formData.skin_type} onChange={handleChange}>
                  <option>Dry</option>
                  <option>Oily</option>
                  <option>Combination</option>
                  <option>Normal</option>
                  <option>Sensitive</option>
                </select>
              </div>

              <div className="form-group">
                <label>Skin Tone</label>
                <select name="skin_tone" value={formData.skin_tone} onChange={handleChange}>
                  <option value="">Select Skin Tone</option>
                  <option>Very Fair</option>
                  <option>Fair</option>
                  <option>Light</option>
                  <option>Medium</option>
                  <option>Tan</option>
                  <option>Dark</option>
                  <option>Very Dark</option>
                </select>
              </div>

              <div className="form-group">
                <label>Allergies</label>
                <textarea name="allergies" value={formData.allergies} onChange={handleChange}
                  placeholder="List any allergies..." rows="3"></textarea>
              </div>

              <div className="form-group">
                <label>Sensitivities</label>
                <textarea name="sensitivities" value={formData.sensitivities} onChange={handleChange}
                  placeholder="List any sensitivities..." rows="3"></textarea>
              </div>

              <div className="form-actions">
                <button type="button" onClick={handleNext} className="btn btn-primary">
                  Next: Concerns →
                </button>
              </div>
            </>
          )}

          {/* STEP 2: SKIN CONCERNS */}
          {step === 2 && (
            <>
              <h3>Step 2: Skin Concerns</h3>
              <p>Select all that apply</p>

              <div className="checkbox-grid">
                {['acne', 'wrinkles', 'dry_skin', 'dark_spots', 'oily_skin', 'redness', 'sensitive_skin', 'uneven_tone'].map(concern => (
                  <label key={concern} className="checkbox-label">
                    <input type="checkbox" name={concern} checked={formData[concern]} onChange={handleChange} />
                    {concern.replace(/_/g, ' ').toUpperCase()}
                  </label>
                ))}
              </div>

              <div className="form-actions">
                <button type="button" onClick={handleBack} className="btn btn-secondary">
                  ← Back
                </button>
                <button type="button" onClick={handleNext} className="btn btn-primary">
                  Next: Lifestyle →
                </button>
              </div>
            </>
          )}

          {/* STEP 3: LIFESTYLE */}
          {step === 3 && (
            <>
              <h3>Step 3: Lifestyle Information</h3>

              <div className="form-row">
                <div className="form-group">
                  <label>Sleep Duration (hours)</label>
                  <input type="number" step="0.5" name="sleep_duration" value={formData.sleep_duration} onChange={handleChange} placeholder="e.g., 7.5" />
                </div>
                <div className="form-group">
                  <label>Water Intake (glasses/day)</label>
                  <input type="number" name="water_intake" value={formData.water_intake} onChange={handleChange} placeholder="e.g., 8" />
                </div>
              </div>

              <div className="form-group">
                <label>Exercise Frequency</label>
                <select name="exercise_frequency" value={formData.exercise_frequency} onChange={handleChange}>
                  <option>Never</option>
                  <option>1-2 times/week</option>
                  <option>3-4 times/week</option>
                  <option>Daily</option>
                </select>
              </div>

              <div className="form-group">
                <label>Stress Level: {formData.stress_level}/10</label>
                <input type="range" min="1" max="10" value={formData.stress_level} onChange={(e) => handleSlider(e.target.value)} className="slider" />
                <div className="slider-labels">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>

              <div className="form-group">
                <label>Environmental Exposure</label>
                <div className="checkbox-grid">
                  {['High Sun', 'Pollution', 'Air Conditioning', 'Indoor Heating'].map(exposure => (
                    <label key={exposure} className="checkbox-label">
                      <input type="checkbox" value={exposure} checked={formData.environmental_exposure.includes(exposure)} onChange={handleChange} name="environmental_exposure" />
                      {exposure}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={handleBack} className="btn btn-secondary">
                  ← Back
                </button>
                <button type="submit" disabled={loading} className="btn btn-primary">
                  {loading ? 'Completing...' : 'Complete Assessment'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}