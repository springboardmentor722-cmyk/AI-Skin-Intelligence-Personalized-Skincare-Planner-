import { useEffect, useState } from "react";
import MainLayout from "../../../layouts/MainLayout";
import { ADMIN_NAV_ITEMS } from "./adminNav";
import { getAdminRecommendationOverview } from "../../../services/recommendations";
import { SkeletonCard } from "../../../components/Skeleton";

export default function AdminRecommendations() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminRecommendationOverview()
      .then((res) => setOverview(res.data))
      .catch(() => setError("Couldn't load recommendation activity."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <MainLayout navItems={ADMIN_NAV_ITEMS} brandLabel="Skin AI · Admin">
      <header>
        <h1 className="text-xl font-semibold">Recommendations</h1>
        <p className="text-sm text-ink-secondary">
          Live catalog stats and what the recommendation engine is actually surfacing to users.
        </p>
      </header>

      {error && <p className="pill pill-flagged py-2 px-4 w-fit">{error}</p>}

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : overview ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="glass metric-card">
              <span className="metric-label">Products in catalog</span>
              <span className="metric-value">{overview.catalog_size}</span>
            </div>
            <div className="glass metric-card">
              <span className="metric-label">Users with recommendations</span>
              <span className="metric-value">{overview.users_with_recommendations}</span>
            </div>
            <div className="glass metric-card">
              <span className="metric-label">Categories covered</span>
              <span className="metric-value">{overview.category_breakdown.length}</span>
            </div>
          </div>

          <div className="glass p-5">
            <h2 className="text-base font-semibold mb-4">Catalog by category</h2>
            <div className="flex flex-wrap gap-2">
              {overview.category_breakdown.map((c) => (
                <span key={c.category} className="pill pill-flagged text-xs">
                  {c.category} · {c.count}
                </span>
              ))}
            </div>
          </div>

          <div className="glass p-5">
            <h2 className="text-base font-semibold mb-1">Most recommended products</h2>
            <p className="text-xs text-ink-secondary mb-4">
              Computed live across every user's latest assessment — not stored click data,
              since the engine doesn't log impressions yet.
            </p>
            {overview.top_recommended.length === 0 ? (
              <p className="text-ink-secondary text-center py-6">
                No users have completed an assessment yet — nothing to surface.
              </p>
            ) : (
              <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
                <thead>
                  <tr className="text-left text-ink-secondary border-b border-ink-primary/10">
                    <th className="pb-2 font-medium" style={{ width: "40%" }}>Product</th>
                    <th className="pb-2 font-medium" style={{ width: "25%" }}>Brand</th>
                    <th className="pb-2 font-medium" style={{ width: "20%" }}>Category</th>
                    <th className="pb-2 font-medium" style={{ width: "15%" }}>Recommended to</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.top_recommended.map((p) => (
                    <tr key={p.name} className="border-b border-ink-primary/5 last:border-0">
                      <td className="py-2.5 text-ink-primary">{p.name}</td>
                      <td className="py-2.5 text-ink-secondary">{p.brand}</td>
                      <td className="py-2.5 text-ink-secondary">{p.category}</td>
                      <td className="py-2.5 text-ink-secondary">{p.count} user{p.count === 1 ? "" : "s"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : (
        <div className="glass p-12 flex flex-col items-center text-center gap-3">
          <img src="/images/empty-state-default.png" alt="" className="w-32 h-32 object-contain" />
          <h2 className="text-base font-medium">No data yet</h2>
        </div>
      )}
    </MainLayout>
  );
}
