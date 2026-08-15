import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import Loading from "../components/Loading";
import api from "../api/axios";
import "./Dashboard.css";
import "./Lifestyle.css";
import { CONSULTANT_SIDEBAR } from "../config/sidebarConfig";

export default function ClientsList() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api
      .get("/consultant/clients")
      .then((res) => setClients(res.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => c.client_name?.toLowerCase().includes(q));
  }, [clients, search]);

  return (
    <DashboardLayout items={CONSULTANT_SIDEBAR} roleLabel="Skincare Consultant">
      <div className="dashboard-header">
        <span className="eyebrow">Client management</span>
        <h1>Assigned clients</h1>
        <p>Every client who has booked you, past and present.</p>
      </div>

      {!loading && clients.length > 0 && (
        <div className="topbar-search" style={{ maxWidth: 320, marginBottom: 20 }}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Search clients by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {loading ? (
        <Loading label="Loading clients" />
      ) : clients.length === 0 ? (
        <div className="glass-card empty-state">
          <p>No clients have booked you yet.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card empty-state">
          <p>No clients match "{search}".</p>
        </div>
      ) : (
        <div className="lifestyle-table-wrapper glass-card">
          <table className="lifestyle-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Message</th>
                <th>Status</th>
                <th>Since</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td>{c.client_name}</td>
                  <td>{c.message || "—"}</td>
                  <td>
                    <span className={`badge ${c.status === "Active" ? "badge-active" : "badge-coming-soon"}`}>
                      {c.status}
                    </span>
                  </td>
                  <td>{new Date(c.created_at).toLocaleDateString()}</td>
                  <td>
                    <Link to={`/consultant/clients/${c.client_id}`} className="link-button">
                      View profile
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
