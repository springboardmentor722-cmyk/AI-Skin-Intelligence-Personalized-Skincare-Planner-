import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { DashboardCard } from "../components/Cards";
import Loading from "../components/Loading";
import api from "../api/axios";
import "./Dashboard.css";
import { ADMIN_SIDEBAR } from "../config/sidebarConfig";

export default function AdminSystemStatus() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/system-status")
      .then((res) => setStatus(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout items={ADMIN_SIDEBAR} roleLabel="Administrator">
      <div className="dashboard-header">
        <span className="eyebrow">Platform health</span>
        <h1>System status</h1>
        <p>Live status of the API, database, and future AI modules.</p>
      </div>

      {loading ? (
        <Loading label="Checking system status" />
      ) : (
        <div className="dashboard-grid">
          <DashboardCard label="API" value={status?.api === "online" ? "Online" : "Offline"} accent />
          <DashboardCard
            label="Database"
            value={status?.database === "connected" ? "Connected" : "Disconnected"}
          />
          <DashboardCard label="AI Modules" value="Coming Soon" />
        </div>
      )}
    </DashboardLayout>
  );
}
