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
import { CONSULTANT_SIDEBAR } from "../config/sidebarConfig";

export default function ClientProfile() {
  const { clientId } = useParams();
  const [snapshot, setSnapshot] = useState(null);
  const [products, setProducts] = useState([]);
  const [dermatologists, setDermatologists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedProduct, setSelectedProduct] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState("");

  const [selectedDermatologist, setSelectedDermatologist] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [referralReason, setReferralReason] = useState("");
  const [referring, setReferring] = useState(false);
  const [referred, setReferred] = useState("");
  const [downloading, setDownloading] = useState(false);

  const handleDownloadReport = async () => {
    setDownloading(true);
    setError("");
    try {
      await downloadFile(`/v1/reports/clients/${clientId}/skin-health.pdf`, "client-report.pdf");
    } catch {
      setError("Could not download this report.");
    } finally {
      setDownloading(false);
    }
  };

  const loadSnapshot = () => {
    api
      .get(`/consultant/clients/${clientId}`)
      .then((res) => setSnapshot(res.data))
      .catch(() => setError("Could not load this client's profile."));
  };

  useEffect(() => {
    Promise.allSettled([
      api.get(`/consultant/clients/${clientId}`),
      api.get("/products"),
      api.get("/booking/dermatologists"),
    ]).then(([snapshotRes, productsRes, dermatologistsRes]) => {
      if (snapshotRes.status === "fulfilled") setSnapshot(snapshotRes.value.data);
      else setError("Could not load this client's profile.");
      if (productsRes.status === "fulfilled") setProducts(productsRes.value.data);
      if (dermatologistsRes.status === "fulfilled") setDermatologists(dermatologistsRes.value.data);
      setLoading(false);
    });
  }, [clientId]);

  const handleRecommend = async () => {
    if (!selectedProduct) return;
    setSending(true);
    setError("");
    try {
      await api.post("/products/recommend", {
        client_id: clientId,
        product_id: selectedProduct,
        note: note || null,
      });
      setSent("Recommendation sent.");
      setSelectedProduct("");
      setNote("");
    } catch (err) {
      setError(err?.response?.data?.message || "Could not send this recommendation.");
    } finally {
      setSending(false);
    }
  };

  const handleRefer = async () => {
    if (!selectedDermatologist || !appointmentDate || !appointmentTime) return;
    setReferring(true);
    setError("");
    try {
      await api.post(`/consultant/clients/${clientId}/refer-dermatologist`, {
        dermatologist_id: selectedDermatologist,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        reason: referralReason || null,
      });
      setReferred("Referral booked — the appointment now shows on the client's Bookings page.");
      setSelectedDermatologist("");
      setAppointmentDate("");
      setAppointmentTime("");
      setReferralReason("");
      loadSnapshot();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not book this referral.");
    } finally {
      setReferring(false);
    }
  };

  if (loading) return <Loading label="Loading client profile" />;

  return (
    <DashboardLayout items={CONSULTANT_SIDEBAR} roleLabel="Skincare Consultant">
      <ErrorBanner message={error} />

      {snapshot && (
        <>
          <div className="dashboard-header">
            <span className="eyebrow">Client Profile</span>
            <h1>{snapshot.full_name}</h1>
            <p>{snapshot.email}</p>
            <button className="btn btn-ghost" onClick={handleDownloadReport} disabled={downloading} style={{ marginTop: 10 }}>
              <FileDown size={15} /> {downloading ? "Preparing..." : "Download PDF Report"}
            </button>
          </div>

          <div className="client-profile-grid">
            <div className="glass-card client-profile-card">
              <h3>Skin overview</h3>
              <ClientRow label="Skin type" value={snapshot.skin_type || "Not set"} />
              <ClientRow label="Skin concerns" value={snapshot.skin_concerns || "Not set"} />
              <ClientRow
                label="Latest Skin Health Score"
                value={snapshot.latest_overall_score != null ? Math.round(snapshot.latest_overall_score) : "No assessment yet"}
              />
              <ClientRow label="Primary concern" value={snapshot.latest_primary_concern || "—"} />
              <ClientRow
                label="Improvement"
                value={
                  snapshot.improvement
                    ? `${snapshot.improvement.delta_points > 0 ? "+" : ""}${snapshot.improvement.delta_points} pts (${snapshot.improvement.trend})`
                    : "Not enough data yet"
                }
              />
              {snapshot.skin_photo_url && (
                <img src={snapshot.skin_photo_url} alt="Client skin" className="client-profile-photo" />
              )}
            </div>

            <div className="glass-card client-profile-card">
              <h3>Recommend a product</h3>
              {sent && <div className="alert alert-success">{sent}</div>}
              <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}>
                <option value="">Select a product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.brand} — {p.name}
                  </option>
                ))}
              </select>
              <textarea
                placeholder="Optional note for the client"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />
              <button className="btn btn-primary" onClick={handleRecommend} disabled={!selectedProduct || sending}>
                {sending ? "Sending..." : "Send recommendation"}
              </button>
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
              <h2 className="dashboard-section-title">Progress Photos</h2>
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
            <h2 className="dashboard-section-title">Refer to a Dermatologist</h2>
            <div className="glass-card client-profile-card">
              {referred && <div className="alert alert-success">{referred}</div>}
              <p style={{ marginBottom: 12, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                Users can't book a dermatologist directly — as their consultant, you're the bridge. Schedule the
                appointment here and it appears on the client's Bookings page and the dermatologist's roster.
              </p>
              <select value={selectedDermatologist} onChange={(e) => setSelectedDermatologist(e.target.value)}>
                <option value="">Select a dermatologist</option>
                {dermatologists.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.full_name}
                  </option>
                ))}
              </select>
              <div className="field-row" style={{ marginTop: 10 }}>
                <input type="date" value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} />
                <input type="time" value={appointmentTime} onChange={(e) => setAppointmentTime(e.target.value)} />
              </div>
              <textarea
                placeholder="Reason for referral"
                value={referralReason}
                onChange={(e) => setReferralReason(e.target.value)}
                rows={2}
                style={{ marginTop: 10, width: "100%" }}
              />
              <button
                className="btn btn-primary"
                onClick={handleRefer}
                disabled={!selectedDermatologist || !appointmentDate || !appointmentTime || referring}
                style={{ marginTop: 10 }}
              >
                {referring ? "Booking..." : "Refer to dermatologist"}
              </button>

              {snapshot.appointments?.length > 0 && (
                <div className="booking-history" style={{ marginTop: 16 }}>
                  <h4>Referral history</h4>
                  {snapshot.appointments.map((a) => (
                    <div key={a.id} className="booking-history-row">
                      <span>
                        Dr. {a.dermatologist_name} — {a.appointment_date} at {a.appointment_time}
                      </span>
                      <span className={`badge ${a.status === "Confirmed" ? "badge-active" : "badge-coming-soon"}`}>
                        {a.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="dashboard-section">
            <h2 className="dashboard-section-title">Routine Adjustment</h2>
            <div className="glass-card client-profile-card">
              <p style={{ marginBottom: 12, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                Replace this client's entire active routine. Changes reflect immediately on their Daily Planner.
              </p>
              <RoutineOverwriteForm clientId={clientId} />
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

function ClientRow({ label, value }) {
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
