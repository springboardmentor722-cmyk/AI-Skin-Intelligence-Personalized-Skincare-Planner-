import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, ClipboardCheck, CalendarClock, AlertCircle, TrendingUp } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import ScoreRing from "../components/ScoreRing";
import Avatar from "../components/Avatar";
import ConcernBarList from "../components/ConcernBarList";
import Loading from "../components/Loading";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { DERMATOLOGIST_SIDEBAR } from "../config/sidebarConfig";
import "./Dashboard.css";
import "./RichDashboard.css";

export default function DermatologistDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/dermatologist/dashboard")
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout items={DERMATOLOGIST_SIDEBAR} roleLabel="Dermatologist">
      <div className="dashboard-header">
        <h1>Welcome back, Dr. {user?.full_name || ""} 👋</h1>
        <p>Here's an overview of your patients and appointments.</p>
      </div>

      {loading || !data ? (
        <Loading label="Loading dashboard" />
      ) : (
        <>
          <div className="stat-row">
            <StatCard icon={Users} label="Total Patients" value={data.assigned_patients_count} tone="indigo" />
            <StatCard icon={ClipboardCheck} label="Assessments Done" value={data.assessments_done_count} tone="green" />
            <StatCard icon={CalendarClock} label="Active Treatment Plans" value={data.active_treatment_plans_count} tone="blue" />
            <StatCard
              icon={TrendingUp}
              label="Avg. Improvement"
              value={data.avg_improvement_pct != null ? `${data.avg_improvement_pct > 0 ? "+" : ""}${data.avg_improvement_pct}%` : "—"}
              sub={data.avg_score != null ? `Avg. score: ${Math.round(data.avg_score)}` : undefined}
              tone="amber"
            />
            <StatCard icon={AlertCircle} label="Follow-ups Due (7d)" value={data.follow_ups_due} tone="rose" />
          </div>

          {(data.patients_improving_count > 0 || data.patients_need_attention_count > 0) && (
            <div className="improvement-chip-row">
              <span className="badge badge-active">↑ {data.patients_improving_count} patients improving</span>
              {data.patients_need_attention_count > 0 && (
                <span className="badge badge-coming-soon">↓ {data.patients_need_attention_count} need attention</span>
              )}
            </div>
          )}

          <div className="rich-grid rich-grid-2-1">
            <div className="glass-card rich-table-card">
              <div className="rich-table-header">
                <h3>Patients Overview</h3>
                <Link to="/dermatologist/patients" className="link-button">
                  View All Patients →
                </Link>
              </div>
              {data.patients_table.length === 0 ? (
                <p className="donut-empty">No patients have booked an appointment yet.</p>
              ) : (
                <table className="rich-table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Concern</th>
                      <th>Score</th>
                      <th>Last Assessment</th>
                      <th>Status</th>
                      <th>Next Appt.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.patients_table.map((p) => (
                      <tr key={p.patient_id}>
                        <td>
                          <div className="rich-table-person">
                            <Avatar name={p.patient_name} size={34} />
                            <div>
                              <Link to={`/dermatologist/patients/${p.patient_id}`} className="rich-table-person-name">
                                {p.patient_name}
                              </Link>
                              <p className="rich-table-person-sub">
                                {p.age ? `${p.age}, ` : ""}
                                {p.gender || ""}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td>{p.primary_concern || "—"}</td>
                        <td>
                          <ScoreRing score={p.overall_score} size={40} />
                        </td>
                        <td>{p.last_assessment_at ? new Date(p.last_assessment_at).toLocaleDateString() : "—"}</td>
                        <td>
                          <span className={`badge ${p.status === "Confirmed" ? "badge-active" : "badge-coming-soon"}`}>
                            {p.status || "—"}
                          </span>
                        </td>
                        <td>{p.next_appointment_date || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <ConcernBarList title="Top Skin Concerns" data={data.top_concerns} />
          </div>

          <div className="glass-card rich-table-card">
            <h3>Recent Assessments</h3>
            {data.recent_assessments.length === 0 ? (
              <p className="donut-empty">No assessments yet.</p>
            ) : (
              <div className="rich-list">
                {data.recent_assessments.map((a, i) => (
                  <div className="rich-list-row" key={i}>
                    <div className="rich-table-person">
                      <Avatar name={a.patient_name} size={34} />
                      <div>
                        <span className="rich-table-person-name">{a.patient_name}</span>
                        <p className="rich-table-person-sub">{new Date(a.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <ScoreRing score={a.overall_score} size={40} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
