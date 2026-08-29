import React, { useEffect, useMemo, useState } from "react";
import MainLayout from "../../layouts/MainLayout";
import { ADMIN_NAV_ITEMS } from "./admin/adminNav";
import { getAllUsers } from "../../services/admin";
import { getInitials } from "../../utils/initials";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAllUsers()
      .then((res) => setUsers(res.data))
      .catch(() => setError("Couldn't load users. Is auth_service running?"))
      .finally(() => setLoading(false));
  }, []);

  // Every number here is derived from the real /auth/users response —
  // no invented "active today" or "open flags" stats, since nothing in
  // the backend tracks those yet.
  const metrics = useMemo(() => {
    const count = (role) => users.filter((u) => u.role === role).length;
    return [
      { label: "Total users", value: users.length },
      { label: "Consultants", value: count("consultant") },
      { label: "Dermatologists", value: count("dermatologist") },
      { label: "Admins", value: count("admin") },
    ];
  }, [users]);

  const recentUsers = users.slice(0, 5);

  return (
    <MainLayout navItems={ADMIN_NAV_ITEMS} brandLabel="Skin AI · Admin">
      <header>
        <h1 className="text-xl font-semibold">Platform overview</h1>
        <p className="text-sm text-ink-secondary">Live counts from your Postgres users table</p>
      </header>

      {error && <p className="pill pill-flagged py-2 px-4 w-fit">{error}</p>}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className="glass metric-card">
            <span className="metric-label">{m.label}</span>
            <span className="metric-value">{loading ? "—" : m.value}</span>
          </div>
        ))}
      </div>

      <div className="glass p-5">
        <h2 className="text-base font-semibold mb-4">Recently joined</h2>

        <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
          <thead>
            <tr className="text-left text-ink-secondary border-b border-ink-primary/10">
              <th className="pb-2 font-medium" style={{ width: "45%" }}>User</th>
              <th className="pb-2 font-medium" style={{ width: "30%" }}>Role</th>
              <th className="pb-2 font-medium" style={{ width: "25%" }}>Joined</th>
            </tr>
          </thead>
          <tbody>
            {recentUsers.map((u) => (
              <tr key={u.id} className="border-b border-ink-primary/5 last:border-0">
                <td className="py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="avatar bg-ocean-100 text-ocean-600">{getInitials(u.full_name)}</div>
                    <span className="text-ink-primary">{u.full_name}</span>
                  </div>
                </td>
                <td className="py-2.5 text-ink-secondary capitalize">{u.role}</td>
                <td className="py-2.5 text-ink-secondary font-mono text-xs">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {!loading && recentUsers.length === 0 && (
              <tr>
                <td colSpan={3} className="py-8 text-center text-ink-secondary">No users yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </MainLayout>
  );
}
