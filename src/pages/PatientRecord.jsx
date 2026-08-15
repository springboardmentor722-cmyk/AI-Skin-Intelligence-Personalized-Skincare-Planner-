import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FileDown } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import Loading from "../components/Loading";
import ErrorBanner from "../components/ErrorBanner";
import RoutineOverwriteForm from "../components/RoutineOverwriteForm";
import api from "../api/axios";
import { downloadFile } from "../utils/download";
import "./Dashboard.css";
import "./Lifestyle.css";
import "./ClientProfile.css";
import "./RichDashboard.css";
import "./Progress.css";
import { DERMATOLOGIST_SIDEBAR } from "../config/sidebarConfig";

export default function PatientRecord() {
  const { patientId } = useParams();
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  const handleDownloadReport = async () => {
    setDownloading(true);
    setError("");
    try {
      await downloadFile(`/v1/reports/patients/${patientId}/skin-health.pdf`, "patient-report.pdf");
    } catch {
      setError("Could not download this report.");
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    api
      .get(`/dermatologist/patients/${patientId}`)
      .then((res) => setSnapshot(res.data))
      .catch(() => setError("Could not load this patient's record."))
      .finally(() => setLoading(false));
  }, [patientId]);

  if (loading) return <Loading label="Loading patient record" />;

  return (
    <DashboardLayout items={DERMATOLOGIST_SIDEBAR} roleLabel="Dermatologist">
      <ErrorBanner message={error} />

      {snapshot && (
        <>
          <div className="dashboard-header">
            <span className="eyebrow">Patient Record</span>
            <h1>{snapshot.full_name}</h1>
            <p>
              {snapshot.email} {snapshot.age ? `· ${snapshot.age} yrs` : ""} {snapshot.gender ? `· ${snapshot.gender}` : ""}
            </p>
            <button className="btn btn-ghost" onClick={handleDownloadReport} disabled={downloading} style={{ marginTop: 10 }}>
              <FileDown size={15} /> {downloading ? "Preparing..." : "Download PDF Report"}
            </button>
          </div>

          <div className="client-profile-grid">
            <div className="glass-card client-profile-card">
              <h3>Skin condition</h3>
              <Row label="Skin type" value={snapshot.skin_type || "Not set"} />
              <Row label="Reported concerns" value={snapshot.skin_concerns || "Not set"} />
              <Row
                label="Latest Skin Health Score"
                value={snapshot.latest_overall_score != null ? Math.round(snapshot.latest_overall_score) : "No assessment yet"}
              />
              <Row label="Primary concern" value={snapshot.latest_primary_concern || "—"} />
              <Row
                label="Improvement"
                value={
                  snapshot.improvement
                    ? `${snapshot.improvement.delta_points > 0 ? "+" : ""}${snapshot.improvement.delta_points} pts (${snapshot.improvement.trend})`
                    : "Not enough data yet"
                }
              />
              {snapshot.detected_concerns?.length > 0 && (
                <div className="concern-tags">
                  {snapshot.detected_concerns.map((c, i) => (
                    <span key={i} className="badge badge-coming-soon">
                      {c.name} ({c.severity})
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-card client-profile-card">
              <h3>Skin photo</h3>
              {snapshot.skin_photo_url ? (
                <img src={snapshot.skin_photo_url} alt="Patient skin" className="client-profile-photo" />
              ) : (
                <p>No photo uploaded yet.</p>
              )}
            </div>
          </div>

          <div className="dashboard-section">
            <h2 className="dashboard-section-title">Appointment history</h2>
            <div className="glass-card activity-list">
              {snapshot.appointments.map((a) => (
                <div className="activity-row" key={a.id}>
                  <div>
                    <p className="activity-row-action">
                      {a.appointment_date} at {a.appointment_time}
                    </p>
                    <p className="activity-row-time">{a.reason || "No reason given"}</p>
                  </div>
                  <span className={`badge ${a.status === "Confirmed" ? "badge-active" : "badge-coming-soon"}`}>
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="dashboard-section">
            <h2 className="dashboard-section-title">Routine Adherence</h2>
            <div className="stat-row">
              <div className="glass-card stat-card">
                <div className="stat-card-body">
                  <span className="stat-card-label">7-Day</span>
                  <span className="stat-card-value">
                    {snapshot.adherence?.["7d"] != null ? `${snapshot.adherence["7d"]}%` : "—"}
                  </span>
                </div>
              </div>
              <div className="glass-card stat-card">
                <div className="stat-card-body">
                  <span className="stat-card-label">30-Day</span>
                  <span className="stat-card-value">
                    {snapshot.adherence?.["30d"] != null ? `${snapshot.adherence["30d"]}%` : "—"}
                  </span>
                </div>
              </div>
              <div className="glass-card stat-card">
                <div className="stat-card-body">
                  <span className="stat-card-label">90-Day</span>
                  <span className="stat-card-value">
                    {snapshot.adherence?.["90d"] != null ? `${snapshot.adherence["90d"]}%` : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {snapshot.progress_photos?.length > 0 && (
            <div className="dashboard-section">
              <h2 className="dashboard-section-title">Progress Photos (Baseline vs. Current)</h2>
              <div className="glass-card client-profile-card">
                <div className="progress-compare">
                  <PhotoCompareCard photo={snapshot.progress_photos[0]} label="Baseline" />
                  <span className="progress-compare-arrow">→</span>
                  <PhotoCompareCard
                    photo={snapshot.progress_photos[snapshot.progress_photos.length - 1]}
                    label="Current"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="dashboard-section">
            <h2 className="dashboard-section-title">Routine Adjustment</h2>
            <div className="glass-card client-profile-card">
              <p style={{ marginBottom: 12, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                Replace this patient's entire active routine. Changes reflect immediately on their Daily Planner.
              </p>
              <RoutineOverwriteForm clientId={patientId} />
            </div>
          </div>

          <div className="dashboard-section">
            <h2 className="dashboard-section-title">Daily activity log</h2>
            {snapshot.lifestyle_logs.length === 0 ? (
              <div className="glass-card empty-state">
                <p>No lifestyle logs recorded yet.</p>
              </div>
            ) : (
              <div className="lifestyle-table-wrapper glass-card">
                <table className="lifestyle-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Sleep</th>
                      <th>Water</th>
                      <th>Exercise</th>
                      <th>Stress</th>
                      <th>Smoking</th>
                      <th>Alcohol</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.lifestyle_logs.map((log) => (
                      <tr key={log.id}>
                        <td>{new Date(log.logged_at).toLocaleDateString()}</td>
                        <td>{log.sleep_hours ?? "—"} h</td>
                        <td>{log.water_intake_liters ?? "—"} L</td>
                        <td>{log.exercise_minutes ?? "—"} min</td>
                        <td>{log.stress_level || "—"}</td>
                        <td>{log.smoking ? "Yes" : "No"}</td>
                        <td>{log.alcohol ? "Yes" : "No"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}

function Row({ label, value }) {
  return (
    <div className="review-row">
      <span className="review-row-label">{label}</span>
      <span className="review-row-value">{value}</span>
    </div>
  );
}

function PhotoCompareCard({ photo, label }) {
  return (
    <div className="progress-compare-card">
      <img src={photo.photo_url} alt={label} />
      <span>{label}</span>
      {photo.skin_health_score_at_upload != null && (
        <span>Score: {Math.round(photo.skin_health_score_at_upload)}</span>
      )}
    </div>
  );
}
