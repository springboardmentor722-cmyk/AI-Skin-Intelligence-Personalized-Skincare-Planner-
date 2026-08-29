import { useEffect, useMemo, useState } from "react";
import MainLayout from "../../../layouts/MainLayout";
import { DERM_NAV_ITEMS } from "./dermNav";
import { getDermatologistPatients } from "../../../services/profile";
import { getInitials } from "../../../utils/initials";
import { SkeletonTable } from "../../../components/Skeleton";

export default function DermatologistPatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getDermatologistPatients().then((res) => setPatients(res.data)).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => patients.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
    [patients, search]
  );

  return (
    <MainLayout navItems={DERM_NAV_ITEMS} brandLabel="Skin AI · Dermatologist">
      <header>
        <h1 className="text-xl font-semibold">Patients</h1>
        <p className="text-sm text-ink-secondary">{loading ? "Loading..." : `${filtered.length} of ${patients.length} patients`}</p>
      </header>

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
                <th className="pb-2 font-medium" style={{ width: "30%" }}>Patient</th>
                <th className="pb-2 font-medium" style={{ width: "10%" }}>Age</th>
                <th className="pb-2 font-medium" style={{ width: "20%" }}>Skin type</th>
                <th className="pb-2 font-medium" style={{ width: "40%" }}>Concerns</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-ink-primary/5 last:border-0">
                  <td className="py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="avatar bg-ocean-100 text-ocean-600">{getInitials(p.name)}</div>
                      <span className="text-ink-primary">{p.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-ink-secondary">{p.age}</td>
                  <td className="py-2.5 text-ink-secondary">{p.skin_type}</td>
                  <td className="py-2.5 text-ink-secondary truncate">{p.skin_concerns}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-ink-secondary">No patients match.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </MainLayout>
  );
}
