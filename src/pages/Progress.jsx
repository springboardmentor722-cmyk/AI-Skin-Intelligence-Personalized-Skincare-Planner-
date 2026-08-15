import { useEffect, useRef, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { FileDown } from "lucide-react";
import api from "../api/axios";
import ErrorBanner from "../components/ErrorBanner";
import Loading from "../components/Loading";
import { downloadFile } from "../utils/download";
import "./Dashboard.css";
import "./RichDashboard.css";
import "./Progress.css";

const TAG_OPTIONS = ["Baseline", "Week 2", "Week 4", "Week 8", "Week 12", "Custom"];

export default function Progress() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [tag, setTag] = useState("Baseline");
  const [downloading, setDownloading] = useState("");
  const fileInputRef = useRef(null);

  const handleDownload = async (kind) => {
    setDownloading(kind);
    setError("");
    try {
      if (kind === "skin-health") {
        await downloadFile("/v1/reports/skin-health.pdf", "skin-health-report.pdf");
      } else if (kind === "progress") {
        await downloadFile("/v1/reports/progress.pdf", "progress-report.pdf");
      } else if (kind === "excel") {
        await downloadFile("/v1/reports/history.xlsx", "history-export.xlsx");
      }
    } catch {
      setError("Could not download that report.");
    } finally {
      setDownloading("");
    }
  };

  const load = () => {
    api
      .get("/v1/progress/analytics")
      .then((res) => setAnalytics(res.data))
      .catch(() => setError("Could not load your progress data."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      await api.post(`/v1/progress/photos?tag=${encodeURIComponent(tag)}`, formData, {
        headers: { "Content-Type": undefined },
      });
      load();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not upload photo.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photoId) => {
    if (!window.confirm("Delete this progress photo?")) return;
    try {
      await api.delete(`/v1/progress/photos/${photoId}`);
      load();
    } catch {
      setError("Could not delete this photo.");
    }
  };

  if (loading) return <Loading label="Loading your progress" />;

  const adherence = analytics?.adherence || {};
  const improvement = analytics?.improvement;
  const photos = analytics?.photos || [];
  const baseline = photos[0];
  const current = photos[photos.length - 1];

  return (
    <div className="progress-page">
      <div className="dashboard-header">
        <h1>Your Progress</h1>
        <p>Track your Skin Health Score, routine consistency, and visual changes over time.</p>
      </div>

      <div className="report-download-row">
        <button className="btn btn-ghost" onClick={() => handleDownload("skin-health")} disabled={downloading}>
          <FileDown size={15} /> {downloading === "skin-health" ? "Preparing..." : "Skin Health Report (PDF)"}
        </button>
        <button className="btn btn-ghost" onClick={() => handleDownload("progress")} disabled={downloading}>
          <FileDown size={15} /> {downloading === "progress" ? "Preparing..." : "Progress Report (PDF)"}
        </button>
        <button className="btn btn-ghost" onClick={() => handleDownload("excel")} disabled={downloading}>
          <FileDown size={15} /> {downloading === "excel" ? "Preparing..." : "Export History (Excel)"}
        </button>
      </div>

      <ErrorBanner message={error} />

      <div className="stat-row">
        <div className="glass-card stat-card">
          <div className="stat-card-body">
            <span className="stat-card-label">Improvement</span>
            <span className="stat-card-value">
              {improvement
                ? `${improvement.delta_points > 0 ? "+" : ""}${improvement.delta_points} pts`
                : "—"}
            </span>
            {improvement && (
              <span className="stat-card-sub">
                {improvement.trend} since {new Date(improvement.since).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-card-body">
            <span className="stat-card-label">7-Day Adherence</span>
            <span className="stat-card-value">{adherence["7d"] != null ? `${adherence["7d"]}%` : "—"}</span>
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-card-body">
            <span className="stat-card-label">30-Day Adherence</span>
            <span className="stat-card-value">{adherence["30d"] != null ? `${adherence["30d"]}%` : "—"}</span>
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-card-body">
            <span className="stat-card-label">90-Day Adherence</span>
            <span className="stat-card-value">{adherence["90d"] != null ? `${adherence["90d"]}%` : "—"}</span>
          </div>
        </div>
      </div>

      <div className="glass-card rich-table-card">
        <h3>Skin Health Score Over Time</h3>
        {analytics.score_timeline.length < 2 ? (
          <p className="donut-empty">Take a few more assessments to see your trend.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={analytics.score_timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="created_at"
                tick={{ fontSize: 11 }}
                tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip labelFormatter={(d) => new Date(d).toLocaleString()} />
              <Line type="monotone" dataKey="overall_score" stroke="#4f46e5" strokeWidth={2.5} dot />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="glass-card rich-table-card">
        <div className="rich-table-header">
          <h3>Progress Photos</h3>
          <div className="progress-upload-controls">
            <select value={tag} onChange={(e) => setTag(e.target.value)}>
              {TAG_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleUpload}
              style={{ display: "none" }}
              disabled={uploading}
            />
            <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? "Uploading..." : "Upload photo"}
            </button>
          </div>
        </div>

        {photos.length === 0 ? (
          <p className="donut-empty">No progress photos yet — upload your first as a baseline.</p>
        ) : (
          <>
            {baseline && current && baseline.id !== current.id && (
              <div className="progress-compare">
                <PhotoCard photo={baseline} label="Baseline" />
                <span className="progress-compare-arrow">→</span>
                <PhotoCard photo={current} label="Current" />
              </div>
            )}
            <div className="progress-gallery">
              {photos.map((p) => (
                <div key={p.id} className="progress-gallery-item">
                  <img src={p.photo_url} alt={p.tag || "Progress"} />
                  <div className="progress-gallery-caption">
                    <span>{p.tag || "Untitled"}</span>
                    <span>{new Date(p.uploaded_at).toLocaleDateString()}</span>
                    {p.skin_health_score_at_upload != null && <span>Score: {Math.round(p.skin_health_score_at_upload)}</span>}
                    <button className="link-button danger" onClick={() => handleDelete(p.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PhotoCard({ photo, label }) {
  return (
    <div className="progress-compare-card">
      <img src={photo.photo_url} alt={label} />
      <span>{label}</span>
      {photo.skin_health_score_at_upload != null && <span>Score: {Math.round(photo.skin_health_score_at_upload)}</span>}
    </div>
  );
}
