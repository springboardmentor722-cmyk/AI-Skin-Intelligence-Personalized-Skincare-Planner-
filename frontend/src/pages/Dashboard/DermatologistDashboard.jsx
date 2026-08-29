import { useEffect, useState } from "react";
import MainLayout from "../../layouts/MainLayout";
import { DERM_NAV_ITEMS } from "./dermatologist/dermNav";
import { getDermatologistPatients } from "../../services/profile";
import { getInitials } from "../../utils/initials";
import { SkeletonTable } from "../../components/Skeleton";

export default function DermatologistDashboard() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getDermatologistPatients()
      .then((res) => setPatients(res.data))
      .catch(() => setError("Couldn't load patients. Is profile_service running?"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <MainLayout navItems={DERM_NAV_ITEMS} brandLabel="Skin AI · Dermatologist">
      <header>
        <h1 className="text-xl font-semibold">Patient overview</h1>
        <p className="text-sm text-ink-secondary">Patients who've chosen you as their dermatologist</p>
      </header>

      {error && <p className="pill pill-flagged py-2 px-4 w-fit">{error}</p>}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass metric-card">
          <span className="metric-label">Total patients</span>
          <span className="metric-value">{loading ? "—" : patients.length}</span>
        </div>
      </div>

      <div className="glass p-5">
        <h2 className="text-base font-semibold mb-4">Recent patients</h2>
        {loading ? (
          <SkeletonTable rows={4} />
        ) : (
          <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
            <thead>
              <tr className="text-left text-ink-secondary border-b border-ink-primary/10">
                <th className="pb-2 font-medium" style={{ width: "40%" }}>Patient</th>
                <th className="pb-2 font-medium" style={{ width: "60%" }}>Concerns</th>
              </tr>
            </thead>
            <tbody>
              {patients.slice(0, 5).map((p) => (
                <tr key={p.id} className="border-b border-ink-primary/5 last:border-0">
                  <td className="py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="avatar bg-ocean-100 text-ocean-600">{getInitials(p.name)}</div>
                      <span className="text-ink-primary">{p.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-ink-secondary truncate">{p.skin_concerns}</td>
                </tr>
              ))}
              {patients.length === 0 && (
                <tr><td colSpan={2} className="py-8 text-center text-ink-secondary">No patients yet — none have picked you at profile setup.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </MainLayout>
  );
}
