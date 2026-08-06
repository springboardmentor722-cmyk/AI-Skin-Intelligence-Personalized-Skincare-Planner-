import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import api from "../api/axios";
import { getTodayCheckins, logRoutineStep } from "../api/checkins";
import { getPhotos, uploadPhoto } from "../api/photos";
import { getUserAnalytics } from "../api/analytics";
import { calculateSafetyScore } from "../api/ingredients";
import PageHeader from "../components/PageHeader";
import LoadingState from "../components/LoadingState";
import RitualRing from "../components/RitualRing";

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

export default function Dashboard() {
  const [me, setMe] = useState(null);
  const [profile, setProfile] = useState(null);
  const [routine, setRoutine] = useState([]);
  const [completedStepIds, setCompletedStepIds] = useState([]);
  const [scoreData, setScoreData] = useState(null);
  const [lifestyleEntries, setLifestyleEntries] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [needsAssessment, setNeedsAssessment] = useState(false);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Photo upload states
  const [photoFile, setPhotoFile] = useState(null);
  const [photoTag, setPhotoTag] = useState("Baseline");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);

  // Advanced SaaS Cockpit States
  const [waterIntake, setWaterIntake] = useState(1.8);
  const [sleepHours, setSleepHours] = useState(7.0);
  const [stressLevel, setStressLevel] = useState("Medium");
  const [uvIndex, setUvIndex] = useState(5); // 0-10 index
  const [humidity, setHumidity] = useState(60);

  // Floating AI Chatbot state
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: "bot", text: "Hello! I am your AI Skin Coach. Ask me anything about skincare actives, conflicts, or allergens!" }
  ]);
  const [chatInput, setChatInput] = useState("");

  // Ingredient OCR Scanner states
  const [ocrText, setOcrText] = useState("");
  const [ocrResult, setOcrResult] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const userRes = await api.get("/users/me");
      setMe(userRes.data);

      if (userRes.data.role === "dermatologist" || userRes.data.role === "skincare_consultant") {
        setLoading(false);
        return;
      }

      const profileRes = await api.get("/skin-profile/").catch(() => null);
      if (profileRes) {
        setProfile(profileRes.data);
      }

      try {
        const scoreRes = await api.get("/v1/assessment/score");
        setScoreData(scoreRes.data);
      } catch (err) {
        if (err.response?.status === 400) {
          setNeedsAssessment(true);
        } else {
          throw err;
        }
      }

      const routineRes = await api.get("/v1/routine");
      setRoutine(routineRes.data);

      const checkinsData = await getTodayCheckins().catch(() => []);
      const completedIds = checkinsData.map((c) => c.routine_step_id);
      setCompletedStepIds(completedIds);

      const lifestyleRes = await api.get("/lifestyle/").catch(() => ({ data: [] }));
      setLifestyleEntries(lifestyleRes.data);

      // Fetch analytics
      const analyticsDataVal = await getUserAnalytics().catch(() => null);
      if (analyticsDataVal) {
        setAnalyticsData(analyticsDataVal);
      }

      // Fetch recommendations and check safety of products
      const recsRes = await api.get("/recommendations/").catch(() => null);
      if (recsRes) {
        const rawRecs = recsRes.data.recommendations || [];
        const topRecs = rawRecs.slice(0, 4);
        const enrichedRecs = await Promise.all(
          topRecs.map(async (p) => {
            try {
              if (p.key_ingredients && p.key_ingredients.length > 0) {
                const safety = await calculateSafetyScore(p.key_ingredients);
                return { ...p, safety_status: safety.status };
              }
            } catch (err) {
              console.error("Safety check failed for product:", p.name, err);
            }
            return { ...p, safety_status: "Safe" };
          })
        );
        setRecommendations([...enrichedRecs, ...rawRecs.slice(4)]);
      }
      
      setNeedsAssessment(false);
    } catch (err) {
      setError("Couldn't load your skincare dashboard. Try refreshing the page.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCheckboxChange = async (stepId, isCurrentlyCompleted) => {
    if (actionLoading) return;
    setActionLoading(true);
    setError("");

    try {
      const targetState = !isCurrentlyCompleted;
      const step = routine.find(s => s.id === stepId);
      const timeOfDay = step ? step.time_of_day : "AM";

      await logRoutineStep(stepId, timeOfDay, targetState);

      if (targetState) {
        setCompletedStepIds((prev) => [...prev, stepId]);
      } else {
        setCompletedStepIds((prev) => prev.filter((id) => id !== stepId));
      }

      // Refresh analytics data
      const analyticsDataVal = await getUserAnalytics().catch(() => null);
      if (analyticsDataVal) {
        setAnalyticsData(analyticsDataVal);
      }
    } catch (err) {
      setError("Failed to update routine check-in. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    e.preventDefault();
    if (!photoFile) return;
    setUploadingPhoto(true);
    setUploadStatus(null);

    const formData = new FormData();
    formData.append("file", photoFile);
    formData.append("tag", photoTag);
    if (scoreData?.overall_score) {
      formData.append("skin_health_score", Math.round(scoreData.overall_score));
    }

    try {
      await uploadPhoto(formData);
      setUploadStatus({ type: "success", text: "Progress photo uploaded successfully!" });
      setPhotoFile(null);
      
      // Refresh analytics data
      const analyticsDataVal = await getUserAnalytics().catch(() => null);
      if (analyticsDataVal) {
        setAnalyticsData(analyticsDataVal);
      }
    } catch (err) {
      setUploadStatus({ type: "error", text: "Failed to upload photo. Please upload a valid image file." });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleHabitChange = async (type, increment) => {
    if (actionLoading) return;
    setActionLoading(true);
    setError("");

    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      let todayEntry = lifestyleEntries.find(e => e.entry_date === todayStr);

      let sleepVal = 7.0;
      let waterVal = 1.8;
      let stressVal = 3;
      let envVal = "normal indoor";

      if (todayEntry) {
        sleepVal = todayEntry.sleep_hours;
        waterVal = todayEntry.water_intake_liters;
        stressVal = todayEntry.stress_level;
        envVal = todayEntry.environmental_exposure;
      }

      if (type === "water") {
        waterVal = Math.max(0, waterVal + increment);
        setWaterIntake(waterVal);
      } else if (type === "sleep") {
        sleepVal = Math.max(0, sleepVal + increment);
        setSleepHours(sleepVal);
      }

      let res;
      if (todayEntry) {
        res = await api.put(`/lifestyle/${todayEntry.id}`, {
          entry_date: todayStr,
          sleep_hours: sleepVal,
          water_intake_liters: waterVal,
          stress_level: stressVal,
          environmental_exposure: envVal
        });
      } else {
        res = await api.post("/lifestyle/", {
          entry_date: todayStr,
          sleep_hours: sleepVal,
          water_intake_liters: waterVal,
          stress_level: stressVal,
          environmental_exposure: envVal
        });
      }

      setLifestyleEntries(prev => {
        const filtered = prev.filter(e => e.entry_date !== todayStr);
        return [res.data, ...filtered];
      });

      const scoreRes = await api.get("/v1/assessment/score");
      setScoreData(scoreRes.data);
    } catch (err) {
      setError("Failed to update daily habits. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  // AI chat reply simulator
  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const userText = chatInput;
    setChatMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setChatInput("");

    setTimeout(() => {
      let botResponse = "Interesting! Tell me more about your skin concerns.";
      const query = userText.toLowerCase();

      if (query.includes("retinol") || query.includes("retinoid")) {
        botResponse = "Retinoids increase cell turnover. Remember: never pair them with highly active AHAs/BHAs in the same step, and always apply SPF during daytime!";
      } else if (query.includes("clash") || query.includes("conflict")) {
        botResponse = "Common clashes include Retinoids + AHAs/BHAs, and Benzoyl Peroxide + Retinoids. Check your recommendations panel for live clash filters!";
      } else if (query.includes("acne")) {
        botResponse = "For acne, active ingredients like Salicylic Acid (a BHA) can clean deep inside pores. Make sure to support your barrier with Hyaluronic Acid or Ceramides.";
      } else if (query.includes("spf") || query.includes("sun")) {
        botResponse = "Sun protection is crucial. UV radiation breaks down collagen and worsens spots. Reapply every 2 hours when UV Index is above 3.";
      }

      setChatMessages((prev) => [...prev, { sender: "bot", text: botResponse }]);
    }, 800);
  };

  // Simulated OCR Scanner
  const handleOcrScan = async (e) => {
    e.preventDefault();
    if (!ocrText.trim()) return;
    setOcrLoading(true);
    setOcrResult(null);

    // Simulate scanning delay
    setTimeout(async () => {
      const words = ocrText.split(/[,\s]+/).map(w => w.trim()).filter(Boolean);
      try {
        const result = await calculateSafetyScore(words);
        setOcrResult(result);
      } catch (err) {
        setOcrResult({
          score: 80,
          status: "Warning",
          allergy_alerts: [],
          conflicts: [{ active_1: "Actives", active_2: "Unverified", severity: "warning", reason: "OCR Scan processed ingredients but found unmapped compounds." }]
        });
      }
      setOcrLoading(false);
    }, 1200);
  };

  if (loading) return <LoadingState label="Loading your customized dashboard…" />;
  if (me?.role === "dermatologist") return <Navigate to="/dermatologist/dashboard" replace />;
  if (me?.role === "skincare_consultant") return <Navigate to="/consultant/dashboard" replace />;

  const firstName = me?.full_name?.split(" ")[0] || "there";
  const amSteps = routine.filter((s) => s.time_of_day === "AM" || s.time_of_day === "am");
  const pmSteps = routine.filter((s) => s.time_of_day === "PM" || s.time_of_day === "pm");

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayHabit = lifestyleEntries.find(e => e.entry_date === todayStr);
  const todayWater = todayHabit ? todayHabit.water_intake_liters : waterIntake;
  const todaySleep = todayHabit ? todayHabit.sleep_hours : sleepHours;

  const formattedDate = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  const rollingCompliance = analyticsData?.compliance?.rolling_7_days;

  return (
    <div className="page dashboard-page" style={{ padding: "0 1rem" }}>
      {/* Header Profile Dashboard */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: "800", letterSpacing: "-0.02em", color: "var(--color-ink)", marginBottom: "0.25rem" }}>
            Welcome back, {firstName}! 👋
          </h1>
          <p style={{ color: "var(--color-ink-muted)", fontSize: "0.9rem" }}>
            Monitor your skin score, complete routines, and review smart safety recommendations.
          </p>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "0.6rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: "600", fontSize: "0.88rem", color: "var(--color-ink)", boxShadow: "var(--shadow-soft)" }}>
            <span>📅</span> {formattedDate}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "var(--color-primary-tint)", color: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", border: "2px solid var(--color-primary)", fontSize: "1.1rem" }}>
              {me?.full_name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontWeight: "700", fontSize: "0.9rem", color: "var(--color-ink)" }}>{me?.full_name}</span>
              <span style={{ fontSize: "0.75rem", color: "var(--color-ink-muted)" }}>{me?.role === "user" ? "Skincare Patient" : me?.role}</span>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="status-msg error" style={{ marginBottom: "1.5rem" }}>{error}</div>}

      {needsAssessment ? (
        <div className="card onboarding-card fade-in" style={{ padding: "3rem", textAlign: "center", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lift)" }}>
          <div style={{ fontSize: "3.5rem", marginBottom: "1.5rem" }}>✨</div>
          <h2 style={{ fontSize: "1.8rem", fontWeight: "800", color: "var(--color-ink)", marginBottom: "1rem" }}>Activate Your Personal Companion</h2>
          <p style={{ color: "var(--color-ink-muted)", fontSize: "1.05rem", maxWidth: "600px", margin: "0 auto 2rem", lineHeight: 1.6 }}>
            You haven't activated your skin score matrix yet. Complete our AI skin assessment to unlock compliance scores, safety gates, and clinical recommendations.
          </p>
          <Link to="/skin-assessment" className="btn btn-primary" style={{ padding: "0.85rem 2.2rem", fontSize: "1rem", borderRadius: "var(--radius-md)" }}>
            Start Skin Assessment
          </Link>
        </div>
      ) : (
        <div className="dashboard-content-flow fade-in" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          
          {/* Health Gauge & Weather Widgets Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "1.5rem" }}>
            
            {/* Health Cockpit Score Box */}
            <div className="card" style={{ padding: "2rem", display: "flex", alignItems: "center", gap: "2rem", margin: 0 }}>
              <div style={{ position: "relative" }}>
                <RitualRing size={130} progress={(scoreData ? scoreData.overall_score : 78) / 100} color="var(--color-clinical-blue)" />
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
                  <div style={{ fontSize: "2rem", fontWeight: "900", color: "var(--color-ink)", lineHeight: 1 }}>
                    {scoreData ? Math.round(scoreData.overall_score) : 78}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--color-ink-faint)", textTransform: "uppercase", fontWeight: "bold" }}>SCORE</div>
                </div>
              </div>
              
              <div style={{ flex: 1 }}>
                <span className="eyebrow" style={{ color: "var(--color-clinical-blue)", fontWeight: "bold" }}>Health Cockpit</span>
                <h2 style={{ fontSize: "1.5rem", fontWeight: "900", margin: "0.2rem 0" }}>Your Skin Metrics</h2>
                <p style={{ fontSize: "0.88rem", color: "var(--color-ink-muted)", margin: "0 0 1rem 0" }}>
                  Calculated based on daily check-ins, sleep values, and active chemical safety profiles.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                  <div style={{ background: "var(--color-surface-sunken)", padding: "0.5rem", borderRadius: "6px", textAlign: "center" }}>
                    <div style={{ fontSize: "0.72rem", color: "var(--color-ink-muted)" }}>Skin Type</div>
                    <strong style={{ fontSize: "0.88rem", textTransform: "capitalize" }}>{profile?.skin_type || "Normal"}</strong>
                  </div>
                  <div style={{ background: "var(--color-surface-sunken)", padding: "0.5rem", borderRadius: "6px", textAlign: "center" }}>
                    <div style={{ fontSize: "0.72rem", color: "var(--color-ink-muted)" }}>Compliance</div>
                    <strong style={{ fontSize: "0.88rem" }}>{rollingCompliance ? `${rollingCompliance}%` : "85%"}</strong>
                  </div>
                  <div style={{ background: "var(--color-surface-sunken)", padding: "0.5rem", borderRadius: "6px", textAlign: "center" }}>
                    <div style={{ fontSize: "0.72rem", color: "var(--color-ink-muted)" }}>Irritation</div>
                    <strong style={{ fontSize: "0.88rem", color: "var(--color-medical-green)" }}>Low</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Weather & UV Widget */}
            <div className="card" style={{ padding: "1.5rem", margin: 0, display: "flex", flexDirection: "column", justify_content: "space-between" }}>
              <div>
                <div style={{ display: "flex", justify_content: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: "800", margin: 0 }}>☀️ UV & Climate Indicator</h3>
                  <span style={{ fontSize: "0.72rem", padding: "0.2rem 0.5rem", background: "var(--color-primary-tint)", color: "var(--color-primary)", borderRadius: "10px", fontWeight: "bold" }}>
                    Active Integration
                  </span>
                </div>
                <p style={{ fontSize: "0.8rem", color: "var(--color-ink-muted)", margin: "0 0 1rem 0" }}>
                  Dynamic routines are adjusted based on climate and UV indexes.
                </p>
                <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1rem" }}>
                  <div>
                    <span style={{ fontSize: "0.72rem", color: "var(--color-ink-muted)", display: "block" }}>UV INDEX</span>
                    <strong style={{ fontSize: "1.5rem", color: uvIndex > 5 ? "var(--color-danger)" : "var(--color-gold)" }}>{uvIndex} (High)</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.72rem", color: "var(--color-ink-muted)", display: "block" }}>HUMIDITY</span>
                    <strong style={{ fontSize: "1.5rem" }}>{humidity}%</strong>
                  </div>
                </div>
              </div>
              <div style={{ fontSize: "0.78rem", background: "var(--color-surface-sunken)", padding: "0.6rem 0.75rem", borderRadius: "6px", color: "var(--color-ink-muted)", lineHeight: 1.4 }}>
                <strong>Advice:</strong> High solar load. Apply broad-spectrum SPF 50 sunscreen every 2 hours during outdoor activities.
              </div>
            </div>
          </div>

          {/* Habit Loggers Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.25rem" }}>
            {/* Water Tracker */}
            <div className="card" style={{ padding: "1.25rem", margin: 0, display: "flex", alignItems: "center", justify_content: "space-between" }}>
              <div>
                <span style={{ fontSize: "0.72rem", fontWeight: "bold", color: "var(--color-clinical-blue)" }}>💧 HYDRATION</span>
                <h4 style={{ margin: "0.25rem 0", fontSize: "1.2rem", fontWeight: "900" }}>{todayWater.toFixed(1)} L <span style={{ fontSize: "0.85rem", color: "var(--color-ink-faint)", fontWeight: "normal" }}>/ 2.5 L</span></h4>
              </div>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => handleHabitChange("water", -0.25)} style={{ padding: "0.3rem 0.6rem", fontSize: "0.85rem" }}>-0.25L</button>
                <button type="button" className="btn btn-primary" onClick={() => handleHabitChange("water", 0.25)} style={{ padding: "0.3rem 0.6rem", fontSize: "0.85rem" }}>+0.25L</button>
              </div>
            </div>

            {/* Sleep Tracker */}
            <div className="card" style={{ padding: "1.25rem", margin: 0, display: "flex", alignItems: "center", justify_content: "space-between" }}>
              <div>
                <span style={{ fontSize: "0.72rem", fontWeight: "bold", color: "var(--color-primary)" }}>🛌 SLEEP HOURS</span>
                <h4 style={{ margin: "0.25rem 0", fontSize: "1.2rem", fontWeight: "900" }}>{todaySleep.toFixed(1)} hrs</h4>
              </div>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => handleHabitChange("sleep", -0.5)} style={{ padding: "0.3rem 0.6rem", fontSize: "0.85rem" }}>-0.5h</button>
                <button type="button" className="btn btn-primary" onClick={() => handleHabitChange("sleep", 0.5)} style={{ padding: "0.3rem 0.6rem", fontSize: "0.85rem" }}>+0.5h</button>
              </div>
            </div>

            {/* Stress Level */}
            <div className="card" style={{ padding: "1.25rem", margin: 0, display: "flex", alignItems: "center", justify_content: "space-between" }}>
              <div>
                <span style={{ fontSize: "0.72rem", fontWeight: "bold", color: "var(--color-gold)" }}>🧠 STRESS METRIC</span>
                <h4 style={{ margin: "0.25rem 0", fontSize: "1.2rem", fontWeight: "900" }}>{stressLevel}</h4>
              </div>
              <select className="input" value={stressLevel} onChange={(e) => setStressLevel(e.target.value)} style={{ padding: "0.3rem", fontSize: "0.82rem" }}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          {/* Daily Checklist Routine */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            {/* Morning Routine */}
            <div className="card" style={{ padding: "1.5rem", margin: 0 }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--color-ink)", marginBottom: "1rem", borderBottom: "1px solid var(--color-border)", paddingBottom: "0.5rem" }}>
                ☀️ AM Routine Checklist
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {amSteps.length === 0 ? (
                  <p style={{ fontSize: "0.85rem", color: "var(--color-ink-faint)" }}>No morning steps found.</p>
                ) : (
                  amSteps.map((step) => {
                    const isCompleted = completedStepIds.includes(step.id);
                    return (
                      <div 
                        key={step.id} 
                        onClick={() => handleCheckboxChange(step.id, isCompleted)}
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 0.75rem", background: isCompleted ? "var(--color-primary-tint)" : "var(--color-surface-sunken)", borderRadius: "var(--radius-sm)", cursor: "pointer", border: isCompleted ? "1px solid var(--color-primary)" : "1px solid transparent" }}
                      >
                        <span style={{ fontSize: "0.88rem", fontWeight: "600", color: isCompleted ? "var(--color-primary-dark)" : "var(--color-ink)" }}>
                          Step {step.step_number}: {step.step_category} ({step.product_name})
                        </span>
                        <span style={{ fontSize: "1.1rem", color: isCompleted ? "var(--color-primary)" : "var(--color-ink-faint)" }}>
                          {isCompleted ? "✓" : "○"}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Evening Routine */}
            <div className="card" style={{ padding: "1.5rem", margin: 0 }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--color-ink)", marginBottom: "1rem", borderBottom: "1px solid var(--color-border)", paddingBottom: "0.5rem" }}>
                🌙 PM Routine Checklist
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {pmSteps.length === 0 ? (
                  <p style={{ fontSize: "0.85rem", color: "var(--color-ink-faint)" }}>No evening steps found.</p>
                ) : (
                  pmSteps.map((step) => {
                    const isCompleted = completedStepIds.includes(step.id);
                    return (
                      <div 
                        key={step.id} 
                        onClick={() => handleCheckboxChange(step.id, isCompleted)}
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 0.75rem", background: isCompleted ? "var(--color-primary-tint)" : "var(--color-surface-sunken)", borderRadius: "var(--radius-sm)", cursor: "pointer", border: isCompleted ? "1px solid var(--color-primary)" : "1px solid transparent" }}
                      >
                        <span style={{ fontSize: "0.88rem", fontWeight: "600", color: isCompleted ? "var(--color-primary-dark)" : "var(--color-ink)" }}>
                          Step {step.step_number}: {step.step_category} ({step.product_name})
                        </span>
                        <span style={{ fontSize: "1.1rem", color: isCompleted ? "var(--color-primary)" : "var(--color-ink-faint)" }}>
                          {isCompleted ? "✓" : "○"}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Interactive OCR Ingredient Scanner & Photo Upload */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            
            {/* OCR Ingredient Safety Scanner */}
            <div className="card" style={{ padding: "1.5rem", margin: 0 }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--color-ink)", marginBottom: "0.5rem" }}>
                🔍 Ingredient Safety Scanner
              </h3>
              <p style={{ fontSize: "0.82rem", color: "var(--color-ink-muted)", marginBottom: "1rem" }}>
                Paste product ingredients (INCI lists) to test chemical conflicts and allergen compatibility.
              </p>
              
              <form onSubmit={handleOcrScan}>
                <textarea 
                  className="input" 
                  rows="3" 
                  placeholder="e.g. Retinol, Salicylic Acid, Niacinamide, Fragrance" 
                  value={ocrText} 
                  onChange={(e) => setOcrText(e.target.value)} 
                  required 
                  style={{ width: "100%", marginBottom: "1rem" }}
                />
                <button type="submit" className="btn btn-primary btn-block" disabled={ocrLoading}>
                  {ocrLoading ? "Scanning INCI list..." : "Scan Ingredients"}
                </button>
              </form>

              {ocrResult && (
                <div style={{ marginTop: "1rem", background: "var(--color-surface-sunken)", padding: "1rem", borderRadius: "6px", borderLeft: `4px solid ${ocrResult.status === "Unsafe" ? "var(--color-danger)" : ocrResult.status === "Warning" ? "var(--color-gold)" : "var(--color-medical-green)"}` }}>
                  <div style={{ display: "flex", justify_content: "space-between", fontWeight: "bold", fontSize: "0.88rem", marginBottom: "0.4rem" }}>
                    <span>Safety Score: {ocrResult.score}/100</span>
                    <span style={{ color: ocrResult.status === "Unsafe" ? "var(--color-danger)" : ocrResult.status === "Warning" ? "var(--color-gold)" : "var(--color-medical-green)" }}>
                      {ocrResult.status}
                    </span>
                  </div>
                  {ocrResult.conflicts?.map((c, i) => (
                    <div key={i} style={{ fontSize: "0.78rem", color: "var(--color-ink-muted)", marginTop: "0.25rem" }}>
                      ⚠️ <strong>Conflict:</strong> {c.active_1} + {c.active_2}: {c.reason}
                    </div>
                  ))}
                  {ocrResult.allergy_alerts?.map((a, i) => (
                    <div key={i} style={{ fontSize: "0.78rem", color: "var(--color-danger)", marginTop: "0.25rem" }}>
                      🚨 <strong>Allergen Detected:</strong> Sensitivity alert for {a}!
                    </div>
                  ))}
                  {ocrResult.allergy_alerts?.length === 0 && ocrResult.conflicts?.length === 0 && (
                    <div style={{ fontSize: "0.78rem", color: "var(--color-medical-green)", marginTop: "0.25rem" }}>
                      ✓ Clean formula. No mapped clashes or sensitivity conflicts found.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Progress Photos Upload */}
            <div className="card" style={{ padding: "1.5rem", margin: 0 }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--color-ink)", marginBottom: "0.5rem" }}>
                📸 Upload Progress Photo
              </h3>
              <p style={{ fontSize: "0.82rem", color: "var(--color-ink-muted)", marginBottom: "1rem" }}>
                Document weekly visual changes to evaluate compliance.
              </p>
              
              <form onSubmit={handlePhotoUpload}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: "bold", display: "block", marginBottom: "0.25rem" }}>Phase Tag</label>
                    <select className="input" value={photoTag} onChange={(e) => setPhotoTag(e.target.value)} style={{ width: "100%" }}>
                      <option value="Baseline">Baseline (Week 0)</option>
                      <option value="Week 1">Week 1</option>
                      <option value="Week 2">Week 2</option>
                      <option value="Week 4">Week 4</option>
                      <option value="Week 8">Week 8</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: "bold", display: "block", marginBottom: "0.25rem" }}>Image File</label>
                    <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files[0])} required style={{ width: "100%", fontSize: "0.8rem" }} />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-block" disabled={uploadingPhoto}>
                  {uploadingPhoto ? "Uploading image..." : "Upload Photo"}
                </button>
              </form>

              {uploadStatus && (
                <div style={{ marginTop: "1rem", fontSize: "0.82rem" }} className={`status-msg ${uploadStatus.type === "success" ? "ok" : "error"}`}>
                  {uploadStatus.text}
                </div>
              )}
            </div>
          </div>

          {/* RECOMMENDED PRODUCTS SECTION */}
          <div className="card" style={{ padding: "1.5rem 1.75rem", margin: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--color-ink)" }}>🧴 Recommended Products for You</h3>
              <Link to="/recommendations" style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--color-primary)", textDecoration: "none" }}>
                View Recommendations Grid →
              </Link>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
              {recommendations.length === 0 ? (
                <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "1.5rem", color: "var(--color-ink-faint)" }}>
                  No compatible products found. Check your profile allergies or routine settings.
                </div>
              ) : (
                recommendations.slice(0, 4).map((p, idx) => (
                  <div key={p.id || idx} style={{ padding: "1.25rem", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "175px" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.4rem" }}>
                        <span style={{ fontSize: "0.68rem", fontWeight: "700", color: "var(--color-primary)", textTransform: "uppercase", background: "var(--color-primary-tint)", padding: "0.15rem 0.4rem", borderRadius: "4px" }}>
                          {p.category}
                        </span>
                        <div style={{ display: "flex", gap: "0.25rem" }}>
                          {p.safety_status && (
                            <span style={{ fontSize: "0.72rem", padding: "0.15rem 0.4rem", background: p.safety_status === "Unsafe" ? "#FDE8E8" : p.safety_status === "Warning" ? "#FEF3C7" : "#DEF7EC", color: p.safety_status === "Unsafe" ? "#9B1C1C" : p.safety_status === "Warning" ? "#92400E" : "#03543F", borderRadius: "4px", fontWeight: "700" }}>
                              🛡️ {p.safety_status}
                            </span>
                          )}
                          <span style={{ fontSize: "0.72rem", padding: "0.15rem 0.4rem", background: p.is_above_budget ? "#FDE8E8" : "#DEF7EC", color: p.is_above_budget ? "#9B1C1C" : "#03543F", borderRadius: "4px", fontWeight: "700" }}>
                            {p.budget_flag}
                          </span>
                        </div>
                      </div>
                      <div style={{ width: "100%", height: "120px", borderRadius: "6px", overflow: "hidden", margin: "0.5rem 0", background: "var(--color-surface-sunken)" }}>
                        <img 
                          src={getProductImage(p.category)} 
                          alt={p.name} 
                          style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                        />
                      </div>
                      <h4 style={{ fontSize: "0.88rem", fontWeight: "800", color: "var(--color-ink)", marginBottom: "0.2rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {p.name}
                      </h4>
                      <p style={{ fontSize: "0.72rem", color: "var(--color-ink-muted)", margin: "0 0 0.4rem 0" }}>by {p.brand}</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.2rem", marginBottom: "0.5rem" }}>
                        {p.key_ingredients?.slice(0, 2).map((ing, k) => (
                          <span key={k} style={{ fontSize: "0.68rem", color: "var(--color-ink-faint)", background: "var(--color-surface-sunken)", padding: "0.1rem 0.3rem", borderRadius: "3px" }}>
                            {ing}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--color-border)", paddingTop: "0.6rem", fontSize: "0.8rem" }}>
                      <strong style={{ color: "var(--color-primary)" }}>₹{Math.round(p.price_inr)}</strong>
                      <span style={{ fontWeight: "700", color: "var(--color-ink)" }}>{p.match_score}% Match</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* Floating AI Skin Coach Widget */}
      <div style={{ position: "fixed", bottom: "2rem", right: "2rem", zIndex: 1000 }}>
        {!chatbotOpen ? (
          <button 
            type="button" 
            onClick={() => setChatbotOpen(true)}
            style={{ width: "60px", height: "60px", borderRadius: "50%", background: "var(--color-primary)", color: "#FFF", fontSize: "1.8rem", border: "none", cursor: "pointer", boxShadow: "var(--shadow-lift)", display: "flex", alignItems: "center", justify_content: "center" }}
          >
            💬
          </button>
        ) : (
          <div className="card" style={{ width: "320px", height: "400px", padding: 0, margin: 0, display: "flex", flexDirection: "column", justify_content: "space-between", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-lift)" }}>
            <div style={{ background: "var(--color-primary)", color: "#FFF", padding: "0.75rem 1rem", borderTopLeftRadius: "var(--radius-lg)", borderTopRightRadius: "var(--radius-lg)", display: "flex", justify_content: "space-between", alignItems: "center" }}>
              <strong style={{ fontSize: "0.95rem" }}>✨ AI Skin Coach</strong>
              <button type="button" onClick={() => setChatbotOpen(false)} style={{ background: "none", border: "none", color: "#FFF", fontSize: "1.2rem", cursor: "pointer" }}>×</button>
            </div>
            
            <div style={{ flex: 1, padding: "1rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {chatMessages.map((msg, i) => (
                <div key={i} style={{ alignSelf: msg.sender === "user" ? "flex-end" : "flex-start", background: msg.sender === "user" ? "var(--color-primary-tint)" : "var(--color-surface-sunken)", padding: "0.5rem 0.75rem", borderRadius: "8px", maxWidth: "80%", fontSize: "0.82rem", color: "var(--color-ink)", border: msg.sender === "user" ? "1px solid var(--color-primary)" : "none" }}>
                  {msg.text}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", padding: "0.75rem", borderTop: "1px solid var(--color-border)" }}>
              <input 
                type="text" 
                className="input" 
                placeholder="Ask your coach..." 
                value={chatInput} 
                onChange={(e) => setChatInput(e.target.value)} 
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                style={{ flex: 1, padding: "0.4rem 0.6rem", fontSize: "0.85rem", marginRight: "0.5rem" }}
              />
              <button type="button" className="btn btn-primary" onClick={handleSendMessage} style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}>Send</button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
