import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import Loading from "../components/Loading";
import ErrorBanner from "../components/ErrorBanner";
import api from "../api/axios";
import "./Dashboard.css";
import "./Lifestyle.css";
import { ADMIN_SIDEBAR } from "../config/sidebarConfig";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/admin/users")
      .then((res) => setUsers(res.data))
      .catch(() => setError("Could not load users."))
      .finally(() => setLoading(false));
  }, []);

  const toggleStatus = async (u) => {
    try {
      await api.put(`/admin/users/${u.id}/status`, null, {
        params: { is_active: !u.is_active },
      });
      setUsers((prev) =>
        prev.map((item) => (item.id === u.id ? { ...item, is_active: !item.is_active } : item))
      );
    } catch {
      setError("Could not update user status.");
    }
  };

  return (
    <DashboardLayout items={ADMIN_SIDEBAR} roleLabel="Administrator">
      <div className="dashboard-header">
        <span className="eyebrow">User management</span>
        <h1>All platform users</h1>
        <p>Every registered account, across all four roles.</p>
      </div>

      <ErrorBanner message={error} />

      {loading ? (
        <Loading label="Loading users" />
      ) : (
        <div className="lifestyle-table-wrapper glass-card">
          <table className="lifestyle-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.full_name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${u.is_active ? "badge-active" : "badge-coming-soon"}`}>
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <button className="link-button" onClick={() => toggleStatus(u)}>
                      {u.is_active ? "Deactivate" : "Activate"}
                    </button>
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
