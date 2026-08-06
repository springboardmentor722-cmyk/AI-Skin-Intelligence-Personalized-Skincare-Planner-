import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import { getUserAnalytics } from "../api/analytics";
import LoadingState from "../components/LoadingState";
import PageHeader from "../components/PageHeader";

function formatDate(value) {
  return new Date(value).toLocaleDateString();
}

export default function DermatologistPatients() {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [thread, setThread] = useState([]);
  const [messageBody, setMessageBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(null);

  // Advanced clinical workspace states
  const [patientAnalytics, setPatientAnalytics] = useState(null);
  const [patientRoutines, setPatientRoutines] = useState([]);
  const [savingRoutine, setSavingRoutine] = useState(false);
  const [transcribing, setTranscribing] = useState(false);

  const startVoiceNotesMock = () => {
    setTranscribing(true);
    setTimeout(() => {
      setMessageBody((prev) => {
        const text = "Routine compliance is excellent. Maintain Ceramides Repair Cream application PM to support recovery. Schedule a progress photo update in 7 days.";
        return prev ? `${prev}\n\n[Clinical Dictation]: ${text}` : `[Clinical Dictation]: ${text}`;
      });
      setTranscribing(false);
    }, 1200);
  };

  useEffect(() => {
    const loadPatients = async () => {
      try {
        const res = await api.get("/workspace/dermatologist/patients");
        setPatients(res.data);
        if (res.data.length > 0) {
          setSelectedPatientId(res.data[0].id);
        }
      } catch {
        setStatus({ type: "error", text: "Couldn't load patients for your workspace." });
      } finally {
        setLoading(false);
      }
    };

    loadPatients();
  }, []);

  useEffect(() => {
    if (!selectedPatientId) {
      setThread([]);
      setPatientAnalytics(null);
      setPatientRoutines([]);
      return;
    }

    const loadThreadAndAnalytics = async () => {
      setThreadLoading(true);
      try {
        const [threadRes, analyticsData, routineRes] = await Promise.all([
          api.get(`/workspace/dermatologist/patients/${selectedPatientId}/messages`),
          getUserAnalytics(selectedPatientId).catch(() => null),
          api.get(`/v1/routine?user_id=${selectedPatientId}`).catch(() => null)
        ]);
        
        setThread(threadRes.data);
        
        if (analyticsData) {
          setPatientAnalytics(analyticsData);
        } else {
          setPatientAnalytics(null);
        }

        if (routineRes && routineRes.data) {
          setPatientRoutines(routineRes.data.map(s => ({
            id: s.id,
            time_of_day: s.time_of_day,
            step_number: s.step_number,
            step_category: s.step_category
          })));
        } else {
          setPatientRoutines([]);
        }
      } catch {
        setStatus({ type: "error", text: "Couldn't load the message thread for this patient." });
      } finally {
        setThreadLoading(false);
      }
    };

    loadThreadAndAnalytics();
  }, [selectedPatientId]);

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.id === selectedPatientId) || null,
    [patients, selectedPatientId]
  );

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!selectedPatientId || !messageBody.trim()) return;

    setSending(true);
    setStatus(null);
    try {
      const res = await api.post(`/workspace/dermatologist/patients/${selectedPatientId}/messages`, {
        body: messageBody.trim(),
      });
      setThread((current) => [...current, res.data]);
      setPatients((current) =>
        current.map((patient) =>
          patient.id === selectedPatientId
            ? { ...patient, recent_messages: [...patient.recent_messages.slice(-2), res.data] }
            : patient
        )
      );
      setMessageBody("");
      setStatus({ type: "ok", text: "Message sent to the patient." });
    } catch {
      setStatus({ type: "error", text: "Couldn't send the message to this patient." });
    } finally {
      setSending(false);
    }
  };

  // Routine Overwrite handlers
  const handleAddRoutineStep = () => {
    setPatientRoutines(prev => [
      ...prev,
      {
        time_of_day: "AM",
        step_number: prev.length + 1,
        step_category: "Cleansing"
      }
    ]);
  };

  const handleRemoveRoutineStep = (index) => {
    setPatientRoutines(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleRoutineStepFieldChange = (index, field, value) => {
    setPatientRoutines(prev => {
      const copy = [...prev];
      copy[index][field] = value;
      return copy;
    });
  };

  const handleSaveRoutineOverwrite = async (e) => {
    e.preventDefault();
    if (!selectedPatientId) return;
    setSavingRoutine(true);
    setStatus(null);

    try {
      await api.put(`/v1/routine/user/${selectedPatientId}`, patientRoutines);
      setStatus({ type: "ok", text: `Skincare routine steps successfully updated for ${selectedPatient.full_name}!` });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setStatus({ type: "error", text: "Failed to overwrite routine steps. Ensure all fields are valid." });
    } finally {
      setSavingRoutine(false);
    }
  };

  // Get Baseline and Latest photos from history
  const baselinePhoto = useMemo(() => {
    const history = patientAnalytics?.photo_history || [];
    if (history.length === 0) return null;
    return history.find(p => p.tag === "Baseline") || history[0];
  }, [patientAnalytics]);

  const latestPhoto = useMemo(() => {
    const history = patientAnalytics?.photo_history || [];
    if (history.length <= 1) return null;
    return history.find(p => p.tag === "Latest") || history[history.length - 1];
  }, [patientAnalytics]);

  if (loading) return <LoadingState label="Loading patient workspace…" />;

  return (
    <div className="page" style={{ padding: "0 1rem" }}>
      <PageHeader
        eyebrow="Dermatologist workspace"
        title="Patient Workspace CRM"
        description="Review assigned patient progress and send direct messages from your separated dermatologist page."
      />

      {status && <div className={`status-msg ${status.type}`} style={{ marginBottom: "1.5rem" }}>{status.text}</div>}

      {patients.length === 0 ? (
        <div className="card empty-state">
          <h3>No patients assigned yet</h3>
          <p>Assigned patients and their progress will appear here once users connect to your dermatologist profile.</p>
        </div>
      ) : (
        <div className="workspace-grid" style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "1.5rem" }}>
          
          {/* Patient Sidebar */}
          <aside className="card workspace-sidebar" style={{ padding: "1.25rem" }}>
            <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>Assigned Patients</h3>
            <div className="workspace-list" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {patients.map((patient) => (
                <button
                  key={patient.id}
                  type="button"
                  className={`workspace-list-item${patient.id === selectedPatientId ? " active" : ""}`}
                  onClick={() => setSelectedPatientId(patient.id)}
                  style={{
                    textAlign: "left",
                    padding: "0.75rem",
                    border: "1px solid var(--color-border)",
                    borderRadius: "6px",
                    background: patient.id === selectedPatientId ? "var(--color-primary-tint)" : "var(--color-surface)",
                    borderLeft: patient.id === selectedPatientId ? "4px solid var(--color-primary)" : "1px solid var(--color-border)",
                    cursor: "pointer"
                  }}
                >
                  <strong style={{ display: "block", fontSize: "0.9rem", color: "var(--color-ink)" }}>{patient.full_name}</strong>
                  <span style={{ display: "block", fontSize: "0.75rem", color: "var(--color-ink-muted)" }}>{patient.email}</span>
                  <span className="workspace-list-note" style={{ display: "block", fontSize: "0.72rem", color: "var(--color-primary)", marginTop: "0.25rem" }}>
                    Status: {patient.latest_appointment_status || "Active"}
                  </span>
                </button>
              ))}
            </div>
          </aside>

          {/* Main workspace section */}
          {selectedPatient && (
            <div className="workspace-main" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              
              {/* Header Info Panel */}
              <div className="card" style={{ borderLeft: "4px solid var(--color-primary)", margin: 0, padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span className="eyebrow" style={{ textTransform: "uppercase", fontSize: "0.72rem" }}>Clinician Medical Record</span>
                    <h3 style={{ margin: "0.25rem 0", fontSize: "1.5rem", fontWeight: "800" }}>{selectedPatient.full_name}</h3>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-ink-muted)" }}>{selectedPatient.email}</p>
                  </div>
                  <span className="status-pill status-accepted" style={{ fontSize: "0.78rem", fontWeight: "bold" }}>Verified Active</span>
                </div>
              </div>

              {/* Photos & Compliance grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                
                {/* Photo Comparator */}
                <div className="card" style={{ margin: 0, padding: "1.25rem" }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: "800", marginBottom: "0.75rem" }}>🖼️ Clinical Photo Timeline</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", minHeight: "150px" }}>
                    <div style={{ background: "var(--color-surface-sunken)", borderRadius: "6px", overflow: "hidden", textAlign: "center", position: "relative" }}>
                      {baselinePhoto ? (
                        <img src={`http://localhost:8000${baselinePhoto.image_url}`} alt="Baseline" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ fontSize: "0.8rem", color: "var(--color-ink-muted)", padding: "2rem 1rem" }}>No Baseline uploaded.</div>
                      )}
                      <span style={{ position: "absolute", bottom: "0.5rem", left: "0.5rem", padding: "0.2rem 0.4rem", background: "rgba(0,0,0,0.6)", color: "#FFF", fontSize: "0.68rem", borderRadius: "3px", fontWeight: "bold" }}>BASELINE</span>
                    </div>
                    <div style={{ background: "var(--color-surface-sunken)", borderRadius: "6px", overflow: "hidden", textAlign: "center", position: "relative" }}>
                      {latestPhoto ? (
                        <img src={`http://localhost:8000${latestPhoto.image_url}`} alt="Current" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ fontSize: "0.8rem", color: "var(--color-ink-muted)", padding: "2rem 1rem" }}>No current photos.</div>
                      )}
                      <span style={{ position: "absolute", bottom: "0.5rem", left: "0.5rem", padding: "0.2rem 0.4rem", background: "rgba(0,0,0,0.6)", color: "#FFF", fontSize: "0.68rem", borderRadius: "3px", fontWeight: "bold" }}>CURRENT</span>
                    </div>
                  </div>
                </div>

                {/* Patient analytics details */}
                <div className="card" style={{ margin: 0, padding: "1.25rem", display: "flex", flexDirection: "column", justify_content: "space-between" }}>
                  <div>
                    <h3 style={{ fontSize: "1rem", fontWeight: "800", marginBottom: "0.75rem" }}>📊 Patient Metrics</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <div style={{ display: "flex", justify_content: "space-between", fontSize: "0.85rem" }}>
                        <span>Skin Type:</span>
                        <strong style={{ textTransform: "capitalize" }}>{selectedPatient.skin_profile?.skin_type || "Not set"}</strong>
                      </div>
                      <div style={{ display: "flex", justify_content: "space-between", fontSize: "0.85rem" }}>
                        <span>7-Day Compliance:</span>
                        <strong>{patientAnalytics?.compliance?.rolling_7_days !== null ? `${patientAnalytics?.compliance?.rolling_7_days}%` : "No data"}</strong>
                      </div>
                      <div style={{ display: "flex", justify_content: "space-between", fontSize: "0.85rem" }}>
                        <span>Concerns:</span>
                        <strong style={{ fontSize: "0.78rem" }}>{selectedPatient.skin_profile?.skin_concerns || "None"}</strong>
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: "0.78rem", background: "var(--color-surface-sunken)", padding: "0.5rem", borderRadius: "4px", color: "var(--color-ink-muted)" }}>
                    Verified medical connection between patient and clinician.
                  </div>
                </div>
              </div>

              {/* Routine Override Module */}
              <div className="card" style={{ margin: 0, padding: "1.5rem" }}>
                <h3 style={{ marginTop: 0, marginBottom: "0.5rem", fontSize: "1.1rem" }}>⚡ Routine Step Configuration Override</h3>
                <p style={{ fontSize: "0.8rem", color: "var(--color-ink-muted)", marginBottom: "1.25rem" }}>
                  Override the patient's daily checklist steps. This directly syncs with their user cockpit layout.
                </p>

                <form onSubmit={handleSaveRoutineOverwrite}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.25rem" }}>
                    {patientRoutines.map((step, idx) => (
                      <div key={idx} style={{ display: "flex", gap: "1rem", alignItems: "center", background: "var(--color-surface-sunken)", padding: "0.75rem 1rem", borderRadius: "8px" }}>
                        
                        <div style={{ width: "80px" }}>
                          <label style={{ fontSize: "0.72rem", color: "var(--color-ink-muted)" }}>Time of Day</label>
                          <select className="input" value={step.time_of_day} onChange={(e) => handleRoutineStepFieldChange(idx, "time_of_day", e.target.value)} style={{ padding: "0.3rem" }}>
                            <option value="AM">AM</option>
                            <option value="PM">PM</option>
                          </select>
                        </div>

                        <div style={{ width: "80px" }}>
                          <label style={{ fontSize: "0.72rem", color: "var(--color-ink-muted)" }}>Step Number</label>
                          <input type="number" className="input" value={step.step_number} onChange={(e) => handleRoutineStepFieldChange(idx, "step_number", Number(e.target.value))} style={{ padding: "0.3rem" }} />
                        </div>

                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: "0.72rem", color: "var(--color-ink-muted)" }}>Step Action Category</label>
                          <input type="text" className="input" value={step.step_category} onChange={(e) => handleRoutineStepFieldChange(idx, "step_category", e.target.value)} style={{ padding: "0.3rem" }} />
                        </div>

                        <button type="button" className="btn" onClick={() => handleRemoveRoutineStep(idx)} style={{ color: "var(--color-danger)", marginTop: "1rem" }}>
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", gap: "1rem" }}>
                    <button type="button" className="btn btn-secondary" onClick={handleAddRoutineStep}>
                      + Add Step Template
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={savingRoutine}>
                      {savingRoutine ? "Syncing..." : "Sync Routine Override"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Messages timeline thread */}
              <section className="section" style={{ margin: 0 }}>
                <h2 className="section-title">Clinical Message Coordination Thread</h2>
                <div className="card" style={{ padding: "1.5rem", margin: 0 }}>
                  {threadLoading ? (
                    <LoadingState label="Loading conversation…" />
                  ) : thread.length === 0 ? (
                    <div className="empty-chat" style={{ textAlign: "center", padding: "2rem" }}>
                      <h3>No messages yet</h3>
                      <p>Send the first message to start the conversation with this patient.</p>
                    </div>
                  ) : (
                    <div className="message-thread" style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "300px", overflowY: "auto", marginBottom: "1.5rem" }}>
                      {thread.map((message) => (
                        <div
                          key={message.id}
                          style={{
                            alignSelf: message.sender_user_id === selectedPatient.id ? "flex-start" : "flex-end",
                            background: message.sender_user_id === selectedPatient.id ? "var(--color-surface-sunken)" : "var(--color-primary-tint)",
                            padding: "0.6rem 0.85rem",
                            borderRadius: "8px",
                            maxWidth: "70%",
                            fontSize: "0.85rem"
                          }}
                        >
                          <strong style={{ display: "block", fontSize: "0.72rem", marginBottom: "0.2rem" }}>{message.sender_name}</strong>
                          <p style={{ margin: 0 }}>{message.body}</p>
                          <span style={{ display: "block", fontSize: "0.65rem", color: "var(--color-ink-faint)", marginTop: "0.3rem", textAlign: "right" }}>{new Date(message.created_at).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <form onSubmit={handleSendMessage} className="message-form">
                    <div className="field" style={{ marginBottom: "1rem" }}>
                      <div style={{ display: "flex", justify_content: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                        <label htmlFor="patientMessage" style={{ fontSize: "0.85rem", fontWeight: "700" }}>Send Message / Dictation Guidance</label>
                        <button type="button" className="btn btn-secondary" onClick={startVoiceNotesMock} disabled={transcribing} style={{ padding: "0.15rem 0.5rem", fontSize: "0.72rem" }}>
                          {transcribing ? "🎙️ Dictating..." : "🎙️ Dictation"}
                        </button>
                      </div>
                      <textarea
                        id="patientMessage"
                        rows="3"
                        value={messageBody}
                        onChange={(e) => setMessageBody(e.target.value)}
                        placeholder="Write clinical directions or verify concerns..."
                        className="input"
                        style={{ width: "100%" }}
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={sending || !messageBody.trim()}>
                      {sending ? "Sending..." : "Send Message"}
                    </button>
                  </form>
                </div>
              </section>

            </div>
          )}

        </div>
      )}
    </div>
  );
}
