// frontend/src/pages/ConsultantRoutines.js

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import ProfessionalSidebar from '../components/ProfessionalSidebar';
import '../styles/professional-theme.css';

function ConsultantRoutines() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('consultant');
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [routine, setRoutine] = useState({ AM: [], PM: [], Weekly: [] });
  const [selectedClientName, setSelectedClientName] = useState('');
  const [fetchingRoutine, setFetchingRoutine] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    const name = localStorage.getItem('userName');
    const role = localStorage.getItem('role') || 'consultant';
    setUserName(name || 'Consultant');
    setUserRole(role);
    fetchClients();

    if (location.state?.clientId) {
      setSelectedClient(location.state.clientId);
    }
  }, []);

  useEffect(() => {
    if (selectedClient) {
      fetchRoutine(selectedClient);
    }
  }, [selectedClient]);

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role') || 'consultant';
      
      let endpoint = '/consultant/reviews';
      if (role === 'dermatologist') {
        endpoint = '/dermatologist/patients';
      }

      const res = await api.get(endpoint, { params: { token } });
      const clientList = res.data || [];

      const enriched = [];
      for (const client of clientList) {
        try {
          const profileRes = await api.get('/user/profile', {
            params: { token, user_id: client.user_id }
          });
          enriched.push({
            ...client,
            profile: profileRes.data,
            displayName: profileRes.data?.full_name || client.user_name || 'Unknown'
          });
        } catch (e) {
          enriched.push({
            ...client,
            profile: null,
            displayName: client.user_name || 'Unknown'
          });
        }
      }
      setClients(enriched);

      if (location.state?.clientId) {
        const found = enriched.find(c => c.user_id === location.state.clientId);
        if (found) {
          setSelectedClient(found.user_id);
          setSelectedClientName(found.displayName);
        }
      }
      
      // Set loading to false after clients are fetched
      setLoading(false);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError('Could not load clients.');
      setLoading(false);
    }
  };

  const fetchRoutine = async (clientId) => {
    setFetchingRoutine(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role') || 'consultant';
      
      let endpoint = `/consultant/client/${clientId}/routine`;
      if (role === 'dermatologist') {
        endpoint = `/dermatologist/patient/${clientId}/treatment-plan`;
      }

      const res = await api.get(endpoint, { params: { token } });
      setRoutine(res.data || { AM: [], PM: [], Weekly: [] });
      
      const client = clients.find(c => c.user_id === clientId);
      if (client) {
        setSelectedClientName(client.displayName);
      }
    } catch (err) {
      console.error('Error fetching routine:', err);
      setError('Could not load routine. Please try again.');
    } finally {
      setFetchingRoutine(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const navigateTo = (path) => {
    navigate(path);
  };

  const timeSlots = ['AM', 'PM', 'Weekly'];
  
  // Dynamic labels
  const pageTitle = userRole === 'dermatologist' ? '📋 Treatment Plans' : '📋 Routine Plans';
  const pageSubtitle = userRole === 'dermatologist' ? 'View and manage patient treatment plans.' : 'View and manage client skincare routines.';
  const routineLabel = userRole === 'dermatologist' ? 'Treatment Plan' : 'Routine';
  const clientLabel = userRole === 'dermatologist' ? 'patient' : 'client';

  // Show loading only during initial fetch
  if (loading) {
    return (
      <div className="professional-loading-page">
        <div className="professional-loading-spinner"></div>
        <p>Loading {clientLabel}s...</p>
      </div>
    );
  }

  return (
    <div className={`professional-page role-${userRole}`}>
      <ProfessionalSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main className={`professional-main ${sidebarOpen ? '' : 'is-collapsed'}`}>
        <div className="professional-header">
          <div>
            <div className="professional-kicker">{userRole === 'dermatologist' ? 'TREATMENT PLANS' : 'ROUTINE PLANS'}</div>
            <h1 className="professional-title">{pageTitle}</h1>
            <p className="professional-subtitle">{pageSubtitle}</p>
          </div>
        </div>

        {error && <div className="professional-alert-error">{error}</div>}

        <div className="professional-surface">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#17233C' }}>
              Select {userRole === 'dermatologist' ? 'Patient' : 'Client'}:
            </label>
            <select
              value={selectedClient || ''}
              onChange={(e) => {
                const val = e.target.value;
                if (val) {
                  setSelectedClient(Number(val));
                  const client = clients.find(c => c.user_id === Number(val));
                  if (client) setSelectedClientName(client.displayName);
                } else {
                  setSelectedClient(null);
                  setSelectedClientName('');
                }
              }}
              style={{ padding: '10px 14px', border: '1px solid #DCE1EC', borderRadius: '12px', fontSize: '14px', fontFamily: 'inherit', minWidth: '200px', backgroundColor: '#FFFFFF' }}
            >
              <option value="">Choose a {userRole === 'dermatologist' ? 'patient' : 'client'}...</option>
              {clients.map((client) => (
                <option key={client.user_id} value={client.user_id}>
                  {client.displayName}
                </option>
              ))}
            </select>
            {fetchingRoutine && (
              <span style={{ fontSize: '13px', color: '#0d9488' }}>⏳ Loading {routineLabel.toLowerCase()}...</span>
            )}
          </div>
        </div>

        {selectedClient && !fetchingRoutine && (
          <>
            <div className="professional-surface">
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#17233C', marginBottom: '16px' }}>
                {routineLabel} for <span style={{ color: userRole === 'dermatologist' ? '#6c63d9' : '#0d9488' }}>{selectedClientName}</span>
              </h3>
              
              {timeSlots.map((time) => (
                <div key={time} style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #F0F2F6' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#34415B', marginBottom: '10px' }}>
                    {time === 'AM' ? '🌅 Morning' : time === 'PM' ? '🌙 Evening' : '📅 Weekly'}
                  </h4>
                  {routine[time]?.length > 0 ? (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {routine[time].map((step, index) => (
                        <li key={step.id || index} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid #F0F2F6', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: '600', color: userRole === 'dermatologist' ? '#6c63d9' : '#0d9488', fontSize: '13px', minWidth: '70px' }}>Step {step.step_number || index + 1}:</span>
                          <span style={{ fontWeight: '500', color: '#17233C', fontSize: '13px', minWidth: '100px' }}>{step.step_category}</span>
                          <span style={{ flex: 1, fontSize: '13px', color: '#34415B' }}>{step.step_description}</span>
                          <span style={step.is_completed ? { fontSize: '12px', color: '#0d9488' } : { fontSize: '12px', color: '#d97706' }}>
                            {step.is_completed ? '✅ Done' : '⏳ Pending'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ textAlign: 'center', color: '#778198', padding: '12px 0', fontSize: '14px' }}>
                      No steps for this time slot.
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="professional-surface">
              <p style={{ textAlign: 'center', color: '#778198', fontSize: '14px', fontStyle: 'italic' }}>
                💡 To modify a {userRole === 'dermatologist' ? "patient's treatment plan" : "client's routine"}, please use the {userRole === 'dermatologist' ? "patient's" : "client's"} dashboard or contact support.
              </p>
            </div>
          </>
        )}

        {selectedClient && fetchingRoutine && (
          <div className="professional-surface">
            <p style={{ textAlign: 'center', color: '#778198', padding: '20px 0', fontSize: '14px' }}>
              ⏳ Loading {routineLabel.toLowerCase()}...
            </p>
          </div>
        )}

        {!selectedClient && !fetchingRoutine && (
          <div className="professional-surface">
            <p style={{ textAlign: 'center', color: '#778198', padding: '20px 0', fontSize: '14px' }}>
              Select a {clientLabel} above to view their {routineLabel.toLowerCase()}.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default ConsultantRoutines;