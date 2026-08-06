import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { getPhotos } from "../api/photos";
import LoadingState from "../components/LoadingState";
import PageHeader from "../components/PageHeader";

function formatDate(value) {
  return new Date(value).toLocaleDateString();
}

export default function ProgressTracking() {
  const [entries, setEntries] = useState([]);
  const [assignedDermatologist, setAssignedDermatologist] = useState(null);
  const [scoreHistory, setScoreHistory] = useState([]);
  const [photosList, setPhotosList] = useState([]);
  const [form, setForm] = useState({
    entry_date: new Date().toISOString().slice(0, 10),
    hydration_score: "",
    breakout_count: "",
    notes: "",
    photo_url: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  const loadData = async () => {
    try {
      const [entriesRes, dermatologistRes, historyRes, photosData] = await Promise.all([
        api.get("/progress/"),
        api.get("/users/me/dermatologist").catch(() => ({ data: null })),
        api.get("/v1/assessment/history").catch(() => ({ data: [] })),
        getPhotos().catch(() => [])
      ]);
      setEntries(entriesRes.data);
      setAssignedDermatologist(dermatologistRes.data);
      setScoreHistory(historyRes.data);
      setPhotosList(photosData);
    } catch {
      setStatus({ type: "error", text: "Couldn't load your progress timeline." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e) => {
    setForm((current) => ({ ...current, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);

    try {
      const res = await api.post("/progress/", {
        ...form,
        hydration_score: form.hydration_score ? Number(form.hydration_score) : null,
        breakout_count: form.breakout_count ? Number(form.breakout_count) : null,
        notes: form.notes.trim() || null,
        photo_url: form.photo_url.trim() || null,
      });
      setEntries((current) => [res.data, ...current]);
      setForm((current) => ({
        ...current,
        hydration_score: "",
        breakout_count: "",
        notes: "",
        photo_url: "",
      }));
      setStatus({ type: "ok", text: "Progress entry added successfully." });
    } catch (err) {
      setStatus({
        type: "error",
        text: err.response?.data?.detail || "Couldn't save this progress entry.",
      });
    } finally {
      setSaving(false);
    }
  };

  const averageHydration = useMemo(() => {
    const scores = entries
      .map((entry) => entry.hydration_score)
      .filter((score) => typeof score === "number");
    if (scores.length === 0) return null;
    return (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1);
  }, [entries]);

  const latestEntry = entries[0] || null;

  // Filter photos to find Baseline and latest photos for comparison
  const baselinePhoto = photosList.find((p) => p.tag === "Baseline");
  const latestPhoto = photosList.filter((p) => p.tag !== "Baseline")[0] || photosList[0] || null;

  const renderScoreChart = () => {
    if (scoreHistory.length < 2) {
      return (
        <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--color-fg-muted)" }}>
          <p className="hint">Complete multiple skin assessments over time to generate a trend graph of your overall Skin Health Score.</p>
        </div>
      );
    }

    const width = 600;
    const height = 200;
    const paddingLeft = 40;
    const paddingRight = 30;
    const paddingTop = 30;
    const paddingBottom = 30;

    const maxScore = 100;
    const minScore = 0;

    const points = scoreHistory
      .map((h, i) => {
        const x = paddingLeft + (i / (scoreHistory.length - 1)) * (width - paddingLeft - paddingRight);
        const y = height - paddingBottom - ((h.overall_score - minScore) / (maxScore - minScore)) * (height - paddingTop - paddingBottom);
        return `${x},${y}`;
      })
      .join(" ");

    return (
      <div style={{ width: "100%", overflowX: "auto" }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", minWidth: "500px", height: "auto" }}>
          {[20, 40, 60, 80, 100].map((level) => {
            const y = height - paddingBottom - ((level - minScore) / (maxScore - minScore)) * (height - paddingTop - paddingBottom);
            return (
              <g key={level}>
                <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="var(--color-border)" strokeDasharray="3,3" />
                <text x={paddingLeft - 8} y={y + 4} textAnchor="end" fontSize="10" fill="var(--color-fg-muted)">{level}</text>
              </g>
            );
          })}

          <polyline fill="none" stroke="var(--color-clinical-blue)" strokeWidth="3" points={points} />

          {scoreHistory.map((h, i) => {
            const x = paddingLeft + (i / (scoreHistory.length - 1)) * (width - paddingLeft - paddingRight);
            const y = height - paddingBottom - ((h.overall_score - minScore) / (maxScore - minScore)) * (height - paddingTop - paddingBottom);
            const formattedDate = new Date(h.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" });
            return (
              <g key={h.id}>
                <circle cx={x} cy={y} r="5" fill="var(--color-surface)" stroke="var(--color-clinical-blue)" strokeWidth="2.5" />
                <text x={x} y={y - 10} textAnchor="middle" fontSize="10" fontWeight="bold" fill="var(--color-clinical-blue)">
                  {Math.round(h.overall_score)}
                </text>
                <text x={x} y={height - 8} textAnchor="middle" fontSize="9" fill="var(--color-fg-muted)">
                  {formattedDate}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  if (loading) return <LoadingState label="Loading your progress timeline…" />;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Patient progress"
        title="Progress Tracking"
        description="Track your skincare progress here. Your recent entries are visible inside your dermatologist's private workspace after you connect with one."
      />

      {status && <div className={`status-msg ${status.type}`}>{status.text}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "1.5rem", marginBottom: "2rem" }}>
        
        {/* Progress Overview Metrics */}
        <div>
          <div className="card-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
            <div className="card summary-card" style={{ margin: 0, padding: "1rem" }}>
              <div className="summary-label">Entries logged</div>
              <div className="summary-value" style={{ fontSize: "1.8rem", fontWeight: "900" }}>{entries.length}</div>
              <p className="summary-note" style={{ fontSize: "0.72rem" }}>Build a timeline for clinician review.</p>
            </div>
            <div className="card summary-card" style={{ margin: 0, padding: "1rem" }}>
              <div className="summary-label">Average Hydration</div>
              <div className="summary-value" style={{ fontSize: "1.8rem", fontWeight: "900", color: "var(--color-clinical-blue)" }}>{averageHydration ?? "-"}</div>
              <p className="summary-note" style={{ fontSize: "0.72rem" }}>Calculated from check-in logs.</p>
            </div>
            <div className="card summary-card" style={{ margin: 0, padding: "1rem" }}>
              <div className="summary-label">Assigned Doctor</div>
              <div className="summary-value progress-summary-text" style={{ fontSize: "1.1rem", fontWeight: "800", height: "40px", overflow: "hidden", textOverflow: "ellipsis" }}>
                {assignedDermatologist ? assignedDermatologist.full_name : "None"}
              </div>
              <p className="summary-note" style={{ fontSize: "0.72rem" }}>{assignedDermatologist ? "Clinician linked" : "Assign doctor to link"}</p>
            </div>
          </div>

          {/* Achievement Badges Board */}
          <div className="card" style={{ marginTop: "1rem", padding: "1.25rem", margin: "1rem 0 0 0" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: "800", marginBottom: "1rem" }}>🏆 Skin Health Achievements</h3>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <div style={{ padding: "0.5rem 0.75rem", background: entries.length >= 1 ? "var(--color-primary-tint)" : "var(--color-surface-sunken)", opacity: entries.length >= 1 ? 1 : 0.5, border: "1px solid var(--color-primary)", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "bold" }}>
                🎉 First Step Logged
              </div>
              <div style={{ padding: "0.5rem 0.75rem", background: Number(averageHydration) >= 7 ? "var(--color-primary-tint)" : "var(--color-surface-sunken)", opacity: Number(averageHydration) >= 7 ? 1 : 0.5, border: "1px solid var(--color-primary)", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "bold" }}>
                💦 Hydration Master
              </div>
              <div style={{ padding: "0.5rem 0.75rem", background: scoreHistory.length > 0 ? "var(--color-primary-tint)" : "var(--color-surface-sunken)", opacity: scoreHistory.length > 0 ? 1 : 0.5, border: "1px solid var(--color-primary)", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "bold" }}>
                🔬 Assessment Complete
              </div>
              <div style={{ padding: "0.5rem 0.75rem", background: assignedDermatologist ? "var(--color-primary-tint)" : "var(--color-surface-sunken)", opacity: assignedDermatologist ? 1 : 0.5, border: "1px solid var(--color-primary)", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "bold" }}>
                🩺 Clinical Consultation
              </div>
            </div>
          </div>
        </div>

        {/* Before/After Photo Side-by-Side Slider */}
        <div className="card" style={{ margin: 0, padding: "1.25rem", display: "flex", flexDirection: "column", justify_content: "space-between" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: "800", marginBottom: "0.75rem" }}>🖼️ Before & After Visuals</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", flex: 1, minHeight: "150px" }}>
            <div style={{ background: "var(--color-surface-sunken)", borderRadius: "6px", overflow: "hidden", textAlign: "center", position: "relative" }}>
              {baselinePhoto ? (
                <img src={`http://localhost:8000${baselinePhoto.image_url}`} alt="Baseline" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ fontSize: "0.8rem", color: "var(--color-ink-muted)", padding: "2rem 1rem" }}>No Baseline uploaded yet.</div>
              )}
              <span style={{ position: "absolute", bottom: "0.5rem", left: "0.5rem", padding: "0.2rem 0.4rem", background: "rgba(0,0,0,0.6)", color: "#FFF", fontSize: "0.68rem", borderRadius: "3px", fontWeight: "bold" }}>BASELINE</span>
            </div>
            <div style={{ background: "var(--color-surface-sunken)", borderRadius: "6px", overflow: "hidden", textAlign: "center", position: "relative" }}>
              {latestPhoto ? (
                <img src={`http://localhost:8000${latestPhoto.image_url}`} alt="Current" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ fontSize: "0.8rem", color: "var(--color-ink-muted)", padding: "2rem 1rem" }}>No current photos uploaded.</div>
              )}
              <span style={{ position: "absolute", bottom: "0.5rem", left: "0.5rem", padding: "0.2rem 0.4rem", background: "rgba(0,0,0,0.6)", color: "#FFF", fontSize: "0.68rem", borderRadius: "3px", fontWeight: "bold" }}>LATEST</span>
            </div>
          </div>
        </div>
      </div>

      {/* Skin Health Score Trend Chart Section */}
      <section className="section">
        <h2 className="section-title">Skin Health Score History</h2>
        <div className="card" style={{ padding: "1.5rem" }}>
          {renderScoreChart()}
        </div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "1.5rem" }}>
        {/* Recent Timeline */}
        <section className="section">
          <div className="section-heading-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 className="section-title">Recent Timeline Logs</h2>
            <Link to="/dermatologist" className="btn btn-secondary" style={{ padding: "0.4rem 1rem", fontSize: "0.85rem" }}>
              Dermatologist Chat →
            </Link>
          </div>

          {entries.length === 0 ? (
            <div className="card empty-state">
              <h3>No progress entries yet</h3>
              <p>Log your first update to start building a progress history for yourself and your dermatologist.</p>
            </div>
          ) : (
            <div className="progress-entry-list" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {entries.map((entry) => (
                <article key={entry.id} className="card progress-entry-card" style={{ padding: "1rem", margin: 0 }}>
                  <div className="appointment-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                    <div>
                      <h3 style={{ fontSize: "1rem", fontWeight: "800", margin: 0 }}>{formatDate(entry.entry_date)}</h3>
                      <p className="stat-note" style={{ fontSize: "0.72rem", color: "var(--color-ink-faint)", margin: 0 }}>Logged on {new Date(entry.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className="status-pill status-accepted" style={{ fontSize: "0.68rem", fontWeight: "bold", padding: "0.1rem 0.4rem", borderRadius: "4px" }}>Patient Entry</span>
                  </div>
                  <div className="detail-grid" style={{ display: "flex", gap: "1.5rem", marginBottom: "0.5rem", borderTop: "1px solid var(--color-border)", paddingTop: "0.5rem" }}>
                    <div className="detail-box">
                      <strong style={{ fontSize: "0.75rem", display: "block" }}>Hydration</strong>
                      <span style={{ fontSize: "0.88rem" }}>{entry.hydration_score ?? "—"}/10</span>
                    </div>
                    <div className="detail-box">
                      <strong style={{ fontSize: "0.75rem", display: "block" }}>Breakouts</strong>
                      <span style={{ fontSize: "0.88rem" }}>{entry.breakout_count ?? "—"}</span>
                    </div>
                  </div>
                  <div className="appointment-copy" style={{ borderTop: "1px solid var(--color-border)", paddingTop: "0.5rem" }}>
                    <strong style={{ fontSize: "0.75rem", display: "block", marginBottom: "0.2rem" }}>Daily Log Notes</strong>
                    <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--color-ink-muted)" }}>{entry.notes || "No notes added for this day."}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Add Progress Entry Form */}
        <section className="section">
          <h2 className="section-title">Add Daily Update</h2>
          <form onSubmit={handleSubmit} className="card form-card" style={{ padding: "1.5rem", margin: 0 }}>
            <div className="form-section">
              <div className="field" style={{ marginBottom: "1rem" }}>
                <label htmlFor="entry_date" style={{ fontSize: "0.85rem", fontWeight: "700", display: "block", marginBottom: "0.4rem" }}>Entry Date</label>
                <input id="entry_date" name="entry_date" type="date" value={form.entry_date} onChange={handleChange} className="input" style={{ width: "100%" }} />
              </div>
              
              <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div className="field">
                  <label htmlFor="hydration_score" style={{ fontSize: "0.85rem", fontWeight: "700", display: "block", marginBottom: "0.4rem" }}>Hydration <span style={{ fontWeight: "normal", color: "var(--color-ink-faint)" }}>(0-10)</span></label>
                  <input
                    id="hydration_score"
                    name="hydration_score"
                    type="number"
                    min="0"
                    max="10"
                    value={form.hydration_score}
                    onChange={handleChange}
                    placeholder="7"
                    className="input"
                    style={{ width: "100%" }}
                  />
                </div>
                <div className="field">
                  <label htmlFor="breakout_count" style={{ fontSize: "0.85rem", fontWeight: "700", display: "block", marginBottom: "0.4rem" }}>Breakouts</label>
                  <input
                    id="breakout_count"
                    name="breakout_count"
                    type="number"
                    min="0"
                    value={form.breakout_count}
                    onChange={handleChange}
                    placeholder="2"
                    className="input"
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              <div className="field" style={{ marginBottom: "1rem" }}>
                <label htmlFor="notes" style={{ fontSize: "0.85rem", fontWeight: "700", display: "block", marginBottom: "0.4rem" }}>Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  rows="3"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Describe skin texture, redness, or issues..."
                  className="input"
                  style={{ width: "100%" }}
                />
              </div>

              <div className="field" style={{ marginBottom: "1.25rem" }}>
                <label htmlFor="photo_url" style={{ fontSize: "0.85rem", fontWeight: "700", display: "block", marginBottom: "0.4rem" }}>Attach Photo URL</label>
                <input
                  id="photo_url"
                  name="photo_url"
                  value={form.photo_url}
                  onChange={handleChange}
                  placeholder="https://example.com/photo.jpg"
                  className="input"
                  style={{ width: "100%" }}
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary btn-block" disabled={saving}>
                {saving ? "Saving Log..." : "Save Daily Log"}
              </button>
            </div>
          </form>
        </section>
      </div>

    </div>
  );
}
