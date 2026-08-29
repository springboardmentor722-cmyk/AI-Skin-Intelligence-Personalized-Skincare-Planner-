import { useEffect, useMemo, useState } from "react";
import MainLayout from "../../../layouts/MainLayout";
import { ADMIN_NAV_ITEMS } from "./adminNav";
import { getAllUsers } from "../../../services/admin";
import { getInitials } from "../../../utils/initials";

const ROLE_OPTIONS = ["All roles", "user", "consultant", "dermatologist", "admin"];

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All roles");

  useEffect(() => {
    getAllUsers()
      .then((res) => setUsers(res.data))
      .catch(() => setError("Couldn't load users. Is auth_service running?"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.full_name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "All roles" || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  return (
    <MainLayout navItems={ADMIN_NAV_ITEMS} brandLabel="Skin AI · Admin">
      <header>
        <h1 className="text-xl font-semibold">Users</h1>
        <p className="text-sm text-ink-secondary">
          {loading ? "Loading..." : `${filtered.length} of ${users.length} users`}
        </p>
      </header>

      {error && <p className="pill pill-flagged py-2 px-4 w-fit">{error}</p>}

      <div className="glass p-5">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="field flex-1"
          />
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="field sm:w-44">
            {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
          <thead>
            <tr className="text-left text-ink-secondary border-b border-ink-primary/10">
              <th className="pb-2 font-medium" style={{ width: "40%" }}>User</th>
              <th className="pb-2 font-medium" style={{ width: "30%" }}>Email</th>
              <th className="pb-2 font-medium" style={{ width: "15%" }}>Role</th>
              <th className="pb-2 font-medium" style={{ width: "15%" }}>Joined</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-b border-ink-primary/5 last:border-0">
                <td className="py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="avatar bg-ocean-100 text-ocean-600">{getInitials(u.full_name)}</div>
                    <span className="text-ink-primary">{u.full_name}</span>
                  </div>
                </td>
                <td className="py-2.5 text-ink-secondary truncate">{u.email}</td>
                <td className="py-2.5 text-ink-secondary capitalize">{u.role}</td>
                <td className="py-2.5 text-ink-secondary font-mono text-xs">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-ink-secondary">No users match your filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Suspend/change-role actions still need PATCH /admin/users/{id} —
          not built yet. Add an actions column here once that exists. */}
    </MainLayout>
  );
}
