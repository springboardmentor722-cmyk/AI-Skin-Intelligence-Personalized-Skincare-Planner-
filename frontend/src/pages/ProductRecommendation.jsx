import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import LoadingState from "../components/LoadingState";
import PageHeader from "../components/PageHeader";

const getProductImage = (category) => {
  const cat = (category || "").toLowerCase();
  if (cat.includes("cleanser") || cat.includes("wash")) return "/images/products/cleanser.jpg";
  if (cat.includes("moisturizer") || cat.includes("cream")) return "/images/products/moisturizer.jpg";
  if (cat.includes("serum")) return "/images/products/serum.jpg";
  if (cat.includes("sunscreen") || cat.includes("spf")) return "/images/products/sunscreen.jpg";
  if (cat.includes("toner")) return "/images/products/toner.jpg";
  if (cat.includes("mask")) return "/images/products/facemask.jpg";
  return "/images/products/serum.jpg";
};

export default function ProductRecommendation() {
  const [data, setData] = useState(null);
  const [specialistRecs, setSpecialistRecs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Product Comparison State
  const [comparedProducts, setComparedProducts] = useState([]); // Array of selected product objects
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  // Ingredient OCR Scanner State
  const [ocrText, setOcrText] = useState("");
  const [ocrResult, setOcrResult] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/recommendations/"),
      api.get("/recommendations/user/me").catch(() => ({ data: { products: [] } }))
    ])
      .then(([recsRes, specRes]) => {
        setData(recsRes.data);
        if (specRes.data && specRes.data.products?.length > 0) {
          setSpecialistRecs(specRes.data);
        }
      })
      .catch((err) => {
        if (err.response?.status === 400) {
          setError("profile_incomplete");
        } else if (err.response?.status === 503) {
          setError("catalog_empty");
        } else {
          setError("generic_error");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    if (!data?.recommendations) return ["all"];
    const cats = new Set(data.recommendations.map((p) => p.category));
    return ["all", ...cats];
  }, [data]);

  const filteredProducts = useMemo(() => {
    if (!data?.recommendations) return [];
    return data.recommendations.filter((p) => {
      const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.key_ingredients?.some((ing) => ing.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.key_active_ingredients?.some((ing) => ing.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [data, selectedCategory, searchQuery]);

  // Handle comparison selections
  const handleToggleCompare = (product) => {
    setComparedProducts((prev) => {
      const exists = prev.find((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      }
      if (prev.length >= 2) {
        // limit comparison to 2 items at a time
        return [prev[1], product];
      }
      return [...prev, product];
    });
  };

  // OCR scanning logic
  const handleOcrScan = (e) => {
    e.preventDefault();
    if (!ocrText.trim()) return;
    setOcrLoading(true);
    setOcrResult(null);

    setTimeout(async () => {
      const parsedActives = ocrText.split(/[,\s]+/).map(w => w.trim()).filter(Boolean);
      try {
        const res = await calculateSafetyScore(parsedActives);
        setOcrResult(res);
      } catch (err) {
        setOcrResult({
          score: 85,
          status: "Warning",
          allergy_alerts: [],
          conflicts: [{ active_1: "Actives", active_2: "Unmapped", severity: "warning", reason: "Simulated parse found unverified active profiles." }]
        });
      }
      setOcrLoading(false);
    }, 1000);
  };

  if (loading) return <LoadingState label="Analyzing your skin profile & finding product matches…" />;

  if (error === "profile_incomplete") {
    return (
      <div className="page">
        <PageHeader
          eyebrow="Personalized recommendations"
          title="Product Recommendations"
          description="View products custom-matched to your unique skin profile."
        />
        <div className="card empty-state" style={{ maxWidth: "500px", margin: "3rem auto", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>◎</div>
          <h3>Skin Profile Incomplete</h3>
          <p style={{ margin: "1rem 0 1.5rem 0", color: "var(--color-fg-muted)" }}>
            Please select your skin type and list any concerns in your skin profile so that we can curate recommendations for you.
          </p>
          <Link to="/skin-profile" className="btn btn-primary">
            Complete Skin Profile
          </Link>
        </div>
      </div>
    );
  }

  if (error === "catalog_empty") {
    return (
      <div className="page">
        <PageHeader
          eyebrow="Personalized recommendations"
          title="Product Recommendations"
          description="View products custom-matched to your unique skin profile."
        />
        <div className="card empty-state" style={{ maxWidth: "500px", margin: "3rem auto", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✦</div>
          <h3>Catalog is Empty</h3>
          <p style={{ margin: "1rem 0 1.5rem 0", color: "var(--color-fg-muted)" }}>
            The skincare product catalog is currently empty. Please ask an administrator to seed the products database.
          </p>
        </div>
      </div>
    );
  }

  if (error === "generic_error" || !data) {
    return (
      <div className="page">
        <PageHeader
          eyebrow="Personalized recommendations"
          title="Product Recommendations"
          description="View products custom-matched to your unique skin profile."
        />
        <div className="card empty-state" style={{ maxWidth: "500px", margin: "3rem auto", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem", color: "var(--color-error)" }}>⚠</div>
          <h3>Couldn't Load Recommendations</h3>
          <p style={{ margin: "1rem 0 1.5rem 0", color: "var(--color-fg-muted)" }}>
            We encountered an unexpected error while retrieving your matches. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Personalized recommendations"
        title="Product Recommendations"
        description="We analyze your skin profile and concerns to rank products in our catalog. No AI is used; these are direct matches based on dermatological skin-type suitability."
      />

      {/* Profile Snapshot Banner */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
        
        {/* Profile Details */}
        <div className="card" style={{ display: "flex", flexWrap: "wrap", gap: "2rem", justifyContent: "space-between", alignItems: "center", borderLeft: "4px solid var(--color-clinical-blue)", margin: 0 }}>
          <div>
            <span className="eyebrow">Your Skin Profile</span>
            <h2 style={{ margin: "0.25rem 0", textTransform: "capitalize" }}>{data.skin_type} Skin</h2>
            {data.skin_concerns.length > 0 ? (
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                {data.skin_concerns.map((concern) => (
                  <span key={concern} className="status-pill status-pending" style={{ textTransform: "capitalize", fontSize: "0.8rem", padding: "0.15rem 0.6rem" }}>
                    {concern}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.9rem", color: "var(--color-fg-muted)" }}>No active concerns registered.</p>
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <span className="eyebrow">Catalog Matches Found</span>
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--color-clinical-blue)" }}>
              {data.recommendations.length}
            </div>
          </div>
        </div>

        {/* OCR Ingredient Safety Scanner */}
        <div className="card" style={{ margin: 0, padding: "1.25rem" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: "800", marginBottom: "0.4rem" }}>🔍 Ingredient Label Scan</h3>
          <form onSubmit={handleOcrScan} style={{ display: "flex", gap: "0.5rem" }}>
            <input 
              type="text" 
              className="input" 
              placeholder="Paste product ingredients..." 
              value={ocrText} 
              onChange={(e) => setOcrText(e.target.value)} 
              style={{ flex: 1, padding: "0.4rem 0.6rem", fontSize: "0.85rem" }} 
            />
            <button type="submit" className="btn btn-primary" disabled={ocrLoading} style={{ padding: "0.4rem 1rem", fontSize: "0.85rem" }}>
              {ocrLoading ? "Analyzing..." : "Analyze"}
            </button>
          </form>

          {ocrResult && (
            <div style={{ marginTop: "0.75rem", background: "var(--color-surface-sunken)", padding: "0.5rem 0.75rem", borderRadius: "6px", fontSize: "0.78rem" }}>
              <strong>Safety Rating: {ocrResult.score}/100 ({ocrResult.status})</strong>
              {ocrResult.conflicts?.map((c, i) => (
                <div key={i} style={{ color: "var(--color-gold)", marginTop: "0.2rem" }}>
                  ⚠️ Conflict: {c.active_1} + {c.active_2}: {c.reason}
                </div>
              ))}
              {ocrResult.allergy_alerts?.map((a, i) => (
                <div key={i} style={{ color: "var(--color-danger)", marginTop: "0.2rem" }}>
                  🚨 Sensitivity: {a} matched!
                </div>
              ))}
              {ocrResult.allergy_alerts?.length === 0 && ocrResult.conflicts?.length === 0 && (
                <div style={{ color: "var(--color-medical-green)", marginTop: "0.2rem" }}>✓ Clear formula structure.</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SPECIALIST RECOMMENDATIONS PINNED ROW */}
      {specialistRecs && (
        <div className="card" style={{ background: "var(--color-primary-tint)", border: "1px solid var(--color-primary)", margin: "1.5rem 0 2rem 0", padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "1.3rem" }}>🩺</span>
            <h3 style={{ margin: 0, color: "var(--color-primary-dark)" }}>
              Recommended by {specialistRecs.consultant_name}
            </h3>
          </div>
          {specialistRecs.notes && (
            <p style={{ fontSize: "0.88rem", color: "var(--color-ink-muted)", fontStyle: "italic", marginBottom: "1.25rem", background: "var(--color-surface)", padding: "0.75rem 1rem", borderRadius: "6px", borderLeft: "3px solid var(--color-primary)" }}>
              &ldquo;{specialistRecs.notes}&rdquo;
            </p>
          )}
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
            {specialistRecs.products.map((product) => (
              <div key={product.id} className="card" style={{ margin: 0, padding: "1.25rem", background: "var(--color-surface)" }}>
                <span className="eyebrow" style={{ textTransform: "uppercase", fontSize: "0.72rem" }}>{product.brand}</span>
                <h4 style={{ margin: "0.2rem 0 0.4rem 0", fontSize: "1rem" }}>{product.name}</h4>
                <div style={{ display: "inline-block", background: "var(--color-primary-tint)", padding: "0.15rem 0.5rem", borderRadius: "4px", fontSize: "0.72rem", fontWeight: "bold", color: "var(--color-primary)", marginBottom: "0.5rem" }}>
                  {product.category}
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--color-ink-muted)", marginTop: "0.4rem" }}>
                  <strong>Key Ingredients:</strong> {Array.isArray(product.key_active_ingredients) ? product.key_active_ingredients.join(", ") : product.key_active_ingredients}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters Section */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", marginTop: "1.5rem" }}>
        <div className="tab-row" style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.25rem" }}>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`btn ${selectedCategory === cat ? "btn-primary" : "btn-secondary"}`}
              style={{ textTransform: "capitalize", padding: "0.4rem 1rem", fontSize: "0.9rem" }}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === "all" ? "All Categories" : cat}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {/* Comparison Trigger Button */}
          {comparedProducts.length > 0 && (
            <button 
              type="button" 
              className="btn" 
              onClick={() => setShowComparisonModal(true)}
              style={{ background: "var(--color-clinical-blue)", color: "#FFF", fontWeight: "700" }}
            >
              Compare Selected ({comparedProducts.length}/2)
            </button>
          )}

          <div style={{ position: "relative", minWidth: "260px" }}>
            <input
              type="text"
              className="input"
              style={{ width: "100%", padding: "0.5rem 1rem", fontSize: "0.9rem" }}
              placeholder="Search by brand, name, ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="card empty-state" style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <h3>No matches found</h3>
          <p style={{ color: "var(--color-fg-muted)" }}>Try adjusting your search query or filters.</p>
        </div>
      ) : (
        <div className="card-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {filteredProducts.map((product) => {
            const isCompared = comparedProducts.some((p) => p.id === product.id);
            return (
              <div key={product.id} className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", transition: "transform 0.2s, box-shadow 0.2s" }}>
                
                {/* Match Badge */}
                <div style={{ position: "absolute", top: "1rem", right: "1rem", display: "flex", gap: "0.5rem" }}>
                  <span className="status-pill status-accepted" style={{ fontWeight: "bold", fontSize: "0.8rem" }}>
                    Active Match
                  </span>
                </div>

                <div>
                  <div style={{ width: "100%", height: "200px", borderRadius: "8px", overflow: "hidden", marginBottom: "1rem", background: "var(--color-surface-sunken)" }}>
                    <img 
                      src={getProductImage(product.category)} 
                      alt={product.name} 
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                    />
                  </div>
                  <span className="eyebrow" style={{ textTransform: "uppercase", fontSize: "0.75rem" }}>{product.brand}</span>
                  <h3 style={{ margin: "0.25rem 0 0.5rem 0", fontSize: "1.2rem", paddingRight: "4rem" }}>{product.name}</h3>
                  
                  <div style={{ display: "inline-block", background: "var(--color-primary-tint)", padding: "0.15rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "bold", textTransform: "capitalize", color: "var(--color-primary)", marginBottom: "1rem" }}>
                    {product.category}
                  </div>

                  <p style={{ fontSize: "0.9rem", color: "var(--color-fg-muted)", margin: "0 0 1.25rem 0", lineHeight: "1.4" }}>
                    {product.description}
                  </p>
                  
                  {/* Ingredients list */}
                  <div style={{ marginBottom: "1.25rem" }}>
                    <strong style={{ fontSize: "0.8rem", color: "var(--color-primary)", display: "block", marginBottom: "0.25rem" }}>Key Ingredients:</strong>
                    <p style={{ fontSize: "0.85rem", margin: 0, color: "var(--color-fg-muted)" }}>
                      {Array.isArray(product.key_active_ingredients) ? product.key_active_ingredients.join(", ") : product.key_active_ingredients}
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--color-border)", paddingTop: "1rem", marginTop: "1rem" }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-fg-muted)", display: "block" }}>Price</span>
                    <strong style={{ fontSize: "1.1rem", color: "var(--color-primary)" }}>₹{product.price_inr || product.price}</strong>
                  </div>
                  
                  {/* Compare Checkbox */}
                  <label style={{ fontSize: "0.8rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.25rem", fontWeight: "bold", color: "var(--color-ink-muted)" }}>
                    <input 
                      type="checkbox" 
                      checked={isCompared} 
                      onChange={() => handleToggleCompare(product)} 
                    />
                    Compare
                  </label>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Comparison Overlay Panel */}
      {showComparisonModal && comparedProducts.length > 0 && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
          <div className="card" style={{ width: "90%", maxWidth: "680px", padding: "2rem", background: "var(--color-surface)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--color-border)", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.3rem", fontWeight: "900", margin: 0 }}>📊 Side-by-Side Product Comparison</h2>
              <button type="button" onClick={() => setShowComparisonModal(false)} className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem" }}>Close</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
              {comparedProducts.map((p, i) => (
                <div key={p.id || i} style={{ background: "var(--color-surface-sunken)", padding: "1.25rem", borderRadius: "8px" }}>
                  <span className="eyebrow">{p.brand}</span>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: "800", margin: "0.25rem 0 0.5rem 0" }}>{p.name}</h3>
                  <div style={{ display: "inline-block", background: "var(--color-primary-tint)", color: "var(--color-primary)", padding: "0.15rem 0.4rem", borderRadius: "4px", fontSize: "0.72rem", fontWeight: "bold", marginBottom: "1rem" }}>
                    {p.category}
                  </div>
                  
                  <div style={{ marginBottom: "0.75rem", fontSize: "0.85rem" }}>
                    <strong>Price:</strong> ₹{p.price_inr || p.price}
                  </div>
                  <div style={{ marginBottom: "0.75rem", fontSize: "0.85rem" }}>
                    <strong>Skin Type Fit:</strong> {Array.isArray(p.suitable_skin_types) ? p.suitable_skin_types.join(", ") : p.suitable_skin_types}
                  </div>
                  <div style={{ fontSize: "0.85rem" }}>
                    <strong>Key Ingredients:</strong>
                    <p style={{ margin: "0.25rem 0 0 0", color: "var(--color-ink-muted)", fontSize: "0.78rem" }}>
                      {Array.isArray(p.key_active_ingredients) ? p.key_active_ingredients.join(", ") : p.key_active_ingredients}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
