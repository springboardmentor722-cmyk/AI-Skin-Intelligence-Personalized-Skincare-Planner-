import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import Loading from "../components/Loading";
import ProductImage from "../components/ProductImage";
import api from "../api/axios";
import "./Dashboard.css";
import { CONSULTANT_SIDEBAR } from "../config/sidebarConfig";

export default function Recommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/products/recommendations/given")
      .then((res) => setRecommendations(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout items={CONSULTANT_SIDEBAR} roleLabel="Skincare Consultant">
      <div className="dashboard-header">
        <span className="eyebrow">Recommendations</span>
        <h1>Products you've recommended</h1>
        <p>Go to a client's profile to send a new recommendation.</p>
      </div>

      {loading ? (
        <Loading label="Loading recommendations" />
      ) : recommendations.length === 0 ? (
        <div className="glass-card empty-state">
          <p>You haven't recommended any products yet.</p>
        </div>
      ) : (
        <div className="glass-card activity-list">
          {recommendations.map((r) => (
            <div className="activity-row" key={r.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <ProductImage category={r.product.category} size={48} />
                <div>
                  <p className="activity-row-action">
                    {r.product.brand} — {r.product.name}
                  </p>
                  {r.note && <p className="activity-row-time">"{r.note}"</p>}
                </div>
              </div>
              <p className="activity-row-time">{new Date(r.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
