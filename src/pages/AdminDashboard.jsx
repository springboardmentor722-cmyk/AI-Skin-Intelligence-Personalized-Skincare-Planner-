import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Users, ClipboardCheck, ShoppingBag, IndianRupee, Activity, UserPlus, PackagePlus, TrendingUp, Star } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import DonutChartCard from "../components/DonutChartCard";
import ConcernBarList from "../components/ConcernBarList";
import Loading from "../components/Loading";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { ADMIN_SIDEBAR } from "../config/sidebarConfig";
import "./Dashboard.css";
import "./RichDashboard.css";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get("/admin/dashboard"),
      api.get("/admin/activity-logs"),
      api.get("/admin/system-status"),
    ]).then(([statsRes, activityRes, statusRes]) => {
      if (statsRes.status === "fulfilled") setStats(statsRes.value.data);
      if (activityRes.status === "fulfilled") setActivity(activityRes.value.data.slice(0, 6));
      if (statusRes.status === "fulfilled") setSystemStatus(statusRes.value.data);
      setLoading(false);
    });
  }, []);

  const roleDistribution = stats
    ? Object.entries(stats.users_per_role).map(([label, count]) => ({ label, count }))
    : [];

  return (
    <DashboardLayout items={ADMIN_SIDEBAR} roleLabel="Administrator">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.full_name || "Admin"} 👋</h1>
        <p>Here's what's happening on your platform today.</p>
      </div>

      {loading || !stats ? (
        <Loading label="Loading dashboard" />
      ) : (
        <>
          <div className="stat-row">
            <StatCard icon={Users} label="Total Users" value={stats.total_users} tone="indigo" />
            <StatCard icon={ClipboardCheck} label="Assessments Completed" value={stats.total_assessments} tone="green" />
            <StatCard icon={ShoppingBag} label="Products in Catalog" value={stats.total_products} tone="blue" />
            <StatCard icon={IndianRupee} label="Platform Revenue" value={`₹${stats.total_revenue.toLocaleString()}`} tone="amber" />
            <StatCard
              icon={TrendingUp}
              label="Avg. Improvement"
              value={stats.avg_improvement_pct != null ? `${stats.avg_improvement_pct > 0 ? "+" : ""}${stats.avg_improvement_pct}%` : "—"}
              tone="green"
            />
            <StatCard
              icon={Activity}
              label="System Status"
              value={systemStatus?.api === "online" ? "Healthy" : "Checking..."}
              tone="rose"
            />
          </div>

          <div className="rich-grid rich-grid-2-1">
            <div className="glass-card rich-table-card">
              <h3>User Growth (last 8 weeks)</h3>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={stats.user_growth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis
                    dataKey="week_of"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="total_users" stroke="#4f46e5" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <DonutChartCard title="Users by Role" data={roleDistribution} centerLabel="Users" />
          </div>

          <div className="rich-grid rich-grid-2-1">
            <ConcernBarList title="Top Skin Concerns (Platform)" data={stats.top_concerns_platform} />

            <div className="glass-card rich-table-card">
              <h3>Recent Activity</h3>
              {activity.length === 0 ? (
                <p className="donut-empty">No activity recorded yet.</p>
              ) : (
                <div className="rich-list">
                  {activity.map((log) => (
                    <div className="activity-row" key={log.id}>
                      <div>
                        <p className="activity-row-action">{log.action}</p>
                        {log.details && <p className="activity-row-time">{log.details}</p>}
                      </div>
                      <p className="activity-row-time">{new Date(log.created_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="glass-card rich-table-card">
            <h3>Quick Actions</h3>
            <div className="quick-actions">
              <Link to="/admin/users" className="btn btn-ghost">
                <UserPlus size={16} /> View Users
              </Link>
              <Link to="/admin/system-status" className="btn btn-ghost">
                <Activity size={16} /> System Status
              </Link>
              <Link to="/admin/activity-logs" className="btn btn-ghost">
                <ClipboardCheck size={16} /> Activity Logs
              </Link>
              <Link to="/admin/recommendations" className="btn btn-ghost">
                <Star size={16} /> Recommendation Monitoring
              </Link>
              <Link to="/store" className="btn btn-ghost">
                <PackagePlus size={16} /> Browse Products
              </Link>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
