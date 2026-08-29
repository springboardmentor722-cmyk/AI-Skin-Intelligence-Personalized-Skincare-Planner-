import { useEffect, useMemo, useState } from "react";
import MainLayout from "../../../layouts/MainLayout";
import { CONSULTANT_NAV_ITEMS } from "./consultantNav";
import { getConsultantClients } from "../../../services/profile";
import { getInitials } from "../../../utils/initials";
import { SkeletonTable } from "../../../components/Skeleton";

export default function ConsultantClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    getConsultantClients()
      .then((res) => setClients(res.data))
      .catch(() => setError("Couldn't load clients."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => clients.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())),
    [clients, search]
  );

  return (
    <MainLayout navItems={CONSULTANT_NAV_ITEMS} brandLabel="Skin AI · Consultant">
      <header>
        <h1 className="text-xl font-semibold">Clients</h1>
        <p className="text-sm text-ink-secondary">{loading ? "Loading..." : `${filtered.length} of ${clients.length} clients`}</p>
      </header>

      {error && <p className="pill pill-flagged py-2 px-4 w-fit">{error}</p>}

      <div className="glass p-5">
        <input
          type="text"
          placeholder="Search by name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="field mb-4"
        />
        {loading ? (
          <SkeletonTable rows={4} />
        ) : (
          <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
            <thead>
              <tr className="text-left text-ink-secondary border-b border-ink-primary/10">
                <th className="pb-2 font-medium" style={{ width: "30%" }}>Client</th>
                <th className="pb-2 font-medium" style={{ width: "10%" }}>Age</th>
                <th className="pb-2 font-medium" style={{ width: "20%" }}>Skin type</th>
                <th className="pb-2 font-medium" style={{ width: "40%" }}>Goals</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-ink-primary/5 last:border-0">
                  <td className="py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="avatar bg-ocean-100 text-ocean-600">{getInitials(c.name)}</div>
                      <span className="text-ink-primary">{c.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-ink-secondary">{c.age}</td>
                  <td className="py-2.5 text-ink-secondary">{c.skin_type}</td>
                  <td className="py-2.5 text-ink-secondary truncate">{c.goals}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-ink-secondary">No clients match.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </MainLayout>
  );
}
