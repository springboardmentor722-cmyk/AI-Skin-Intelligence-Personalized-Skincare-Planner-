import { useEffect, useState } from "react";
import api from "../api/axios";
import LoadingState from "../components/LoadingState";
import PageHeader from "../components/PageHeader";

export default function ConsultantRecommendations() {
  const [patients, setPatients] = useState([]);
  const [products, setProducts] = useState([]);
  const [recommendationLogs, setRecommendationLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selection states
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedPatientProfile, setSelectedPatientProfile] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [recNotes, setRecNotes] = useState("");
  const [recSubmitting, setRecSubmitting] = useState(false);
  const [recStatus, setRecStatus] = useState(null);

  const loadData = async () => {
    try {
      const [patientsRes, productsRes, logsRes] = await Promise.all([
        api.get("/workspace/consultant/patients").catch(() => ({ data: [] })),
        api.get("/admin/products").catch(() => ({ data: [] })),
        api.get("/recommendations/all").catch(() => ({ data: [] }))
      ]);
      setPatients(patientsRes.data || []);
      setProducts(productsRes.data || []);
      setRecommendationLogs(logsRes.data || []);
    } catch (err) {
      console.error("Failed to load recommendations workspace data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetch individual skin profile when a patient is selected
  useEffect(() => {
    if (!selectedPatientId) {
      setSelectedPatientProfile(null);
      return;
    }
    const pat = patients.find(p => p.id === selectedPatientId);
    if (pat) {
      // In this DB schema, profile details are attached to the patient object or can be fetched
      setSelectedPatientProfile(pat.skin_profile || pat);
    }
  }, [selectedPatientId, patients]);

  const handleRecommendProduct = async (e) => {
    e.preventDefault();
    if (!selectedPatientId || !selectedProductId) {
      setRecStatus({ type: "error", text: "Please select a customer and a product." });
      return;
    }
    setRecSubmitting(true);
    setRecStatus(null);
    try {
      await api.post(`/recommendations/user/${selectedPatientId}`, {
        product_ids: [selectedProductId],
        notes: recNotes
      });
      setRecStatus({ type: "ok", text: "Recommendation registered successfully." });
      setRecNotes("");
      loadData(); // reload log history
    } catch (err) {
      setRecStatus({ type: "error", text: "Failed to save recommendation." });
    } finally {
      setRecSubmitting(false);
    }
  };

  if (loading) return <LoadingState label="Loading clinical recommendation board..." />;

  return (
    <div className="page" style={{ padding: "0 1rem" }}>
      <PageHeader
        eyebrow="CRM Operations"
        title="Product Recommendations"
        description="Prescribe and review active skincare recommendations for assigned customers."
      />

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "1.5rem", marginTop: "2rem" }}>
        
        {/* Recommendation Builder Card */}
        <div className="card" style={{ margin: 0, padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "800", marginBottom: "1.25rem" }}>🧪 Clinical Recommendation Builder</h3>
          
          <form onSubmit={handleRecommendProduct} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div className="field">
              <label htmlFor="patient-select" style={{ fontWeight: "700", marginBottom: "0.5rem", display: "block", fontSize: "0.85rem" }}>Select Client Profile *</label>
              <select
                id="patient-select"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="input"
                style={{ width: "100%", padding: "0.5rem" }}
                required
              >
                <option value="">-- Select Customer --</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.full_name} ({p.email})</option>
                ))}
              </select>
            </div>

            {/* Display selected customer's skin profile details */}
            {selectedPatientProfile && (
              <div style={{ background: "var(--color-surface-sunken)", padding: "1rem", borderRadius: "8px", fontSize: "0.82rem" }}>
                <strong style={{ display: "block", marginBottom: "0.5rem", color: "var(--color-primary-dark)" }}>📋 Skin Attributes:</strong>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  <div><strong>Skin Type:</strong> <span style={{ textTransform: "capitalize" }}>{selectedPatientProfile.skin_type || "Normal"}</span></div>
                  <div><strong>Age:</strong> {selectedPatientProfile.age || "N/A"}</div>
                  <div style={{ gridColumn: "span 2" }}><strong>Concerns:</strong> {selectedPatientProfile.skin_concerns || "None listed"}</div>
                  <div style={{ gridColumn: "span 2" }}><strong>Allergies:</strong> {selectedPatientProfile.allergies || "None"}</div>
                </div>
              </div>
            )}

            <div className="field">
              <label htmlFor="product-select" style={{ fontWeight: "700", marginBottom: "0.5rem", display: "block", fontSize: "0.85rem" }}>Select Skincare Product *</label>
              <select
                id="product-select"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="input"
                style={{ width: "100%", padding: "0.5rem" }}
                required
              >
                <option value="">-- Choose Catalog Product --</option>
                {products.map(p => (
                  <option key={p.id || p.name} value={p.id || p.name}>[{p.brand}] {p.name} - ₹{p.price}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="notes-area" style={{ fontWeight: "700", marginBottom: "0.5rem", display: "block", fontSize: "0.85rem" }}>Usage and application instructions</label>
              <textarea
                id="notes-area"
                value={recNotes}
                onChange={(e) => setRecNotes(e.target.value)}
                placeholder="e.g. Apply morning and night after cleansing. Do not combine with retinoids."
                className="input"
                style={{ width: "100%", minHeight: "100px", fontFamily: "inherit", padding: "0.5rem" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button type="submit" className="btn btn-primary" disabled={recSubmitting} style={{ padding: "0.6rem 1.5rem" }}>
                {recSubmitting ? "Saving..." : "Send Recommendation"}
              </button>
              {recStatus && (
                <span className={`status-msg ${recStatus.type}`} style={{ padding: "0.4rem 1rem", borderRadius: "6px", fontSize: "0.85rem", margin: 0 }}>
                  {recStatus.text}
                </span>
              )}
            </div>
          </form>
        </div>

        {/* History / Logs sidebar panel */}
        <div className="card" style={{ margin: 0, padding: "1.5rem", display: "flex", flexDirection: "column" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "800", marginBottom: "1rem" }}>📋 Recommendation Logs</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", overflowY: "auto", maxHeight: "400px" }}>
            {recommendationLogs.length === 0 ? (
              <p style={{ fontSize: "0.82rem", color: "var(--color-ink-faint)" }}>No recommendations sent today.</p>
            ) : (
              recommendationLogs.map((log, idx) => (
                <div key={idx} style={{ background: "var(--color-surface-sunken)", padding: "0.75rem", borderRadius: "6px", fontSize: "0.82rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "700", marginBottom: "0.25rem", color: "var(--color-primary-dark)" }}>
                    <span>Customer: {log.user_name || log.user_id}</span>
                  </div>
                  <div style={{ color: "var(--color-ink-muted)" }}>
                    <strong>Recommended:</strong> {Array.isArray(log.product_ids) ? log.product_ids.join(", ") : log.product_ids}
                  </div>
                  {log.notes && <div style={{ fontSize: "0.75rem", marginTop: "0.25rem", borderTop: "1px dashed var(--color-border)", paddingTop: "0.25rem" }}><em>"{log.notes}"</em></div>}
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
