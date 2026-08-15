import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, ClipboardCheck, CalendarClock, Star, TrendingUp } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import ScoreRing from "../components/ScoreRing";
import Avatar from "../components/Avatar";
import DonutChartCard from "../components/DonutChartCard";
import ConcernBarList from "../components/ConcernBarList";
import Loading from "../components/Loading";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { CONSULTANT_SIDEBAR } from "../config/sidebarConfig";
import "./Dashboard.css";
import "./RichDashboard.css";

export default function ConsultantDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/consultant/dashboard")
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout items={CONSULTANT_SIDEBAR} roleLabel="Skincare Consultant">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.full_name || "Consultant"} 👋</h1>
        <p>Here's what's happening with your clients today.</p>
      </div>

      {loading || !data ? (
        <Loading label="Loading dashboard" />
      ) : (
        <>
          <div className="stat-row">
            <StatCard icon={Users} label="Active Clients" value={data.assigned_clients_count} tone="indigo" />
            <StatCard icon={ClipboardCheck} label="Assessments Done" value={data.assessments_done_count} tone="green" />
            <StatCard icon={CalendarClock} label="Active Routines" value={data.active_routines_count} tone="blue" />
            <StatCard
              icon={TrendingUp}
              label="Avg. Improvement"
              value={data.avg_improvement_pct != null ? `${data.avg_improvement_pct > 0 ? "+" : ""}${data.avg_improvement_pct}%` : "—"}
              sub={data.avg_score != null ? `Avg. score: ${Math.round(data.avg_score)}` : undefined}
              tone="amber"
            />
            <StatCard icon={Star} label="Recommendations Sent" value={data.recommendations_sent} tone="rose" />
          </div>

          {(data.clients_improved_count > 0 || data.clients_need_attention_count > 0) && (
            <div className="improvement-chip-row">
              <span className="badge badge-active">↑ {data.clients_improved_count} clients improved</span>
              {data.clients_need_attention_count > 0 && (
                <span className="badge badge-coming-soon">↓ {data.clients_need_attention_count} need attention</span>
              )}
            </div>
          )}

          <div className="rich-grid rich-grid-2-1">
            <div className="glass-card rich-table-card">
              <div className="rich-table-header">
                <h3>Client Overview</h3>
                <Link to="/consultant/clients" className="link-button">
                  View All Clients →
                </Link>
              </div>
              {data.clients_table.length === 0 ? (
                <p className="donut-empty">No clients have booked you yet.</p>
              ) : (
                <table className="rich-table">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Skin Type</th>
                      <th>Top Concern</th>
                      <th>Score</th>
                      <th>Last Assessment</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.clients_table.map((c) => (
                      <tr key={c.client_id}>
                        <td>
                          <div className="rich-table-person">
                            <Avatar name={c.client_name} size={34} />
                            <div>
                              <Link to={`/consultant/clients/${c.client_id}`} className="rich-table-person-name">
                                {c.client_name}
                              </Link>
                              <p className="rich-table-person-sub">
                                {c.age ? `${c.age}, ` : ""}
                                {c.gender || ""}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td>{c.skin_type || "—"}</td>
                        <td>{c.top_concern || "—"}</td>
                        <td>
                          <ScoreRing score={c.overall_score} size={40} />
                        </td>
                        <td>{c.last_assessment_at ? new Date(c.last_assessment_at).toLocaleDateString() : "—"}</td>
                        <td>
                          <span className={`badge ${c.status === "Active" ? "badge-active" : "badge-coming-soon"}`}>
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <DonutChartCard title="Clients by Skin Type" data={data.skin_type_distribution} centerLabel="Clients" />
          </div>

          <div className="rich-grid rich-grid-2-1">
            <div className="glass-card rich-table-card">
              <h3>Recent Assessments</h3>
              {data.recent_assessments.length === 0 ? (
                <p className="donut-empty">No assessments yet.</p>
              ) : (
                <div className="rich-list">
                  {data.recent_assessments.map((a, i) => (
                    <div className="rich-list-row" key={i}>
                      <div className="rich-table-person">
                        <Avatar name={a.client_name} size={34} />
                        <div>
                          <span className="rich-table-person-name">{a.client_name}</span>
                          <p className="rich-table-person-sub">{new Date(a.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      <ScoreRing score={a.overall_score} size={40} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <ConcernBarList title="Top Skin Concerns" data={data.top_concerns} />
          </div>

          <div className="glass-card tip-banner">
            <span>💡</span>
            <p>
              <strong>Tip:</strong> Clients who follow their routine consistently tend to see better Skin Health
              Scores over time. Encourage hydration and sunscreen daily.
            </p>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
