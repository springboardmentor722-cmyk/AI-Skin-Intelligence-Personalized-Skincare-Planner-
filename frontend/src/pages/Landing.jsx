import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import RitualRing from "../components/RitualRing";

export default function Landing() {
  const { token, user } = useAuth();
  const [activeFaq, setActiveFaq] = useState(null);
  
  // Interactive Assessment State
  const [quizSkinType, setQuizSkinType] = useState("oily");
  const [quizConcern, setQuizConcern] = useState("acne");
  const [quizLifestyle, setQuizLifestyle] = useState("stress");
  const [showQuizResult, setShowQuizResult] = useState(false);

  const getDashboardPath = () => {
    if (user?.role === "dermatologist") return "/dermatologist/dashboard";
    if (user?.role === "skincare_consultant") return "/consultant/dashboard";
    return "/dashboard";
  };

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  // Simulated AI diagnostics recommendation logic
  const getDemoRecommendation = () => {
    const activesMap = {
      acne: ["Salicylic Acid", "Niacinamide"],
      redness: ["Centella Asiatica", "Ceramides"],
      aging: ["Retinol", "Peptides"],
      "dark spots": ["Vitamin C", "Alpha Arbutin"],
      dullness: ["Glycolic Acid", "Hyaluronic Acid"],
    };

    const routinesMap = {
      oily: "Foaming Cleanser -> Active Toner -> Light Gel Moisturizer -> Matte Sunscreen",
      dry: "Hydrating Cleanser -> Milky Toner -> Rich Ceramides Cream -> Dewy SPF 50",
      combination: "Balanced Cleanser -> Hydrating Essence -> Lightweight Cream -> Mineral sunscreen",
      sensitive: "Ultra Gentle Cleanser -> Soothing Mist -> Barrier Repair Cream -> Physical SPF 30",
      normal: "Daily Cleanser -> Hyaluronic Acid Serum -> Nourishing Lotion -> SPF 50 Cream",
    };

    return {
      actives: activesMap[quizConcern] || ["Ceramides", "Hyaluronic Acid"],
      routine: routinesMap[quizSkinType] || "Gentle Cleanser -> Cream -> SPF",
      irritationRisk: quizSkinType === "sensitive" ? "Moderate (Patch test suggested)" : "Low Safety Risk",
      sebumLevel: quizSkinType === "oily" ? "High Sebum Production" : "Normal to Dry Sebum",
    };
  };

  const demoRes = getDemoRecommendation();

  const faqs = [
    {
      q: "How does the Ingredient Intelligence Safety Score work?",
      a: "Our engine cross-references the INCI list of skincare products against MongoDB catalogs. It flags active chemical clashes (e.g. combining Retinoids and strong AHAs in the same step) and filters out direct or known allergen aliases based on your profile sensitivities.",
    },
    {
      q: "Is there real AI diagnosing my skin conditions?",
      a: "SkinGenie uses objective visual contrast algorithms (specular reflection and texture variance) to chart skin index parameters. For clinical diagnoses and prescription adjustments, we provide a secure, authenticated bridge to certified human dermatologists.",
    },
    {
      q: "Can I manage routine compliance metrics?",
      a: "Yes. Every time you log AM/PM routines, our Adherence Math Engine evaluates rolling 7-day, 30-day, and 90-day compliance rates. This matches check-ins against your assigned items to calculate compliance score trends.",
    },
  ];

  return (
    <div className="public-landing-container" style={{ background: "var(--color-bg)", minHeight: "100vh", color: "var(--color-ink)", fontFamily: "var(--font-body)" }}>
      {/* Premium Header */}
      <header className="public-header" style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "1.25rem 4vw",
        borderBottom: "1px solid var(--color-border)",
        background: "var(--color-surface)",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "var(--shadow-soft)",
        backdropFilter: "var(--backdrop-blur)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <img src="/images/skingenie_logo.jpg" alt="SkinGenie Logo" style={{ width: "38px", height: "38px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--color-border)" }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontWeight: "800", fontSize: "1.3rem", letterSpacing: "-0.02em", color: "var(--color-ink)", lineHeight: 1.1 }}>
              SkinGenie
            </span>
            <span style={{ display: "block", fontSize: "0.62rem", color: "var(--color-clinical-blue)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "700" }}>
              Clinical Skincare Intelligence
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {token ? (
            <Link to={getDashboardPath()} className="btn btn-primary" style={{ padding: "0.65rem 1.5rem", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-soft)", textDecoration: "none" }}>
              Go to Workspace →
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary" style={{ padding: "0.6rem 1.3rem", borderRadius: "var(--radius-sm)", fontWeight: "600", textDecoration: "none" }}>
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: "0.6rem 1.3rem", borderRadius: "var(--radius-sm)", fontWeight: "600", textDecoration: "none", boxShadow: "var(--shadow-soft)" }}>
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero" style={{
        padding: "6rem 4vw 4rem",
        maxWidth: "1200px",
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "1.1fr 0.9fr",
        gap: "4rem",
        alignItems: "center"
      }}>
        <div>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.4rem 0.9rem",
            borderRadius: "999px",
            background: "var(--color-primary-tint)",
            color: "var(--color-primary)",
            fontSize: "0.8rem",
            fontWeight: "700",
            letterSpacing: "0.02em",
            marginBottom: "1.5rem",
            textTransform: "uppercase",
            border: "1px solid var(--color-border)"
          }}>
            🔬 Medical-Grade Skincare Planning
          </div>

          <h1 style={{
            fontSize: "clamp(2.4rem, 4.5vw, 3.5rem)",
            fontWeight: "900",
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            marginBottom: "1.5rem",
            color: "var(--color-ink)"
          }}>
            AI-Driven Skin Diagnostics & Custom Care Plans
          </h1>

          <p style={{
            fontSize: "1.1rem",
            lineHeight: 1.6,
            color: "var(--color-ink-muted)",
            marginBottom: "2.5rem"
          }}>
            Experience clinical skincare coordination. SkinGenie utilizes automated photo markers, objective scoring engines, and active safety intelligence to design personalized skincare routines verified by certified dermatologists.
          </p>

          <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", marginBottom: "3rem" }}>
            <Link to="/register" className="btn btn-primary btn-large" style={{ padding: "0.85rem 2rem", fontSize: "0.95rem", borderRadius: "var(--radius-md)" }}>
              Start Skin Assessment →
            </Link>
            <Link to="/login" className="btn btn-secondary btn-large" style={{ padding: "0.85rem 2rem", fontSize: "0.95rem", borderRadius: "var(--radius-md)" }}>
              Sign In to Portal
            </Link>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: "flex", gap: "2.5rem", borderTop: "1px solid var(--color-border)", paddingTop: "2rem" }}>
            <div>
              <div style={{ fontWeight: "800", fontSize: "1.5rem", color: "var(--color-clinical-blue)", letterSpacing: "-0.01em" }}>78/100</div>
              <div style={{ fontSize: "0.82rem", color: "var(--color-ink-muted)", fontWeight: "600", marginTop: "0.2rem" }}>Avg Skin Score</div>
            </div>
            <div>
              <div style={{ fontWeight: "800", fontSize: "1.5rem", color: "var(--color-medical-green)", letterSpacing: "-0.01em" }}>+14%</div>
              <div style={{ fontSize: "0.82rem", color: "var(--color-ink-muted)", fontWeight: "600", marginTop: "0.2rem" }}>Sebum Improvement</div>
            </div>
            <div>
              <div style={{ fontWeight: "800", fontSize: "1.5rem", color: "var(--color-primary)", letterSpacing: "-0.01em" }}>85%</div>
              <div style={{ fontSize: "0.82rem", color: "var(--color-ink-muted)", fontWeight: "600", marginTop: "0.2rem" }}>Adherence rate</div>
            </div>
          </div>
        </div>

        {/* Hero Visual Card */}
        <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div style={{
            width: "100%",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            boxShadow: "var(--shadow-lift)",
            border: "1px solid var(--color-border)"
          }}>
            <img src="/images/skin_analysis_hero.jpg" alt="Clinical Skin Analysis Illustration" style={{ width: "100%", height: "auto", display: "block", objectFit: "cover" }} />
          </div>

          <div className="card" style={{ padding: "2.5rem", background: "var(--color-surface)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lift)", border: "1px solid var(--color-border)", margin: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <div>
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-ink-faint)", fontWeight: "700" }}>
                  SKINGENIE ANALYTICS COCKPIT
                </span>
                <h3 style={{ margin: "0.2rem 0 0", fontSize: "1.3rem", fontWeight: "800" }}>Health Preview</h3>
              </div>
              <div style={{ padding: "0.4rem 0.8rem", background: "var(--color-primary-tint)", color: "var(--color-primary)", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "800" }}>
                OPTIMAL
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "2rem" }}>
              <RitualRing size={90} progress={0.78} color="var(--color-clinical-blue)" />
              <div>
                <div style={{ fontSize: "2.2rem", fontWeight: "800", color: "var(--color-ink)", lineHeight: 1 }}>78 <span style={{ fontSize: "1.1rem", color: "var(--color-ink-faint)" }}>/100</span></div>
                <p style={{ margin: "0.3rem 0 0", fontSize: "0.85rem", color: "var(--color-ink-muted)" }}>
                  Excellent hydration & routine compliance.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.3rem", fontWeight: "600" }}>
                  <span>Routine Consistency</span>
                  <strong>85%</strong>
                </div>
                <div style={{ height: "6px", background: "var(--color-surface-sunken)", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ width: "85%", height: "100%", background: "var(--color-clinical-blue)" }} />
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.3rem", fontWeight: "600", marginTop: "0.25rem" }}>
                  <span>Water Intake Balance</span>
                  <strong>1.8L / 2.5L</strong>
                </div>
                <div style={{ height: "6px", background: "var(--color-surface-sunken)", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ width: "72%", height: "100%", background: "var(--color-medical-green)" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Workflow Visualizer */}
      <section style={{ background: "var(--color-surface)", padding: "5rem 4vw", borderTop: "1px solid var(--color-border)", borderBottom: "1px solid var(--color-border)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", maxWidth: "700px", margin: "0 auto 4rem" }}>
            <span style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-primary)", fontWeight: "800" }}>
              INTELLIGENT PIPELINE
            </span>
            <h2 style={{ fontSize: "2.2rem", fontWeight: "900", marginTop: "0.5rem", letterSpacing: "-0.02em" }}>SaaS Clinical Skincare Workflow</h2>
            <p style={{ color: "var(--color-ink-muted)", fontSize: "1rem", marginTop: "0.75rem" }}>
              Our platform coordinates skin health checkpoints in a single continuous verification loop.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1.5rem" }}>
            {[
              { step: "1", name: "Assessment", desc: "Select skin traits, concerns, and sensitivities." },
              { step: "2", name: "Analysis Engine", desc: "Evaluate safety scores and flag allergens." },
              { step: "3", name: "Safety Matching", desc: "MongoDB checks for unsafe active clashes." },
              { step: "4", name: "Routine Generation", desc: "Automate morning and night application schedules." },
              { step: "5", name: "Progress Tracker", desc: "Save photos and track compliance timelines." },
              { step: "6", name: "Derm Sync", desc: "Authorized professionals override or assign products." }
            ].map((node, i) => (
              <div key={i} className="card" style={{ margin: 0, padding: "1.25rem", textAlign: "center", background: "var(--color-surface-sunken)", border: "1px solid var(--color-border)" }}>
                <div style={{ width: "35px", height: "35px", borderRadius: "50%", background: "var(--color-primary)", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", fontWeight: "bold" }}>
                  {node.step}
                </div>
                <h4 style={{ fontWeight: "800", fontSize: "0.95rem", marginBottom: "0.4rem" }}>{node.name}</h4>
                <p style={{ fontSize: "0.78rem", color: "var(--color-ink-muted)", lineHeight: 1.4, margin: 0 }}>{node.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Mini Quiz Assessment */}
      <section style={{ padding: "5rem 4vw", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-clinical-blue)", fontWeight: "800" }}>
              DEMO INSIGHTS
            </span>
            <h2 style={{ fontSize: "2.2rem", fontWeight: "900", marginTop: "0.5rem", letterSpacing: "-0.02em" }}>Try a Mini AI Skin Check</h2>
            <p style={{ color: "var(--color-ink-muted)", fontSize: "1.05rem", marginTop: "1rem", lineHeight: 1.6 }}>
              Select your skin type, primary concern, and daily lifestyle factor to run our diagnostics rule engine simulator and see recommended active ingredients instantly.
            </p>
          </div>

          <div className="card" style={{ padding: "2rem", margin: 0 }}>
            {!showQuizResult ? (
              <div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: "800", marginBottom: "1.25rem" }}>Diagnostics Selector</h3>
                
                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: "700", display: "block", marginBottom: "0.4rem" }}>Skin Type</label>
                  <select className="input" value={quizSkinType} onChange={(e) => setQuizSkinType(e.target.value)} style={{ width: "100%" }}>
                    <option value="oily">Oily</option>
                    <option value="dry">Dry</option>
                    <option value="combination">Combination</option>
                    <option value="sensitive">Sensitive</option>
                    <option value="normal">Normal</option>
                  </select>
                </div>

                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: "700", display: "block", marginBottom: "0.4rem" }}>Target Concern</label>
                  <select className="input" value={quizConcern} onChange={(e) => setQuizConcern(e.target.value)} style={{ width: "100%" }}>
                    <option value="acne">Acne & Clogged Pores</option>
                    <option value="redness">Redness & Irritation</option>
                    <option value="aging">Fine Lines & Skin Aging</option>
                    <option value="dark spots">Dark Spots & Hyperpigmentation</option>
                    <option value="dullness">Dullness & Uneven Texture</option>
                  </select>
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: "700", display: "block", marginBottom: "0.4rem" }}>Lifestyle Factor</label>
                  <select className="input" value={quizLifestyle} onChange={(e) => setQuizLifestyle(e.target.value)} style={{ width: "100%" }}>
                    <option value="stress">High Stress Environments</option>
                    <option value="late">Late Nights / Sleep Deprivation</option>
                    <option value="sun">Outdoor Sunshine / UV Exposure</option>
                    <option value="pollution">Air Pollution / Travel</option>
                  </select>
                </div>

                <button type="button" className="btn btn-primary btn-block" onClick={() => setShowQuizResult(true)}>
                  Run Active Match Engine
                </button>
              </div>
            ) : (
              <div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: "800", marginBottom: "0.75rem", color: "var(--color-medical-green)" }}>✦ Simulation Results</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--color-ink-muted)", marginBottom: "1.25rem" }}>
                  Below are the recommended parameters based on clinical active ingredients rules:
                </p>

                <div style={{ background: "var(--color-surface-sunken)", padding: "1rem", borderRadius: "6px", marginBottom: "1.25rem" }}>
                  <div style={{ fontSize: "0.82rem", marginBottom: "0.4rem" }}>
                    <strong>Suggested Actives:</strong> {demoRes.actives.join(", ")}
                  </div>
                  <div style={{ fontSize: "0.82rem", marginBottom: "0.4rem" }}>
                    <strong>Ideal Routine Template:</strong> {demoRes.routine}
                  </div>
                  <div style={{ fontSize: "0.82rem", marginBottom: "0.4rem" }}>
                    <strong>Safety Rating:</strong> {demoRes.irritationRisk}
                  </div>
                  <div style={{ fontSize: "0.82rem" }}>
                    <strong>Sebum Profile:</strong> {demoRes.sebumLevel}
                  </div>
                </div>

                <button type="button" className="btn btn-secondary btn-block" onClick={() => setShowQuizResult(false)}>
                  ← Re-select Parameters
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section style={{ background: "var(--color-surface)", padding: "5rem 4vw", borderTop: "1px solid var(--color-border)" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <span style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-primary)", fontWeight: "800" }}>
              QUESTIONS & ANSWERS
            </span>
            <h2 style={{ fontSize: "2rem", fontWeight: "900", marginTop: "0.5rem", letterSpacing: "-0.02em" }}>Frequently Asked Questions</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {faqs.map((faq, index) => (
              <div key={index} style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", background: "var(--color-surface)", overflow: "hidden" }}>
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  style={{
                    width: "100%",
                    padding: "1.25rem 1.5rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    fontWeight: "800",
                    color: "var(--color-ink)",
                    fontSize: "0.95rem"
                  }}
                >
                  <span>{faq.q}</span>
                  <span style={{ fontSize: "1.2rem", color: "var(--color-primary)" }}>
                    {activeFaq === index ? "−" : "+"}
                  </span>
                </button>
                {activeFaq === index && (
                  <div style={{ padding: "0 1.5rem 1.25rem 1.5rem", fontSize: "0.88rem", color: "var(--color-ink-muted)", lineHeight: 1.6, borderTop: "1px solid var(--color-border)", paddingTop: "1rem" }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: "5rem 4vw", textAlign: "center" }}>
        <div className="card" style={{ maxWidth: "800px", margin: "0 auto", padding: "4.5rem 2.5rem", background: "var(--color-surface)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lift)" }}>
          <h2 style={{ fontSize: "2.2rem", fontWeight: "900", marginBottom: "1rem", letterSpacing: "-0.02em" }}>Receive Your Skin Health Score Today</h2>
          <p style={{ color: "var(--color-ink-muted)", maxWidth: "550px", margin: "0 auto 2.5rem", fontSize: "1.05rem", lineHeight: 1.6 }}>
            Sign up to generate your baseline score card, verify product compatibility, and connect securely with clinicians.
          </p>
          <div style={{ display: "flex", gap: "1.25rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/register" className="btn btn-primary btn-large" style={{ padding: "0.85rem 2.2rem", borderRadius: "var(--radius-md)", textDecoration: "none" }}>
              Create Account
            </Link>
            <Link to="/login" className="btn btn-secondary btn-large" style={{ padding: "0.85rem 2.2rem", borderRadius: "var(--radius-md)", textDecoration: "none" }}>
              Portal Login
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--color-border)", padding: "2.5rem 4vw", textAlign: "center", fontSize: "0.88rem", color: "var(--color-ink-muted)" }}>
        <p>© 2026 SkinGenie Clinical Skincare SaaS Planner. All rights reserved.</p>
      </footer>
    </div>
  );
}
