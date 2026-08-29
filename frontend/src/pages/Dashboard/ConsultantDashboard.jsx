import { useEffect, useState } from "react";
import MainLayout from "../../layouts/MainLayout";
import { CONSULTANT_NAV_ITEMS } from "./consultant/consultantNav";
import { getConsultantClients } from "../../services/profile";
import { getInitials } from "../../utils/initials";
import { SkeletonTable } from "../../components/Skeleton";

export default function ConsultantDashboard() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getConsultantClients()
      .then((res) => setClients(res.data))
      .catch(() => setError("Couldn't load clients. Is profile_service running?"))
      .finally(() => setLoading(false));
  }, []);

  const metrics = [
    { label: "Total clients", value: clients.length },
  ];

  return (
    <MainLayout navItems={CONSULTANT_NAV_ITEMS} brandLabel="Skin AI · Consultant">
      <header>
        <h1 className="text-xl font-semibold">Client overview</h1>
        <p className="text-sm text-ink-secondary">Clients who've chosen you as their consultant</p>
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
        <h2 className="text-base font-semibold mb-4">Recent clients</h2>
        {loading ? (
          <SkeletonTable rows={4} />
        ) : (
          <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
            <thead>
              <tr className="text-left text-ink-secondary border-b border-ink-primary/10">
                <th className="pb-2 font-medium" style={{ width: "40%" }}>Client</th>
                <th className="pb-2 font-medium" style={{ width: "30%" }}>Skin type</th>
                <th className="pb-2 font-medium" style={{ width: "30%" }}>Goals</th>
              </tr>
            </thead>
            <tbody>
              {clients.slice(0, 5).map((c) => (
                <tr key={c.id} className="border-b border-ink-primary/5 last:border-0">
                  <td className="py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="avatar bg-ocean-100 text-ocean-600">{getInitials(c.name)}</div>
                      <span className="text-ink-primary">{c.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-ink-secondary">{c.skin_type}</td>
                  <td className="py-2.5 text-ink-secondary truncate">{c.goals}</td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr><td colSpan={3} className="py-8 text-center text-ink-secondary">No clients yet — none have picked you at profile setup.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </MainLayout>
  );
}
