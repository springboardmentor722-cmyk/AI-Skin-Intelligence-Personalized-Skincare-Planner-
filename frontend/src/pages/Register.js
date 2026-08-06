import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/Auth.css';

export default function Register() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Account Info
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: '',
    phone: '',
    age: '',
    gender: 'Male',
    // Step 2: Skin Info
    skin_type: 'Normal',
    skin_tone: '',
    allergies: '',
    sensitivities: '',
    skin_concerns: [],
    // Step 3: Lifestyle Info
    sleep_duration: '',
    water_intake: '',
    exercise_frequency: 'Never',
    stress_level: 5,
    environmental_exposure: [],
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckbox = (name, value) => {
    setFormData((prev) => {
      const list = prev[name];
      if (list.includes(value)) {
        return { ...prev, [name]: list.filter((item) => item !== value) };
      } else {
        return { ...prev, [name]: [...list, value] };
      }
    });
  };

  const handleSlider = (value) => {
    setFormData((prev) => ({
      ...prev,
      stress_level: parseInt(value),
    }));
  };

  const validateStep1 = () => {
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.password) {
      setError('Please fill all required fields');
      return false;
    }
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    setError('');
    return true;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await register(formData);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-box large">
        <h1>AI Skincare Intelligence</h1>
        <h2>Create Your Account</h2>

        {/* Step Indicator */}
        <div className="step-indicator">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>
            <span>1</span>
            <p>Account</p>
          </div>
          <div className={`step-line ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>
            <span>2</span>
            <p>Skin</p>
          </div>
          <div className={`step-line ${step >= 3 ? 'active' : ''}`}></div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>
            <span>3</span>
            <p>Lifestyle</p>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* STEP 1: ACCOUNT DETAILS */}
          {step === 1 && (
            <>
              <h3>Step 1 of 3: Account Details</h3>

              <div className="form-row">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Password *</label>
                  <div className="password-input">
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Confirm Password *</label>
                  <input
                    type="password"
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Age *</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Gender *</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={handleNextStep}
                className="btn-submit"
              >
                Next: Skin Information
              </button>
            </>
          )}

          {/* STEP 2: SKIN INFORMATION */}
          {step === 2 && (
            <>
              <h3>Step 2 of 3: Skin Information</h3>

              <div className="form-row">
                <div className="form-group">
                  <label>Skin Type *</label>
                  <select
                    name="skin_type"
                    value={formData.skin_type}
                    onChange={handleChange}
                  >
                    <option>Dry</option>
                    <option>Oily</option>
                    <option>Combination</option>
                    <option>Normal</option>
                    <option>Sensitive</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Skin Tone</label>
                  <select
                    name="skin_tone"
                    value={formData.skin_tone}
                    onChange={handleChange}
                  >
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
              </div>

              <div className="form-group">
                <label>Allergies</label>
                <textarea
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleChange}
                  placeholder="List any allergies (e.g., Latex, Perfume, Sulfates)"
                  rows="3"
                ></textarea>
              </div>

              <div className="form-group">
                <label>Sensitivities</label>
                <textarea
                  name="sensitivities"
                  value={formData.sensitivities}
                  onChange={handleChange}
                  placeholder="List any sensitivities (e.g., To fragrance, To alcohol)"
                  rows="3"
                ></textarea>
              </div>

              <div className="form-group">
                <label>Skin Concerns (Select all that apply)</label>
                <div className="checkbox-grid">
                  {['Acne', 'Wrinkles', 'Dry Skin', 'Dark Spots', 'Oily Skin', 'Redness', 'Sensitive Skin', 'Uneven Tone'].map((concern) => (
                    <label key={concern} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.skin_concerns.includes(concern)}
                        onChange={() => handleCheckbox('skin_concerns', concern)}
                      />
                      {concern}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-secondary"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="btn-submit"
                >
                  Next: Lifestyle
                </button>
              </div>
            </>
          )}

          {/* STEP 3: LIFESTYLE INFORMATION */}
          {step === 3 && (
            <>
              <h3>Step 3 of 3: Lifestyle Information</h3>

              <div className="form-row">
                <div className="form-group">
                  <label>Sleep Duration (hours)</label>
                  <input
                    type="number"
                    step="0.5"
                    name="sleep_duration"
                    value={formData.sleep_duration}
                    onChange={handleChange}
                    placeholder="e.g., 7.5"
                  />
                </div>
                <div className="form-group">
                  <label>Water Intake (glasses per day)</label>
                  <input
                    type="number"
                    name="water_intake"
                    value={formData.water_intake}
                    onChange={handleChange}
                    placeholder="e.g., 8"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Exercise Frequency</label>
                <select
                  name="exercise_frequency"
                  value={formData.exercise_frequency}
                  onChange={handleChange}
                >
                  <option>Never</option>
                  <option>1-2 times/week</option>
                  <option>3-4 times/week</option>
                  <option>Daily</option>
                </select>
              </div>

              <div className="form-group">
                <label>Stress Level: {formData.stress_level}/10</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.stress_level}
                  onChange={(e) => handleSlider(e.target.value)}
                  className="slider"
                />
                <div className="slider-labels">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>

              <div className="form-group">
                <label>Environmental Exposure</label>
                <div className="checkbox-grid">
                  {['High Sun', 'Pollution', 'Air Conditioning', 'Indoor Heating'].map((exposure) => (
                    <label key={exposure} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.environmental_exposure.includes(exposure)}
                        onChange={() => handleCheckbox('environmental_exposure', exposure)}
                      />
                      {exposure}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn-secondary"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-submit"
                >
                  {loading ? 'Creating Account...' : 'Complete Registration'}
                </button>
              </div>
            </>
          )}
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
}