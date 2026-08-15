// frontend/src/pages/DermatologistPrescriptions.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ProfessionalSidebar from '../components/ProfessionalSidebar';
import '../styles/professional-theme.css';

function DermatologistPrescriptions() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userName, setUserName] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    treatment_name: '',
    dosage: '',
    instructions: '',
    duration: '',
    notes: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    const name = localStorage.getItem('userName');
    setUserName(name || 'Dermatologist');
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/dermatologist/patients', { params: { token } });
      setPatients(res.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching patients:', err);
      setError('Could not load patients.');
      setLoading(false);
    }
  };

  const fetchPrescriptions = async (patientId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get(`/dermatologist/prescriptions/${patientId}`, { params: { token } });
      setPrescriptions(res.data || []);
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
      setPrescriptions([]);
    }
  };

  const handlePatientSelect = (e) => {
    const patientId = Number(e.target.value);
    setSelectedPatient(patientId);
    if (patientId) {
      fetchPrescriptions(patientId);
    } else {
      setPrescriptions([]);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatient) {
      setError('Please select a patient.');
      return;
    }
    if (!formData.treatment_name || !formData.dosage || !formData.instructions || !formData.duration) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      await api.post('/dermatologist/prescription', {
        patient_id: selectedPatient,
        ...formData
      }, { params: { token } });

      setSuccess('✅ Prescription created successfully!');
      setFormData({ treatment_name: '', dosage: '', instructions: '', duration: '', notes: '' });
      setShowForm(false);
      fetchPrescriptions(selectedPatient);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create prescription.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const navigateTo = (path) => {
    navigate(path);
  };

  if (loading) {
    return (
      <div className="professional-loading-page">
        <div className="professional-loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  const selectedPatientName = patients.find(p => p.user_id === selectedPatient)?.user_name || '';

  return (
    <div className="professional-page role-dermatologist">
      <ProfessionalSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main className={`professional-main ${sidebarOpen ? '' : 'is-collapsed'}`}>
        <div className="professional-header">
          <div>
            <div className="professional-kicker">PRESCRIPTIONS</div>
            <h1 className="professional-title">💊 Prescriptions</h1>
            <p className="professional-subtitle">Write and manage medical prescriptions for your patients.</p>
          </div>
          <button className="professional-primary-button" onClick={() => setShowForm(true)}>
            + New Prescription
          </button>
        </div>

        {error && <div className="professional-alert-error">{error}</div>}
        {success && <div className="professional-alert-success">{success}</div>}

        <div className="professional-surface">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#17233C' }}>Select Patient:</label>
            <select
              value={selectedPatient || ''}
              onChange={handlePatientSelect}
              style={{ padding: '10px 14px', border: '1px solid #DCE1EC', borderRadius: '12px', fontSize: '14px', fontFamily: 'inherit', minWidth: '250px', backgroundColor: '#FFFFFF' }}
            >
              <option value="">Choose a patient...</option>
              {patients.map((patient) => (
                <option key={patient.user_id} value={patient.user_id}>
                  {patient.user_name || patient.profile?.full_name || 'Unknown'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {showForm && selectedPatient && (
          <div className="professional-surface" style={{ border: '2px solid #6c63d9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #F0F2F6', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#17233C', margin: 0 }}>📝 New Prescription</h3>
              <button style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#778198' }} onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="professional-field" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#34415B', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Patient</label>
                  <input
                    type="text"
                    value={selectedPatientName}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #DCE1EC', borderRadius: '12px', fontSize: '14px', fontFamily: 'inherit', backgroundColor: '#FBFCFE' }}
                    disabled
                  />
                </div>
                <div className="professional-field">
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#34415B', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Treatment Name *</label>
                  <input
                    type="text"
                    name="treatment_name"
                    placeholder="e.g., Tretinoin 0.05%"
                    value={formData.treatment_name}
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #DCE1EC', borderRadius: '12px', fontSize: '14px', fontFamily: 'inherit' }}
                    required
                  />
                </div>
                <div className="professional-field">
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#34415B', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Dosage *</label>
                  <input
                    type="text"
                    name="dosage"
                    placeholder="e.g., Apply pea-sized amount nightly"
                    value={formData.dosage}
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #DCE1EC', borderRadius: '12px', fontSize: '14px', fontFamily: 'inherit' }}
                    required
                  />
                </div>
                <div className="professional-field" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#34415B', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Instructions *</label>
                  <textarea
                    name="instructions"
                    placeholder="Detailed instructions for the patient..."
                    value={formData.instructions}
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #DCE1EC', borderRadius: '12px', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical', minHeight: '80px' }}
                    rows="2"
                    required
                  />
                </div>
                <div className="professional-field">
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#34415B', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Duration *</label>
                  <input
                    type="text"
                    name="duration"
                    placeholder="e.g., 3 months, 6 weeks"
                    value={formData.duration}
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #DCE1EC', borderRadius: '12px', fontSize: '14px', fontFamily: 'inherit' }}
                    required
                  />
                </div>
                <div className="professional-field">
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#34415B', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Notes</label>
                  <input
                    type="text"
                    name="notes"
                    placeholder="Additional notes..."
                    value={formData.notes}
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #DCE1EC', borderRadius: '12px', fontSize: '14px', fontFamily: 'inherit' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" style={{ padding: '10px 20px', backgroundColor: '#F5F7FB', color: '#778198', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }} onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#6c63d9', color: '#FFFFFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit', fontWeight: '600' }} disabled={submitting}>
                  {submitting ? 'Saving...' : '💾 Save Prescription'}
                </button>
              </div>
            </form>
          </div>
        )}

        {selectedPatient && (
          <div className="professional-surface">
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#17233C', marginTop: 0, marginBottom: '16px', borderBottom: '1px solid #E7EAF1', paddingBottom: '12px' }}>
              📋 Prescriptions for {selectedPatientName}
            </h3>
            {prescriptions.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#778198', padding: '20px 0', fontSize: '14px' }}>No prescriptions found for this patient.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {prescriptions.map((prescription, i) => (
                  <div key={i} style={{ backgroundColor: '#F5F7FB', padding: '16px', borderRadius: '12px', border: '1px solid #E7EAF1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '16px', fontWeight: '600', color: '#17233C' }}>{prescription.treatment_name}</span>
                      <span style={{ fontSize: '12px', color: '#778198' }}>
                        {new Date(prescription.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '14px', color: '#34415B' }}>
                      <div><strong>Dosage:</strong> {prescription.dosage}</div>
                      <div><strong>Instructions:</strong> {prescription.instructions}</div>
                      <div><strong>Duration:</strong> {prescription.duration}</div>
                      {prescription.notes && <div><strong>Notes:</strong> {prescription.notes}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default DermatologistPrescriptions;