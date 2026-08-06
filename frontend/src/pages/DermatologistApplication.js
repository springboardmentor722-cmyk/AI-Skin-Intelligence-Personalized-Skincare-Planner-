import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/Application.css';

export default function DermatologistApplication() {
  const [formData, setFormData] = useState({
    license_number: '',
    specialization: '',
    hospital_name: '',
    years_experience: '',
    bio: '',
    consultation_fee: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // TODO: Call API to save dermatologist profile
      // await dermatologistAPI.createProfile(formData)
      
      console.log("Dermatologist application:", formData);
      
      // For now, just redirect
      navigate('/dermatologist/dashboard');
    } catch (err) {
      setError(err.message || 'Error submitting application');
    }

    setLoading(false);
  };

  return (
    <div className="application-container">
      <div className="application-card">
        <h1>Professional Profile</h1>
        <p>Complete your dermatologist profile</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>License Number *</label>
            <input type="text" name="license_number" value={formData.license_number} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Specialization</label>
            <input type="text" name="specialization" value={formData.specialization} onChange={handleChange} placeholder="e.g., Cosmetic Dermatology" />
          </div>

          <div className="form-group">
            <label>Hospital/Clinic Name</label>
            <input type="text" name="hospital_name" value={formData.hospital_name} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Years of Experience</label>
            <input type="number" name="years_experience" value={formData.years_experience} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Consultation Fee ($)</label>
            <input type="number" step="0.01" name="consultation_fee" value={formData.consultation_fee} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Bio</label>
            <textarea name="bio" value={formData.bio} onChange={handleChange} placeholder="Tell us about yourself..." rows="4"></textarea>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Submitting...' : 'Complete Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}