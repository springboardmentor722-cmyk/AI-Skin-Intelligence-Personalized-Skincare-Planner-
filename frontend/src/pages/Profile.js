import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { profileAPI } from '../utils/api';
import '../styles/Profile.css';

export default function Profile() {
  const { user, loading } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const response = await profileAPI.get();
      setProfile(response.data);
      setFormData(response.data);
    } catch (error) {
      setProfile(null);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      const response = await profileAPI.update(formData);
      setProfile(response.data);
      setIsEditing(false);
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error updating profile');
    }
  };

  const handleCreate = async () => {
    try {
      const response = await profileAPI.create(formData);
      setProfile(response.data);
      setIsEditing(false);
      setMessage('Profile created successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error creating profile');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="profile-container">
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>My Skin Profile</h1>
        </div>
        <button onClick={() => navigate('/dashboard')} className="btn-back">
          ← Back to Dashboard
        </button>
      </nav>

      <div className="profile-content">
        {message && <div className="success-message">{message}</div>}

        {profile && !isEditing ? (
          <div className="profile-display">
            <h2>Your Skin Profile</h2>
            
            <div className="profile-section">
              <h3>User Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Name:</span>
                  <span className="value">{user.first_name} {user.last_name}</span>
                </div>
                <div className="info-item">
                  <span className="label">Email:</span>
                  <span className="value">{user.email}</span>
                </div>
                <div className="info-item">
                  <span className="label">Age:</span>
                  <span className="value">{user.age || 'Not set'}</span>
                </div>
                <div className="info-item">
                  <span className="label">Gender:</span>
                  <span className="value">{user.gender || 'Not set'}</span>
                </div>
              </div>
            </div>

            <div className="profile-section">
              <h3>Skin Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Skin Type:</span>
                  <span className="value">{profile.skin_type}</span>
                </div>
                <div className="info-item">
                  <span className="label">Skin Tone:</span>
                  <span className="value">{profile.skin_tone || 'Not set'}</span>
                </div>
                <div className="info-item full-width">
                  <span className="label">Allergies:</span>
                  <span className="value">{profile.allergies || 'None'}</span>
                </div>
                <div className="info-item full-width">
                  <span className="label">Sensitivities:</span>
                  <span className="value">{profile.sensitivities || 'None'}</span>
                </div>
              </div>
            </div>

            <div className="profile-actions">
              <button onClick={() => setIsEditing(true)} className="btn-primary">
                Edit Profile
              </button>
              <button onClick={() => navigate('/dashboard')} className="btn-secondary">
                Back
              </button>
            </div>
          </div>
        ) : profile ? (
          <div className="profile-edit">
            <h2>Edit Skin Profile</h2>
            
            <div className="form-group">
              <label>Skin Type</label>
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
                value={formData.skin_tone || ''}
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

            <div className="form-group">
              <label>Allergies</label>
              <textarea
                name="allergies"
                value={formData.allergies || ''}
                onChange={handleChange}
                placeholder="List any allergies"
                rows="3"
              ></textarea>
            </div>

            <div className="form-group">
              <label>Sensitivities</label>
              <textarea
                name="sensitivities"
                value={formData.sensitivities || ''}
                onChange={handleChange}
                placeholder="List any sensitivities"
                rows="3"
              ></textarea>
            </div>

            <div className="profile-actions">
              <button onClick={handleSave} className="btn-primary">
                Save Changes
              </button>
              <button onClick={() => setIsEditing(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="profile-create">
            <h2>Create Your Skin Profile</h2>
            
            <div className="form-group">
              <label>Skin Type</label>
              <select
                name="skin_type"
                value={formData.skin_type || 'Normal'}
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
                value={formData.skin_tone || ''}
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

            <div className="form-group">
              <label>Allergies (Optional)</label>
              <textarea
                name="allergies"
                value={formData.allergies || ''}
                onChange={handleChange}
                placeholder="List any allergies"
                rows="3"
              ></textarea>
            </div>

            <div className="form-group">
              <label>Sensitivities (Optional)</label>
              <textarea
                name="sensitivities"
                value={formData.sensitivities || ''}
                onChange={handleChange}
                placeholder="List any sensitivities"
                rows="3"
              ></textarea>
            </div>

            <div className="profile-actions">
              <button onClick={handleCreate} className="btn-primary">
                Create Profile
              </button>
              <button onClick={() => navigate('/dashboard')} className="btn-secondary">
                Skip
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}