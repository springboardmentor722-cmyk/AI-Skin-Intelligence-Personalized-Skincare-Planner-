import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { lifestyleAPI } from '../utils/api';
import '../styles/Lifestyle.css';

export default function Lifestyle() {
  const { user, loading } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    tracking_date: new Date().toISOString().split('T')[0],
    sleep_duration: '',
    sleep_quality: 'Good',
    water_intake: '',
    exercise_duration: '',
    exercise_type: 'Running',
    stress_level: 5,
    environmental_exposure: [],
    notes: '',
  });
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      const response = await lifestyleAPI.getHistory(7);
      setHistory(response.data);
    } catch (error) {
      console.log('No history found');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSlider = (value) => {
    setFormData((prev) => ({
      ...prev,
      stress_level: parseInt(value),
    }));
  };

  const handleCheckbox = (exposure) => {
    setFormData((prev) => {
      const list = prev.environmental_exposure;
      if (list.includes(exposure)) {
        return { ...prev, environmental_exposure: list.filter((e) => e !== exposure) };
      } else {
        return { ...prev, environmental_exposure: [...list, exposure] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await lifestyleAPI.log(formData);
      setMessage('Lifestyle logged successfully!');
      setFormData({
        tracking_date: new Date().toISOString().split('T')[0],
        sleep_duration: '',
        sleep_quality: 'Good',
        water_intake: '',
        exercise_duration: '',
        exercise_type: 'Running',
        stress_level: 5,
        environmental_exposure: [],
        notes: '',
      });
      setTimeout(() => setMessage(''), 3000);
      fetchHistory();
    } catch (error) {
      setMessage('Error logging data');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="lifestyle-container">
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>Track Your Lifestyle</h1>
        </div>
        <button onClick={() => navigate('/dashboard')} className="btn-back">
          ← Back to Dashboard
        </button>
      </nav>

      <div className="lifestyle-content">
        {message && <div className="success-message">{message}</div>}

        {/* Input Section */}
        <div className="input-section">
          <h2>Daily Lifestyle Tracking</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                name="tracking_date"
                value={formData.tracking_date}
                onChange={handleChange}
                required
              />
            </div>

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
                <label>Sleep Quality</label>
                <select
                  name="sleep_quality"
                  value={formData.sleep_quality}
                  onChange={handleChange}
                >
                  <option>Poor</option>
                  <option>Fair</option>
                  <option>Good</option>
                  <option>Excellent</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Water Intake (glasses)</label>
                <input
                  type="number"
                  name="water_intake"
                  value={formData.water_intake}
                  onChange={handleChange}
                  placeholder="e.g., 8"
                />
              </div>
              <div className="form-group">
                <label>Exercise Duration (minutes)</label>
                <input
                  type="number"
                  name="exercise_duration"
                  value={formData.exercise_duration}
                  onChange={handleChange}
                  placeholder="e.g., 30"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Exercise Type</label>
              <select
                name="exercise_type"
                value={formData.exercise_type}
                onChange={handleChange}
              >
                <option>Running</option>
                <option>Yoga</option>
                <option>Gym</option>
                <option>Walking</option>
                <option>Swimming</option>
                <option>Cycling</option>
                <option>Other</option>
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
                      onChange={() => handleCheckbox(exposure)}
                    />
                    {exposure}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any additional notes..."
                rows="3"
              ></textarea>
            </div>

            <button type="submit" className="btn-submit">
              Save Daily Log
            </button>
          </form>
        </div>

        {/* History Section */}
        <div className="history-section">
          <h2>Lifestyle History (Last 7 Days)</h2>
          
          {history.length > 0 ? (
            <div className="history-table">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Sleep</th>
                    <th>Water</th>
                    <th>Exercise</th>
                    <th>Stress</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((log) => (
                    <tr key={log.tracking_id}>
                      <td>{log.tracking_date}</td>
                      <td>{log.sleep_duration ? `${log.sleep_duration}h` : '-'}</td>
                      <td>{log.water_intake ? `${log.water_intake}/8` : '-'}</td>
                      <td>{log.exercise_duration ? `${log.exercise_duration}min` : '-'}</td>
                      <td>{log.stress_level ? `${log.stress_level}/10` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="empty-state">No lifestyle data logged yet. Start by logging today!</p>
          )}
        </div>
      </div>
    </div>
  );
}