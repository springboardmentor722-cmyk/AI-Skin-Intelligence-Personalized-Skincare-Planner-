import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import ErrorBanner from "../components/ErrorBanner";
import Loading from "../components/Loading";
import api from "../api/axios";
import "./Dashboard.css";
import "./Lifestyle.css";
import { DERMATOLOGIST_SIDEBAR } from "../config/sidebarConfig";

const STATUSES = ["Pending", "Confirmed", "Completed", "Cancelled"];

export default function PatientsList() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const load = () => {
    api
      .get("/dermatologist/patients")
      .then((res) => setAppointments(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleStatusChange = async (appointmentId, status) => {
    setError("");
    try {
      await api.put(`/dermatologist/appointments/${appointmentId}/status`, { status });
      load();
    } catch {
      setError("Could not update that appointment.");
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return appointments;
    return appointments.filter((a) => a.patient_name?.toLowerCase().includes(q));
  }, [appointments, search]);

  return (
    <DashboardLayout items={DERMATOLOGIST_SIDEBAR} roleLabel="Dermatologist">
      <div className="dashboard-header">
        <span className="eyebrow">Patient management</span>
        <h1>Patients & appointments</h1>
        <p>Everyone who has booked an appointment with you.</p>
      </div>

      <ErrorBanner message={error} />

      {!loading && appointments.length > 0 && (
        <div className="topbar-search" style={{ maxWidth: 320, marginBottom: 20 }}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Search patients by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {loading ? (
        <Loading label="Loading patients" />
      ) : appointments.length === 0 ? (
        <div className="glass-card empty-state">
          <p>No appointments booked yet.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card empty-state">
          <p>No patients match "{search}".</p>
        </div>
      ) : (
        <div className="lifestyle-table-wrapper glass-card">
          <table className="lifestyle-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Date</th>
                <th>Time</th>
                <th>Reason</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td>{a.patient_name}</td>
                  <td>{a.appointment_date}</td>
                  <td>{a.appointment_time}</td>
                  <td>{a.reason || "—"}</td>
                  <td>
                    <select value={a.status} onChange={(e) => handleStatusChange(a.id, e.target.value)}>
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <Link to={`/dermatologist/patients/${a.patient_id}`} className="link-button">
                      View record
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
