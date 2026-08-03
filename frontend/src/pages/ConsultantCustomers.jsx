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
    // Find tag "Baseline" or use the oldest
    return history.find(p => p.tag === "Baseline") || history[0];
  }, [patientAnalytics]);

  const latestPhoto = useMemo(() => {
    const history = patientAnalytics?.photo_history || [];
    if (history.length <= 1) return null;
    // Use tag "Latest" or the newest
    return history.find(p => p.tag === "Latest") || history[history.length - 1];
  }, [patientAnalytics]);

  if (loading) return <LoadingState label="Loading customer workspace…" />;

  return (
    <div className="page" style={{ padding: "0 1rem" }}>
      <PageHeader
        eyebrow="Consultant workspace"
        title="Customer Profiles & Progress"
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
            <h3 style={{ marginTop: 0, marginBottom: "0.75rem" }}>Search Roster</h3>
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
                    <span className="eyebrow" style={{ textTransform: "uppercase", fontSize: "0.72rem", fontWeight: "700" }}>Active Patient Workspace</span>
                    <h3 style={{ margin: "0.25rem 0", fontSize: "1.5rem", fontWeight: "800" }}>{selectedCustomer.full_name}</h3>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-ink-muted)" }}>{selectedCustomer.email}</p>
                  </div>
                  {selectedCustomer.latest_score !== null && (
                    <div style={{ textAlign: "right" }}>
                      <span className="eyebrow" style={{ textTransform: "uppercase", fontSize: "0.72rem", fontWeight: "700" }}>Latest Assessment Score</span>
                      <div style={{ fontSize: "2rem", fontWeight: "800", color: "var(--color-primary)" }}>
                        {selectedCustomer.latest_score}/100
                      </div>
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
                    <span style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: "700", color: "var(--color-ink-muted)" }}>Skin Type</span>
                    <div style={{ fontSize: "1.35rem", fontWeight: "800", color: "var(--color-ink)", marginTop: "0.4rem", textTransform: "capitalize" }}>
                      {selectedCustomer.skin_profile?.skin_type || "Not specified"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Side-by-side Photo comparison Timeline */}
              <div className="card" style={{ margin: 0, padding: "1.5rem" }}>
                <h3 style={{ marginTop: 0, marginBottom: "0.25rem", fontSize: "1.1rem" }}>📸 Progress Photo Comparison</h3>
                <p style={{ fontSize: "0.82rem", color: "var(--color-ink-muted)", marginBottom: "1.25rem" }}>
                  Analyze cell renewal and skin clarity variations between baseline registration and current selfies.
                </p>

                {(!baselinePhoto && !latestPhoto) ? (
                  <p style={{ color: "var(--color-ink-faint)", textAlign: "center", padding: "1.5rem" }}>No progress photos uploaded by this patient yet.</p>
                ) : (
                  <div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.25rem" }}>
                      {baselinePhoto && (
                        <div style={{ textAlign: "center" }}>
                          <span style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", textTransform: "uppercase", color: "var(--color-ink-muted)", marginBottom: "0.5rem" }}>
                            Baseline Photo ({baselinePhoto.tag})
                          </span>
                          <div style={{ width: "100%", height: "240px", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--color-border)" }}>
                            <img src={baselinePhoto.cloud_url} alt="Baseline" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--color-ink-faint)", marginTop: "0.4rem" }}>
                            Uploaded: {new Date(baselinePhoto.uploaded_at).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                      
                      {latestPhoto ? (
                        <div style={{ textAlign: "center" }}>
                          <span style={{ display: "block", fontSize: "0.78rem", fontWeight: "700", textTransform: "uppercase", color: "var(--color-ink-muted)", marginBottom: "0.5rem" }}>
                            Latest Photo ({latestPhoto.tag})
                          </span>
                          <div style={{ width: "100%", height: "240px", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--color-border)" }}>
                            <img src={latestPhoto.cloud_url} alt="Latest" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--color-ink-faint)", marginTop: "0.4rem" }}>
                            Uploaded: {new Date(latestPhoto.uploaded_at).toLocaleDateString()}
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed var(--color-border)", borderRadius: "8px", height: "240px", color: "var(--color-ink-faint)" }}>
                          Upload more progress photos to unlock comparison view.
                        </div>
                      )}
                    </div>

                    {/* Timeline Strip */}
                    <div style={{ display: "flex", gap: "0.75rem", overflowX: "auto", padding: "0.5rem 0", borderTop: "1px solid var(--color-border)" }}>
                      {(patientAnalytics?.photo_history || []).map((photo, index) => (
                        <div key={index} style={{ flexShrink: 0, width: "70px", height: "70px", borderRadius: "4px", overflow: "hidden", border: "1px solid var(--color-border)", position: "relative" }}>
                          <img src={photo.cloud_url} alt={photo.tag} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          <span style={{ position: "absolute", bottom: 0, left: 0, width: "100%", background: "rgba(0,0,0,0.65)", color: "#fff", fontSize: "0.6rem", textAlign: "center", fontWeight: "700" }}>
                            {photo.tag}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* CLINICAL ROUTINE OVERWRITE FORM */}
              <div className="card" style={{ margin: 0, padding: "1.5rem" }}>
                <h3 style={{ marginTop: 0, marginBottom: "0.25rem", fontSize: "1.1rem" }}>📝 Clinical Routine Overwrite Form</h3>
                <p style={{ fontSize: "0.82rem", color: "var(--color-ink-muted)", marginBottom: "1.25rem" }}>
                  Directly customize and overwrite the morning and evening routine steps. Changes propagate live to the patient's checklist.
                </p>

                <form onSubmit={handleSaveRoutineOverwrite}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.25rem" }}>
                    {patientRoutines.map((step, idx) => (
                      <div key={idx} style={{ display: "flex", gap: "0.75rem", alignItems: "center", background: "var(--color-bg)", padding: "0.6rem 0.75rem", borderRadius: "6px" }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: "700" }}>#{idx + 1}</span>
                        <select
                          value={step.time_of_day}
                          onChange={(e) => handleRoutineStepFieldChange(idx, "time_of_day", e.target.value)}
                          style={{ padding: "0.35rem 0.5rem", fontSize: "0.85rem", borderRadius: "4px", border: "1px solid var(--color-border)" }}
                        >
                          <option value="AM">AM (Morning)</option>
                          <option value="PM">PM (Evening)</option>
                        </select>
                        <input
                          type="number"
                          value={step.step_number}
                          onChange={(e) => handleRoutineStepFieldChange(idx, "step_number", Number(e.target.value))}
                          placeholder="Step order"
                          style={{ width: "80px", padding: "0.35rem 0.5rem", fontSize: "0.85rem", borderRadius: "4px", border: "1px solid var(--color-border)" }}
                        />
                        <select
                          value={step.step_category}
                          onChange={(e) => handleRoutineStepFieldChange(idx, "step_category", e.target.value)}
                          style={{ padding: "0.35rem 0.5rem", fontSize: "0.85rem", borderRadius: "4px", border: "1px solid var(--color-border)", flex: 1 }}
                        >
                          <option value="Cleansing">Cleansing</option>
                          <option value="Toning">Toning</option>
                          <option value="Treatment">Treatment / Actives</option>
                          <option value="Moisturizing">Moisturizing</option>
                          <option value="Sun Protection">Sun Protection (SPF)</option>
                          <option value="Exfoliation">Exfoliation</option>
                          <option value="Hydration">Hydration Serum</option>
                          <option value="Night Barrier">Night Barrier Repair</option>
                        </select>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleRemoveRoutineStep(idx)}
                          style={{ color: "var(--color-danger)", padding: "0.35rem 0.6rem" }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button type="button" className="btn btn-secondary" onClick={handleAddRoutineStep}>
                      ➕ Add Routine Step
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={savingRoutine}>
                      {savingRoutine ? "Applying Overwrites..." : "Apply Routine Overwrite"}
                    </button>
                  </div>
                </form>
              </div>

              {/* PRODUCT RECOMMENDATION ASSIGNMENT FORM */}
              <div className="card" style={{ margin: 0, background: "var(--color-primary-tint)", border: "1px solid var(--color-primary)", padding: "1.5rem" }}>
                <h3 style={{ marginTop: 0, color: "var(--color-primary-dark)", fontSize: "1.1rem" }}>🧴 Consultant Product Recommendations</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--color-ink-muted)", marginBottom: "1.25rem" }}>
                  Select catalog products to recommend specifically for {selectedCustomer.full_name}. They will see these pinned at the top of their recommendations shelf.
                </p>

                <form onSubmit={handleSaveRecommendations}>
                  {catalogProducts.length === 0 ? (
                    <p style={{ fontStyle: "italic", color: "var(--color-ink-muted)" }}>
                      No products available in the catalog. Please add products to the catalog first.
                    </p>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem", marginBottom: "1.25rem" }}>
                      {catalogProducts.map((p) => {
                        const isChecked = selectedProductIds.includes(p.id);
                        return (
                          <label
                            key={p.id}
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "0.5rem",
                              padding: "0.6rem 0.8rem",
                              background: "var(--color-surface)",
                              border: isChecked ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                              borderRadius: "6px",
                              cursor: "pointer"
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleProduct(p.id)}
                              style={{ marginTop: "0.2rem" }}
                            />
                            <div>
                              <strong style={{ fontSize: "0.88rem", display: "block" }}>{p.name}</strong>
                              <span style={{ fontSize: "0.75rem", color: "var(--color-ink-faint)" }}>
                                {p.brand} · {p.category}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  <div className="field" style={{ marginBottom: "1.25rem" }}>
                    <label style={{ fontWeight: "700", marginBottom: "0.4rem", display: "block" }}>Recommendation Notes / Usage Plan</label>
                    <textarea
                      rows="3"
                      value={recommendationNotes}
                      onChange={(e) => setRecommendationNotes(e.target.value)}
                      placeholder="e.g. Apply the Hydra-Gel Cleanser in the morning, followed by Niacinamide serum twice weekly..."
                      style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-surface)" }}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={savingRec}>
                    {savingRec ? "Saving recommendations..." : "Save Product Recommendations"}
                  </button>
                </form>
              </div>

              {/* Assigned Dermatologist */}
              <div className="card" style={{ margin: 0, padding: "1.5rem" }}>
                <h3 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1.1rem" }}>Assigned Dermatologist</h3>
                {selectedCustomer.assigned_dermatologist ? (
                  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                    <div>
                      <h4 style={{ margin: 0 }}>{selectedCustomer.assigned_dermatologist.full_name}</h4>
                      <p className="stat-note" style={{ margin: "0.25rem 0" }}>
                        {selectedCustomer.assigned_dermatologist.specialty || "Dermatologist"}
                      </p>
                      {selectedCustomer.assigned_dermatologist.clinic_name && (
                        <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--color-ink-muted)" }}>
                          Clinic: {selectedCustomer.assigned_dermatologist.clinic_name}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleMessageDermatologist(selectedCustomer.assigned_dermatologist.id)}
                    >
                      Message Dermatologist 💬
                    </button>
                  </div>
                ) : (
                  <p style={{ margin: 0, color: "var(--color-ink-muted)", textAlign: "center" }}>No dermatologist assigned yet.</p>
                )}
              </div>

              {/* Progress & Lifestyle entries list */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                
                {/* Progress Entries list */}
                <div className="card" style={{ margin: 0, maxHeight: "350px", overflowY: "auto", padding: "1.5rem" }}>
                  <h3 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1.1rem" }}>Progress History</h3>
                  {selectedCustomer.progress_entries.length === 0 ? (
                    <p style={{ color: "var(--color-ink-muted)", textAlign: "center", padding: "2rem 0" }}>No progress entries logged.</p>
                  ) : (
                    <div>
                      {selectedCustomer.progress_entries.map((entry) => (
                        <div key={entry.id} style={{ padding: "0.75rem 0", borderBottom: "1px solid var(--color-border)" }}>
                          <strong>{formatDate(entry.entry_date)}</strong>
                          <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.9rem", color: "var(--color-ink-muted)" }}>
                            {entry.notes || "No notes."}
                          </p>
                          <div style={{ fontSize: "0.8rem", color: "var(--color-primary)", marginTop: "0.25rem" }}>
                            Hydration: {entry.hydration_score ?? "-"} · Breakouts: {entry.breakout_count ?? "-"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Lifestyle Logs list */}
                <div className="card" style={{ margin: 0, maxHeight: "350px", overflowY: "auto", padding: "1.5rem" }}>
                  <h3 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1.1rem" }}>Lifestyle Logs</h3>
                  {selectedCustomer.lifestyle_entries.length === 0 ? (
                    <p style={{ color: "var(--color-ink-muted)", textAlign: "center", padding: "2rem 0" }}>No lifestyle logs submitted.</p>
                  ) : (
                    <div>
                      {selectedCustomer.lifestyle_entries.map((entry) => (
                        <div key={entry.id} style={{ padding: "0.75rem 0", borderBottom: "1px solid var(--color-border)" }}>
                          <strong>{formatDate(entry.entry_date)}</strong>
                          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", fontSize: "0.85rem", color: "var(--color-ink-muted)", marginTop: "0.25rem" }}>
                            <span>Sleep: {entry.sleep_hours ?? "-"}h</span>
                            <span>Water: {entry.water_intake_liters ?? "-"}L</span>
                            <span>Stress: {entry.stress_level ?? "-"}</span>
                          </div>
                          {entry.environmental_exposure && (
                            <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.8rem", fontStyle: "italic", color: "var(--color-ink-muted)" }}>
                              Exposure: {entry.environmental_exposure}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
}
