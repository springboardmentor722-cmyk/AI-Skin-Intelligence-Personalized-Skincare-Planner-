import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import ConcernBarList from "../components/ConcernBarList";
import ProductImage from "../components/ProductImage";
import Loading from "../components/Loading";
import api from "../api/axios";
import { ADMIN_SIDEBAR } from "../config/sidebarConfig";
import { Star, Users, TrendingUp, ShoppingBag } from "lucide-react";
import "./Dashboard.css";
import "./RichDashboard.css";

export default function AdminRecommendations() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/recommendations")
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout items={ADMIN_SIDEBAR} roleLabel="Administrator">
      <div className="dashboard-header">
        <span className="eyebrow">Recommendation monitoring</span>
        <h1>What consultants are recommending</h1>
        <p>Visibility into consultant recommendation activity and how well the recommendation engine performs.</p>
      </div>

      {loading || !data ? (
        <Loading label="Loading recommendation data" />
      ) : (
        <>
          <div className="stat-row">
            <StatCard icon={Star} label="Total Recommendations" value={data.total_recommendations} tone="indigo" />
            <StatCard
              icon={TrendingUp}
              label="Conversion Rate"
              value={data.conversion_rate_pct != null ? `${data.conversion_rate_pct}%` : "—"}
              sub="Recommended product later ordered"
              tone="green"
            />
            <StatCard
              icon={ShoppingBag}
              label="Top Product"
              value={data.top_recommended_products[0]?.label || "—"}
              tone="blue"
            />
            <StatCard
              icon={Users}
              label="Top Consultant"
              value={data.top_recommending_consultants[0]?.label || "—"}
              tone="amber"
            />
          </div>

          <div className="rich-grid rich-grid-2-1">
            <div className="glass-card rich-table-card">
              <h3>Recent Recommendations</h3>
              {data.recent_recommendations.length === 0 ? (
                <p className="donut-empty">No recommendations have been sent yet.</p>
              ) : (
                <table className="rich-table">
                  <thead>
                    <tr>
                      <th>Consultant</th>
                      <th>Client</th>
                      <th>Product</th>
                      <th>Ordered?</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent_recommendations.map((r) => (
                      <tr key={r.id}>
                        <td>{r.consultant_name}</td>
                        <td>{r.client_name}</td>
                        <td>
                          <div className="rich-table-person">
                            <ProductImage category={r.product_category} size={28} />
                            <span>
                              {r.product_brand} — {r.product_name}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${r.was_ordered ? "badge-active" : "badge-coming-soon"}`}>
                            {r.was_ordered ? "Yes" : "Not yet"}
                          </span>
                        </td>
                        <td>{new Date(r.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="rich-grid" style={{ gridTemplateColumns: "1fr", margin: 0 }}>
              <ConcernBarList title="Top Recommended Products" data={data.top_recommended_products} />
              <ConcernBarList title="Top Recommending Consultants" data={data.top_recommending_consultants} />
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
