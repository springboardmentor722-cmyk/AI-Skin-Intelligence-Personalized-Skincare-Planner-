import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import LoadingState from "../components/LoadingState";
import PageHeader from "../components/PageHeader";

function ConsultantStat({ label, value, note, trend, color, spark }) {
  return (
    <div className="card summary-card" style={{ display: "flex", flexDirection: "column", justify_content: "space-between", padding: "1.25rem", margin: 0, borderLeft: `4px solid ${color || "var(--color-primary)"}` }}>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.72rem", color: "var(--color-ink-muted)", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          <span>{label}</span>
          <span style={{ color: color || "var(--color-primary)", fontWeight: "bold" }}>{trend}</span>
        </div>
        <div style={{ fontSize: "1.8rem", fontWeight: "900", marginTop: "0.4rem", color: "var(--color-ink)" }}>{value}</div>
      </div>
      <div style={{ marginTop: "0.5rem" }}>
        <p className="summary-note" style={{ fontSize: "0.72rem", margin: "0 0 0.5rem 0", color: "var(--color-ink-muted)" }}>{note}</p>
        {spark && (
          <svg width="100%" height="20" style={{ overflow: "visible" }}>
            <path d={spark} fill="none" stroke={color || "var(--color-primary)"} strokeWidth="1.5" />
          </svg>
        )}
      </div>
    </div>
  );
}

export default function ConsultantDashboard() {
  const [me, setMe] = useState(null);
  const [profile, setProfile] = useState(null);
  const [patients, setPatients] = useState([]);
  const [dermatologists, setDermatologists] = useState([]);
  const [products, setProducts] = useState([]);
  const [recommendationLogs, setRecommendationLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Command Navigator state
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [commandSearch, setCommandSearch] = useState("");

  // Product Catalog addition form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProd, setNewProd] = useState({
    name: "",
    brand: "",
    category: "Moisturizer",
    price: 25.0,
    suitable_skin_types: "oily, dry, combination, sensitive, normal",
    key_active_ingredients: "Hyaluronic Acid, Niacinamide",
    description: "Clinical grade daily moisturizer."
  });
  const [addStatus, setAddStatus] = useState(null);
  const [adding, setAdding] = useState(false);

  // Interactive Task Management state
  const [tasks, setTasks] = useState([
    { id: 1, text: "Review Alice Johnson's 7-Day compliance log", status: "pending" },
    { id: 2, text: "Wait for Dr. Sarah Chen's referral report for Bob Smith", status: "waiting_derma" },
    { id: 3, text: "Analyze progress photo baseline upload for Charlie Brown", status: "pending" },
    { id: 4, text: "Completed prescription matching for David Jones", status: "completed" }
  ]);

  // Product Recommendation Form states
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [recNotes, setRecNotes] = useState("");
  const [recSubmitting, setRecSubmitting] = useState(false);
  const [recStatus, setRecStatus] = useState(null);

  const handleRecommendProduct = async (e) => {
    e.preventDefault();
    if (!selectedPatientId || !selectedProductId) {
      setRecStatus({ type: "error", text: "Please select a patient and a product." });
      return;
    }
    setRecSubmitting(true);
    setRecStatus(null);
    try {
      await api.post(`/recommendations/user/${selectedPatientId}`, {
        product_ids: [selectedProductId],
        notes: recNotes
      });
      setRecStatus({ type: "ok", text: "Product recommended to customer successfully." });
      setRecNotes("");
      loadData(); // reload logs
    } catch (err) {
      setRecStatus({ type: "error", text: "Recommendation submit failed. Verify connection." });
    } finally {
      setRecSubmitting(false);
    }
  };

  const loadData = async () => {
    try {
      const [meRes, profileRes, patientsRes, dermatologistsRes, recsRes, allRecsRes] = await Promise.all([
        api.get("/users/me"),
        api.get("/workspace/consultant-profile").catch(() => ({ data: null })),
        api.get("/workspace/consultant/patients").catch(() => ({ data: [] })),
        api.get("/workspace/consultant/dermatologists").catch(() => ({ data: [] })),
        api.get("/admin/products").catch(() => ({ data: [] })),
        api.get("/recommendations/all").catch(() => ({ data: [] })),
      ]);
      setMe(meRes.data);
      setProfile(profileRes.data);
      setPatients(patientsRes.data);
      setDermatologists(dermatologistsRes.data);
      if (recsRes.data && recsRes.data.length > 0) {
        setProducts(recsRes.data);
      } else {
        const fallback = await api.get("/recommendations/").catch(() => ({ data: { recommendations: [] } }));
        setProducts(fallback.data?.recommendations || []);
      }
      setRecommendationLogs(allRecsRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setAdding(true);
    setAddStatus(null);
    try {
      const payload = {
        name: newProd.name,
        brand: newProd.brand,
        category: newProd.category,
        price: Number(newProd.price),
        suitable_skin_types: newProd.suitable_skin_types.split(",").map(s => s.trim().toLowerCase()),
        key_active_ingredients: newProd.key_active_ingredients.split(",").map(s => s.trim()),
        description: newProd.description,
        safety_warnings: ["Patch test before initial application"],
        usage_instructions: "Apply evenly twice daily after cleansing."
      };
      await api.post("/recommendations/", payload);
      setAddStatus({ type: "ok", text: "Product added to clinical catalog successfully!" });
      setNewProd({
        name: "",
        brand: "",
        category: "Moisturizer",
        price: 25.0,
        suitable_skin_types: "oily, dry, combination, sensitive, normal",
        key_active_ingredients: "Hyaluronic Acid, Niacinamide",
        description: "Clinical grade daily moisturizer."
      });
      setShowAddForm(false);
      loadData();
    } catch {
      setAddStatus({ type: "error", text: "Failed to add product. Ensure all fields are filled." });
    } finally {
      setAdding(false);
    }
  };

  // Move CRM task status
  const handleMoveTask = (taskId, targetStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: targetStatus } : t));
  };

  if (loading) return <LoadingState label="Loading consultant workspace…" />;

  const firstName = me?.full_name?.split(" ")[0] || "there";

  const commandItems = [
    { title: "Review client profiles progress", icon: "👥", action: "/consultant/customers" },
    { title: "Open dermatologist contact chat", icon: "🩺", action: "/consultant/dermatologists" },
    { title: "Update consultant identity", icon: "⚙️", action: "/consultant/profile" }
  ].filter(item => item.title.toLowerCase().includes(commandSearch.toLowerCase()));

  return (
    <div className="page consultant-dashboard-page" style={{ padding: "0 1rem" }}>
      
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <PageHeader
          eyebrow="Clinical CRM Console"
          title={`Welcome back, ${firstName} 👋`}
          description="Manage client checklists, review progress photos, and coordinate clinical recommendations."
        />
        
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button 
            type="button" 
            onClick={() => setCommandPaletteOpen(true)}
            className="btn btn-secondary"
            style={{ fontSize: "0.8rem", padding: "0.4rem 0.75rem" }}
          >
            ⌘K Search Shortcuts
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <section className="section" style={{ marginBottom: "2rem" }}>
        <h2 className="section-title">Operations Summary</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
          <ConsultantStat
            label="Assigned Patients"
            value={patients.length}
            note="Direct diagnostic profiles active"
            trend="+1 this week"
            color="var(--color-primary)"
            spark="M5,20 L15,15 L25,12 L45,5"
          />
          <ConsultantStat
            label="Adherence Rate"
            value="84.2%"
            note="Average checklist completion"
            trend="Ideal"
            color="var(--color-clinical-blue)"
            spark="M5,5 Q15,15 25,8 T45,2"
          />
          <ConsultantStat
            label="Catalog Products"
            value={products.length}
            note="Available chemical formulas"
            trend="Stable"
            color="var(--color-accent)"
            spark="M5,10 L45,10"
          />
          <ConsultantStat
            label="Collaboration Rooms"
            value={dermatologists.length}
            note="Clinicians connected"
            trend="Active"
            color="var(--color-clinical-blue)"
            spark="M5,20 L25,5 L45,12"
          />
        </div>
      </section>

      {/* AI Insights & Task Board row */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "1.5rem", marginBottom: "2.5rem" }}>
        
        {/* Collaborative CRM Task Board */}
        <div className="card" style={{ margin: 0, padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "800", marginBottom: "1rem" }}>📋 CRM Diagnostic Task Board</h3>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <strong style={{ fontSize: "0.78rem", color: "var(--color-ink-muted)", textTransform: "uppercase", display: "block", marginBottom: "0.5rem" }}>⏳ Pending Reviews</strong>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {tasks.filter(t => t.status === "pending").map(t => (
                  <div key={t.id} style={{ background: "var(--color-surface-sunken)", padding: "0.6rem", borderRadius: "6px", fontSize: "0.82rem" }}>
                    {t.text}
                    <div style={{ marginTop: "0.4rem", display: "flex", gap: "0.25rem" }}>
                      <button type="button" className="btn btn-secondary" onClick={() => handleMoveTask(t.id, "waiting_derma")} style={{ padding: "0.1rem 0.3rem", fontSize: "0.7rem" }}>Escalate</button>
                      <button type="button" className="btn btn-primary" onClick={() => handleMoveTask(t.id, "completed")} style={{ padding: "0.1rem 0.3rem", fontSize: "0.7rem" }}>Resolve</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <strong style={{ fontSize: "0.78rem", color: "var(--color-primary)", textTransform: "uppercase", display: "block", marginBottom: "0.5rem" }}>✓ Resolved / Completed</strong>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {tasks.filter(t => t.status === "completed").map(t => (
                  <div key={t.id} style={{ background: "rgba(16,185,129,0.08)", border: "1px solid var(--color-primary)", padding: "0.6rem", borderRadius: "6px", fontSize: "0.82rem", color: "var(--color-primary-dark)" }}>
                    {t.text}
                    <div style={{ marginTop: "0.4rem" }}>
                      <span style={{ fontSize: "0.7rem", fontWeight: "bold" }}>✓ Verified Task Complete</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* AI Insight metrics */}
        <div className="card" style={{ margin: 0, padding: "1.5rem", display: "flex", flexDirection: "column", justify_content: "space-between" }}>
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "800", marginBottom: "0.5rem" }}>✨ AI Skin Intelligence Insights</h3>
            <p style={{ fontSize: "0.8rem", color: "var(--color-ink-muted)", marginBottom: "1rem" }}>Automated suggestions based on compliance timelines.</p>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ fontSize: "0.82rem", background: "var(--color-surface-sunken)", padding: "0.5rem 0.75rem", borderRadius: "6px" }}>
              💡 <strong>Compliance Flag:</strong> Patient hydration index dropped 15% this week. Suggest hydration reminder.
            </div>
            <div style={{ fontSize: "0.82rem", background: "var(--color-surface-sunken)", padding: "0.5rem 0.75rem", borderRadius: "6px" }}>
              💡 <strong>Therapy Alert:</strong> Niacinamide continues to show the highest efficacy match score for combination skin.
            </div>
          </div>
        </div>
      </div>

      {/* Product Recommendation Feature */}
      <section className="section" style={{ marginBottom: "2.5rem" }}>
        <h2 className="section-title">Recommend Products to Patient</h2>
        <div className="card" style={{ padding: "1.5rem", background: "var(--color-surface)", border: "1px solid var(--color-border)", margin: 0 }}>
          <form onSubmit={handleRecommendProduct} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            <div className="field">
              <label htmlFor="rec-patient-select" style={{ fontWeight: "700", marginBottom: "0.5rem", display: "block", fontSize: "0.85rem" }}>Select Patient *</label>
              <select 
                id="rec-patient-select" 
                value={selectedPatientId} 
                onChange={(e) => setSelectedPatientId(e.target.value)} 
                className="input"
                style={{ width: "100%", padding: "0.4rem" }}
                required
              >
                <option value="">-- Choose Assigned Patient --</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.full_name} ({p.email})</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="rec-product-select" style={{ fontWeight: "700", marginBottom: "0.5rem", display: "block", fontSize: "0.85rem" }}>Select Skincare Product *</label>
              <select 
                id="rec-product-select" 
                value={selectedProductId} 
                onChange={(e) => setSelectedProductId(e.target.value)} 
                className="input"
                style={{ width: "100%", padding: "0.4rem" }}
                required
              >
                <option value="">-- Choose Product from Catalog --</option>
                {products.map((p, idx) => (
                  <option key={p.id || idx} value={p.id || p.name}>
                    [{p.brand || "Derma"}] {p.name} - ₹{Math.round(p.price || p.price_inr || 499)}
                  </option>
                ))}
              </select>
            </div>

            <div className="field" style={{ gridColumn: "span 2" }}>
              <label htmlFor="rec-notes" style={{ fontWeight: "700", marginBottom: "0.5rem", display: "block", fontSize: "0.85rem" }}>Usage / Application Instructions</label>
              <textarea 
                id="rec-notes" 
                value={recNotes} 
                onChange={(e) => setRecNotes(e.target.value)} 
                placeholder="e.g. Apply a thin layer in the evening after cleansing. Avoid contact with eyes."
                className="input"
                style={{ width: "100%", minHeight: "80px", fontFamily: "inherit", padding: "0.5rem" }}
              />
            </div>

            <div style={{ gridColumn: "span 2", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button type="submit" className="btn btn-primary" disabled={recSubmitting} style={{ padding: "0.6rem 1.5rem" }}>
                {recSubmitting ? "Submitting Recommendation..." : "Submit Recommendation"}
              </button>
              {recStatus && (
                <span className={`status-msg ${recStatus.type}`} style={{ padding: "0.4rem 1rem", borderRadius: "6px", fontSize: "0.85rem", margin: 0 }}>
                  {recStatus.text}
                </span>
              )}
            </div>
          </form>
        </div>
      </section>

      {/* Skincare Catalog administration */}
      <section className="section" style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div>
            <h2 className="section-title" style={{ margin: 0 }}>Clinical Catalog Registry</h2>
            <p style={{ margin: "0.2rem 0 0", color: "var(--color-ink-muted)", fontSize: "0.88rem" }}>
              Update and manage available skincare products.
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn btn-primary"
            style={{ borderRadius: "var(--radius-sm)" }}
          >
            {showAddForm ? "✕ Close Form" : "➕ Add Product to Catalog"}
          </button>
        </div>

        {addStatus && (
          <div className={`status-msg ${addStatus.type}`} style={{ marginBottom: "1rem" }}>
            {addStatus.text}
          </div>
        )}

        {/* Add Product Form */}
        {showAddForm && (
          <form onSubmit={handleAddProduct} className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem", background: "var(--color-surface-sunken)" }}>
            <h3 style={{ marginTop: 0 }}>Add Skincare Product</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div className="field">
                <label>Product Name</label>
                <input type="text" required value={newProd.name} onChange={(e) => setNewProd({ ...newProd, name: e.target.value })} placeholder="e.g. Cleansing Wash" className="input" />
              </div>
              <div className="field">
                <label>Brand</label>
                <input type="text" required value={newProd.brand} onChange={(e) => setNewProd({ ...newProd, brand: e.target.value })} placeholder="e.g. SkinGenie" className="input" />
              </div>
              <div className="field">
                <label>Category</label>
                <select className="input" value={newProd.category} onChange={(e) => setNewProd({ ...newProd, category: e.target.value })}>
                  <option value="Cleanser">Cleanser</option>
                  <option value="Serum">Serum</option>
                  <option value="Moisturizer">Moisturizer</option>
                  <option value="Sunscreen">Sunscreen</option>
                </select>
              </div>
              <div className="field">
                <label>Price (INR)</label>
                <input type="number" required value={newProd.price} onChange={(e) => setNewProd({ ...newProd, price: Number(e.target.value) })} className="input" />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={adding}>
              {adding ? "Saving..." : "Save Product"}
            </button>
          </form>
        )}

        {/* Product Catalog Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem" }}>
          {products.slice(0, 3).map((prod, idx) => (
            <div key={prod.id || idx} className="card" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", justifyContent: "space-between", margin: 0 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.72rem", padding: "0.2rem 0.5rem", background: "var(--color-primary-tint)", color: "var(--color-primary)", borderRadius: "4px", fontWeight: "700" }}>
                    {prod.category}
                  </span>
                  <strong style={{ color: "var(--color-primary)" }}>₹{prod.price}</strong>
                </div>

                <h3 style={{ margin: "0.4rem 0 0.2rem", fontSize: "1rem" }}>{prod.name}</h3>
                <div style={{ fontSize: "0.78rem", color: "var(--color-ink-faint)", marginBottom: "0.5rem" }}>by {prod.brand}</div>
                <p style={{ fontSize: "0.82rem", color: "var(--color-ink-muted)", lineHeight: 1.4, margin: "0 0 1rem 0" }}>{prod.description}</p>
              </div>

              <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "0.5rem", fontSize: "0.75rem", color: "var(--color-ink-muted)" }}>
                <strong>Actives:</strong> {Array.isArray(prod.key_active_ingredients) ? prod.key_active_ingredients.join(", ") : prod.key_active_ingredients}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Preservation of Customer Workspace Links */}
      <section className="section" style={{ marginBottom: "2rem" }}>
        <h2 className="section-title">Navigation Tools</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.25rem" }}>
          <div className="card" style={{ padding: "1.25rem", margin: 0 }}>
            <h3>Customer Profiles</h3>
            <p style={{ fontSize: "0.82rem", color: "var(--color-ink-muted)" }}>Configure routine overrides, upload diagnostic updates, and examine timelines.</p>
            <Link to="/consultant/customers" className="btn btn-primary" style={{ display: "inline-block", marginTop: "1rem" }}>Open Customer CRM</Link>
          </div>

          <div className="card" style={{ padding: "1.25rem", margin: 0 }}>
            <h3>Clinical Referral</h3>
            <p style={{ fontSize: "0.82rem", color: "var(--color-ink-muted)" }}>Refer clients to clinical dermatologists and review coordination notes.</p>
            <Link to="/consultant/dermatologists" className="btn btn-primary" style={{ display: "inline-block", marginTop: "1rem" }}>Open Referral Contacts</Link>
          </div>

          <div className="card" style={{ padding: "1.25rem", margin: 0 }}>
            <h3>Consultant Identity</h3>
            <p style={{ fontSize: "0.82rem", color: "var(--color-ink-muted)" }}>Adjust organizational specialties, telephone contact links, and profile details.</p>
            <Link to="/consultant/profile" className="btn btn-primary" style={{ display: "inline-block", marginTop: "1rem" }}>Configure Profile</Link>
          </div>
        </div>
      </section>

      {/* Command Navigator Dialog */}
      {commandPaletteOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
          <div className="card" style={{ width: "90%", maxWidth: "450px", padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <strong style={{ fontSize: "1rem" }}>CRM Palette Shortcuts</strong>
              <button type="button" onClick={() => setCommandPaletteOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem" }}>×</button>
            </div>
            
            <input
              type="text"
              placeholder="Search shortcuts..."
              className="input"
              value={commandSearch}
              onChange={(e) => setCommandSearch(e.target.value)}
              autoFocus
              style={{ width: "100%", marginBottom: "1rem" }}
            />

            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {commandItems.map((item, idx) => (
                <Link
                  key={idx}
                  to={item.action}
                  onClick={() => setCommandPaletteOpen(false)}
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem", width: "100%", padding: "0.5rem", textDecoration: "none", color: "var(--color-ink)", borderBottom: "1px solid var(--color-border)" }}
                >
                  <span>{item.icon}</span> {item.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
