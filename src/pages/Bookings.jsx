import { useEffect, useState } from "react";
import api from "../api/axios";
import ErrorBanner from "../components/ErrorBanner";
import Loading from "../components/Loading";
import "./Bookings.css";

export default function Bookings() {
  return (
    <div className="bookings-page">
      <div className="dashboard-header">
        <span className="eyebrow">Care Team</span>
        <h1>Book a consultant</h1>
        <p>
          Your consultant is your ongoing point of contact — booking one starts right away. If they think you
          need a dermatologist, they'll refer you and schedule the appointment for you.
        </p>
      </div>

      <ConsultantBooking />
      <DermatologistAppointments />
    </div>
  );
}

function ConsultantBooking() {
  const [consultants, setConsultants] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState("");
  const [booking, setBooking] = useState(false);

  const load = () => {
    Promise.allSettled([api.get("/booking/consultants"), api.get("/booking/consultants/my")]).then(
      ([listRes, mineRes]) => {
        if (listRes.status === "fulfilled") setConsultants(listRes.value.data);
        if (mineRes.status === "fulfilled") setAssignments(mineRes.value.data);
        setLoading(false);
      }
    );
  };

  useEffect(load, []);

  const activeAssignment = assignments.find((a) => a.status === "Active");

  const handleBook = async () => {
    if (!selected) return;
    setBooking(true);
    setError("");
    try {
      await api.post("/booking/consultants", { consultant_id: selected, message: message || null });
      setMessage("");
      setSelected("");
      load();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not book this consultant.");
    } finally {
      setBooking(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("End this consultant relationship?")) return;
    try {
      await api.delete(`/booking/consultants/${id}`);
      load();
    } catch {
      setError("Could not cancel this booking.");
    }
  };

  if (loading) return <Loading label="Loading consultants" />;

  return (
    <div className="glass-card booking-card">
      <ErrorBanner message={error} />

      {activeAssignment ? (
        <div className="active-booking">
          <h3>Your consultant</h3>
          <p className="active-booking-name">{activeAssignment.consultant_name}</p>
          <span className="badge badge-active">{activeAssignment.status}</span>
          <button className="link-button danger" onClick={() => handleCancel(activeAssignment.id)}>
            End relationship
          </button>
        </div>
      ) : (
        <div className="booking-form">
          <h3>Choose a consultant</h3>
          <select value={selected} onChange={(e) => setSelected(e.target.value)}>
            <option value="">Select a consultant</option>
            {consultants.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name}
              </option>
            ))}
          </select>
          <textarea
            placeholder="Optional message — what would you like help with?"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
          />
          <button className="btn btn-primary" onClick={handleBook} disabled={!selected || booking}>
            {booking ? "Booking..." : "Book consultant"}
          </button>
        </div>
      )}

      {assignments.length > 0 && (
        <div className="booking-history">
          <h4>History</h4>
          {assignments.map((a) => (
            <div key={a.id} className="booking-history-row">
              <span>{a.consultant_name}</span>
              <span className={`badge ${a.status === "Active" ? "badge-active" : "badge-coming-soon"}`}>
                {a.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DermatologistAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/booking/dermatologists/my")
      .then((res) => setAppointments(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  return (
    <div className="glass-card booking-card" style={{ marginTop: 20 }}>
      <h3>Your dermatologist appointments</h3>
      <p className="donut-empty" style={{ marginBottom: 12 }}>
        These are scheduled by your consultant when they refer you to a dermatologist — you can't book one
        directly.
      </p>
      {appointments.length === 0 ? (
        <p className="donut-empty">No dermatologist appointments yet.</p>
      ) : (
        <div className="booking-history">
          {appointments.map((a) => (
            <div key={a.id} className="booking-history-row">
              <span>
                Dr. {a.dermatologist_name} — {a.appointment_date} at {a.appointment_time}
                {a.reason ? ` (${a.reason})` : ""}
              </span>
              <span className={`badge ${a.status === "Confirmed" ? "badge-active" : "badge-coming-soon"}`}>
                {a.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
