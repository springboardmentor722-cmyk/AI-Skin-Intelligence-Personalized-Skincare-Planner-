import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { getUserAnalytics } from "../api/analytics";
import LoadingState from "../components/LoadingState";
import PageHeader from "../components/PageHeader";

function formatDate(value) {
  return new Date(value).toLocaleDateString();
}

export default function ConsultantCustomers() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [recommendationNotes, setRecommendationNotes] = useState("");
  const [savingRec, setSavingRec] = useState(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const navigate = useNavigate();

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  // Patient Analytics & Routine Overwrite states
  const [patientAnalytics, setPatientAnalytics] = useState(null);
  const [patientRoutines, setPatientRoutines] = useState([]);
  const [savingRoutine, setSavingRoutine] = useState(false);

  // Simulated Voice-to-Text states
  const [transcribing, setTranscribing] = useState(false);

  const startVoiceNotesMock = () => {
    setTranscribing(true);
    setTimeout(() => {
      setRecommendationNotes((prev) => {
        const text = "Patient exhibits mild dehydration on the T-zone. Recommended addition of a lightweight Hyaluronic Acid serum in the morning steps to retain skin barrier water content.";
        return prev ? `${prev}\n\n[Voice Note]: ${text}` : `[Voice Note]: ${text}`;
      });
      setTranscribing(false);
    }, 1500);
  };

  // Load initial patient and catalog data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [patientsRes, catalogRes] = await Promise.all([
          api.get("/workspace/consultant/patients"),
          api.get("/recommendations/").catch(() => ({ data: { recommendations: [] } }))
        ]);
        
        setCustomers(patientsRes.data);
        if (patientsRes.data.length > 0) {
          setSelectedCustomerId(patientsRes.data[0].id);
        }
        
        if (catalogRes.data?.recommendations) {
          setCatalogProducts(catalogRes.data.recommendations);
        }
      } catch (err) {
        setStatus({ type: "error", text: "Couldn't load workspace data." });
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Fetch active patient's recommended products, routines, and analytics when patient changes
  useEffect(() => {
    if (!selectedCustomerId) return;
    
    const fetchPatientData = async () => {
      try {
        // Fetch recommendations
        const recRes = await api.get(`/recommendations/user/${selectedCustomerId}`).catch(() => null);
        if (recRes && recRes.data) {
          setSelectedProductIds(recRes.data.products?.map(p => p.id) || []);
          setRecommendationNotes(recRes.data.notes || "");
        } else {
          setSelectedProductIds([]);
          setRecommendationNotes("");
        }

        // Fetch routines
        const routineRes = await api.get(`/v1/routine?user_id=${selectedCustomerId}`).catch(() => null);
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

        // Fetch analytics
        const analyticsData = await getUserAnalytics(selectedCustomerId).catch(() => null);
        if (analyticsData) {
          setPatientAnalytics(analyticsData);
        } else {
          setPatientAnalytics(null);
        }
      } catch (err) {
        setSelectedProductIds([]);
        setRecommendationNotes("");
        setPatientRoutines([]);
        setPatientAnalytics(null);
      }
    };

    fetchPatientData();
  }, [selectedCustomerId]);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId) || null,
    [customers, selectedCustomerId]
  );

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [customers, searchQuery]);

  const handleMessageDermatologist = (dermatologistId) => {
    navigate("/consultant/dermatologists", { state: { preSelectedDermatologistId: dermatologistId } });
  };

  const handleToggleProduct = (prodId) => {
    setSelectedProductIds((prev) =>
      prev.includes(prodId) ? prev.filter((id) => id !== prodId) : [...prev, prodId]
    );
  };

  const handleSaveRecommendations = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId) return;
    setSavingRec(true);
    setStatus(null);

    try {
      await api.post(`/recommendations/user/${selectedCustomerId}`, {
        product_ids: selectedProductIds,
        notes: recommendationNotes
      });
      setStatus({ type: "ok", text: `Recommendations saved successfully for ${selectedCustomer.full_name}!` });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setStatus({ type: "error", text: "Failed to save recommendations. Try again." });
    } finally {
      setSavingRec(false);
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
    if (!selectedCustomerId) return;
    setSavingRoutine(true);
    setStatus(null);

    try {
      await api.put(`/v1/routine/user/${selectedCustomerId}`, patientRoutines);
      setStatus({ type: "ok", text: `Skincare routine overwritten successfully for ${selectedCustomer.full_name}!` });
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

  if (loading) return <LoadingState label="Loading customer workspace…" />;

  return (
    <div className="page" style={{ padding: "0 1rem" }}>
      <PageHeader
        eyebrow="Consultant workspace"
        title="Customer CRM Dashboard"
        description="Monitor patient routine compliance, review photo progress, and prescribe clinical routine overrides."
      />

      {status && (
        <div className={`status-msg ${status.type}`} style={{ marginBottom: "1.5rem" }}>
          {status.text}
        </div>
      )}

      {customers.length === 0 ? (
        <div className="card empty-state">
          <h3>No customers registered yet</h3>
          <p>Customer profiles will show up here once they register and complete their assessments.</p>
        </div>
      ) : (
        <div className="workspace-grid" style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "1.5rem" }}>
          
          {/* Searchable Sidebar */}
          <aside className="card workspace-sidebar" style={{ padding: "1.25rem" }}>
            <h3 style={{ marginTop: 0, marginBottom: "0.75rem" }}>Customer Queue</h3>
            <input
              type="text"
              placeholder="Filter by name/email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: "100%", padding: "0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", marginBottom: "1.25rem" }}
            />
            <div className="workspace-list" style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "500px", overflowY: "auto" }}>
              {filteredCustomers.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`workspace-list-item${c.id === selectedCustomerId ? " active" : ""}`}
                  onClick={() => setSelectedCustomerId(c.id)}
                  style={{
                    textAlign: "left",
                    padding: "0.75rem",
                    border: "1px solid var(--color-border)",
                    borderRadius: "6px",
                    background: c.id === selectedCustomerId ? "var(--color-primary-tint)" : "var(--color-surface)",
                    borderLeft: c.id === selectedCustomerId ? "4px solid var(--color-primary)" : "1px solid var(--color-border)",
                    cursor: "pointer"
                  }}
                >
                  <strong style={{ display: "block", fontSize: "0.9rem", color: "var(--color-ink)" }}>{c.full_name}</strong>
                  <span style={{ display: "block", fontSize: "0.75rem", color: "var(--color-ink-muted)" }}>{c.email}</span>
                  {c.latest_score !== null && (
                    <span style={{ fontSize: "0.78rem", color: "var(--color-primary)", fontWeight: "700", marginTop: "0.25rem", display: "inline-block" }}>
                      Score: {c.latest_score}/100
                    </span>
                  )}
                </button>
              ))}
            </div>
          </aside>

          {/* Customer Workspace Main Panel */}
          {selectedCustomer && (
            <div className="workspace-main" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              
              {/* Header Info Banner */}
              <div className="card" style={{ borderLeft: "4px solid var(--color-primary)", margin: 0, padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <span className="eyebrow" style={{ textTransform: "uppercase", fontSize: "0.72rem", fontWeight: "700" }}>Active Patient CRM File</span>
                    <h3 style={{ margin: "0.25rem 0", fontSize: "1.5rem", fontWeight: "800" }}>{selectedCustomer.full_name}</h3>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-ink-muted)" }}>{selectedCustomer.email}</p>
                  </div>
                  {selectedCustomer.latest_score !== null && (
                    <div style={{ textAlign: "right" }}>
                      <span className="eyebrow" style={{ textTransform: "uppercase", fontSize: "0.72rem", fontWeight: "700" }}>Skin Score</span>
                      <div style={{ fontSize: "2rem", fontWeight: "800", color: "var(--color-primary)" }}>
                        {selectedCustomer.latest_score}/100
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Photos comparison carousel */}
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "1.5rem" }}>
                
                {/* Photo Comparator */}
                <div className="card" style={{ margin: 0, padding: "1.25rem" }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: "800", marginBottom: "0.75rem" }}>🖼️ Before & After Gallery</h3>
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

                {/* Secure consultation room escalation */}
                <div className="card" style={{ margin: 0, padding: "1.25rem", display: "flex", flexDirection: "column", justify_content: "space-between" }}>
                  <div>
                    <h3 style={{ fontSize: "1rem", fontWeight: "800", marginBottom: "0.5rem" }}>🩺 Doctor Connection</h3>
                    <p style={{ fontSize: "0.8rem", color: "var(--color-ink-muted)", lineHeight: 1.4 }}>
                      If patient compliance shows warning metrics, escalate the file to the assigned dermatologist.
                    </p>
                  </div>
                  {selectedCustomer.assigned_dermatologist_id ? (
                    <button 
                      type="button" 
                      onClick={() => handleMessageDermatologist(selectedCustomer.assigned_dermatologist_id)} 
                      className="btn btn-primary btn-block"
                    >
                      Open Escalate Room
                    </button>
                  ) : (
                    <div style={{ fontSize: "0.78rem", color: "var(--color-ink-faint)", background: "var(--color-surface-sunken)", padding: "0.5rem", borderRadius: "4px" }}>
                      No dermatologist linked to this user profile.
                    </div>
                  )}
                </div>
              </div>

              {/* Rolling Adherence & Skin Profile Metrics */}
              <div className="card" style={{ margin: 0, padding: "1.5rem" }}>
                <h3 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1.1rem" }}>📋 Compliance & Skin Matrix</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem" }}>
                  <div style={{ padding: "1rem", background: "var(--color-bg)", borderRadius: "var(--radius-md)" }}>
                    <span style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: "700", color: "var(--color-ink-muted)" }}>7-Day Compliance</span>
                    <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "var(--color-primary)", marginTop: "0.25rem" }}>
                      {patientAnalytics?.compliance?.rolling_7_days !== null ? `${patientAnalytics?.compliance?.rolling_7_days}%` : "No data"}
                    </div>
                  </div>
                  <div style={{ padding: "1rem", background: "var(--color-bg)", borderRadius: "var(--radius-md)" }}>
                    <span style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: "700", color: "var(--color-ink-muted)" }}>30-Day Compliance</span>
                    <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "var(--color-primary)", marginTop: "0.25rem" }}>
                      {patientAnalytics?.compliance?.rolling_30_days !== null ? `${patientAnalytics?.compliance?.rolling_30_days}%` : "No data"}
                    </div>
                  </div>
                  <div style={{ padding: "1rem", background: "var(--color-bg)", borderRadius: "var(--radius-md)" }}>
                    <span style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: "700", color: "var(--color-ink-muted)" }}>90-Day Compliance</span>
                    <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "var(--color-primary)", marginTop: "0.25rem" }}>
                      {patientAnalytics?.compliance?.rolling_90_days !== null ? `${patientAnalytics?.compliance?.rolling_90_days}%` : "No data"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations Prescriptions Shelf */}
              <div className="card" style={{ margin: 0, padding: "1.5rem" }}>
                <h3 style={{ marginTop: 0, marginBottom: "1.25rem", fontSize: "1.1rem" }}>🧴 Clinician Product Selections</h3>
                <form onSubmit={handleSaveRecommendations}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.25rem" }}>
                    
                    {/* Catalog Selection List */}
                    <div>
                      <span className="eyebrow" style={{ display: "block", marginBottom: "0.5rem" }}>Available Recommendations Catalog</span>
                      <div style={{ maxHeight: "280px", overflowY: "auto", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        {catalogProducts.map((p) => {
                          const isSelected = selectedProductIds.includes(p.id);
                          return (
                            <label key={p.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", padding: "0.4rem", background: isSelected ? "var(--color-primary-tint)" : "none", borderRadius: "4px", cursor: "pointer" }}>
                              <input 
                                type="checkbox" 
                                checked={isSelected} 
                                onChange={() => handleToggleProduct(p.id)} 
                              />
                              <span>{p.brand} - {p.name} ({p.category})</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Prescription clinical notes */}
                    <div>
                      <div style={{ display: "flex", justify_content: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                        <span className="eyebrow" style={{ display: "block" }}>Consultation Notes & Directions</span>
                        <button type="button" className="btn btn-secondary" onClick={startVoiceNotesMock} disabled={transcribing} style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem" }}>
                          {transcribing ? "🎙️ Recording..." : "🎙️ Voice Notes"}
                        </button>
                      </div>
                      <textarea
                        className="input"
                        rows="8"
                        placeholder="Provide directions on usage, sequence, and daily targets..."
                        value={recommendationNotes}
                        onChange={(e) => setRecommendationNotes(e.target.value)}
                        style={{ width: "100%", fontSize: "0.88rem" }}
                      />
                    </div>

                  </div>

                  <button type="submit" className="btn btn-primary" disabled={savingRec}>
                    {savingRec ? "Saving..." : "Save Product Prescriptions"}
                  </button>
                </form>
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

            </div>
          )}

        </div>
      )}
    </div>
  );
}
