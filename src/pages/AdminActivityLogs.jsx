import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import Loading from "../components/Loading";
import api from "../api/axios";
import "./Dashboard.css";
import { ADMIN_SIDEBAR } from "../config/sidebarConfig";

export default function AdminActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/activity-logs")
      .then((res) => setLogs(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout items={ADMIN_SIDEBAR} roleLabel="Administrator">
      <div className="dashboard-header">
        <span className="eyebrow">Audit trail</span>
        <h1>Activity logs</h1>
        <p>The most recent notable actions across the platform.</p>
      </div>

      {loading ? (
        <Loading label="Loading activity" />
      ) : logs.length === 0 ? (
        <div className="glass-card empty-state">
          <p>No activity recorded yet.</p>
        </div>
      ) : (
        <div className="glass-card activity-list">
          {logs.map((log) => (
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
    </DashboardLayout>
  );
}
