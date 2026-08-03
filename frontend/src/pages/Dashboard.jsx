import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import api from "../api/axios";
import { getTodayCheckins, logRoutineStep } from "../api/checkins";
import { getPhotos, uploadPhoto } from "../api/photos";
import { getUserAnalytics } from "../api/analytics";
import { calculateSafetyScore } from "../api/ingredients";
import PageHeader from "../components/PageHeader";
import LoadingState from "../components/LoadingState";

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
        if (err.response?.status === 400 || err.response?.status === 404) {
          setNeedsAssessment(true);
          setLoading(false);
          return;
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

      let sleepVal = 8.0;
      let waterVal = 2.0;
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
      } else if (type === "sleep") {
        sleepVal = Math.max(0, sleepVal + increment);
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

  if (loading) return <LoadingState label="Loading your customized dashboard…" />;
  if (me?.role === "dermatologist") return <Navigate to="/dermatologist/dashboard" replace />;
  if (me?.role === "skincare_consultant") return <Navigate to="/consultant/dashboard" replace />;

  const firstName = me?.full_name?.split(" ")[0] || "there";
  const amSteps = routine.filter((s) => s.time_of_day === "AM" || s.time_of_day === "am");
  const pmSteps = routine.filter((s) => s.time_of_day === "PM" || s.time_of_day === "pm");

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayHabit = lifestyleEntries.find(e => e.entry_date === todayStr);
  const todayWater = todayHabit ? todayHabit.water_intake_liters : 1.8;
  const todaySleep = todayHabit ? todayHabit.sleep_hours : 7.0;

  const formattedDate = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  // Calculate SVG line chart coords for score timeline
  const timeline = analyticsData?.score_timeline || [];
  let svgPoints = "20,80 80,60 140,55 200,68 260,42 320,48 380,22"; // default fallback path
  let svgCircles = [
    { x: 20, y: 80, score: 70 },
    { x: 80, y: 60, score: 75 },
    { x: 140, y: 55, score: 78 },
    { x: 200, y: 68, score: 72 },
    { x: 260, y: 42, score: 85 },
    { x: 320, y: 48, score: 82 },
    { x: 380, y: 22, score: 94 }
  ];

  if (timeline.length > 1) {
    const coords = timeline.map((pt, index) => {
      const x = 20 + (index * (360 / (timeline.length - 1)));
      // Map score 0-100 to y 10-100 (where 100 is bottom/0 score, 10 is top/100 score)
      const y = 110 - (pt.score * 0.9);
      return { x, y, score: pt.score };
    });
    svgPoints = coords.map(c => `${c.x},${c.y}`).join(" ");
    svgCircles = coords;
  }

  const rollingCompliance = analyticsData?.compliance?.rolling_7_days;

  return (
    <div className="page dashboard-page" style={{ padding: "0 1rem" }}>
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
          
          {/* TOP 5 STATUS CARDS BLOCK */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem" }}>
            
            {/* Card 1: Skin Health Score */}
            <div className="card" style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between", margin: 0, minHeight: "135px" }}>
              <div>
                <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "var(--color-ink-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Skin Health Score</span>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem", marginTop: "0.4rem" }}>
                  <span style={{ fontSize: "2.2rem", fontWeight: "800", color: "var(--color-ink)" }}>
                    {scoreData ? Math.round(scoreData.overall_score) : 78}
                  </span>
                  <span style={{ fontSize: "0.9rem", color: "var(--color-ink-faint)" }}>/100</span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--color-success)", fontSize: "0.82rem", fontWeight: "700" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--color-success)" }}></span> 
                {scoreData?.overall_score > 85 ? "Excellent" : scoreData?.overall_score > 60 ? "Good" : "Needs Care"}
              </div>
            </div>

            {/* Card 2: Compliance Rate */}
            <div className="card" style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between", margin: 0, minHeight: "135px" }}>
              <div>
                <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "var(--color-ink-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>7-Day Compliance</span>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem", marginTop: "0.4rem" }}>
                  <span style={{ fontSize: "2.2rem", fontWeight: "800", color: "var(--color-primary)" }}>
                    {rollingCompliance !== null ? `${rollingCompliance}%` : "—"}
                  </span>
                </div>
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--color-ink-faint)", margin: 0 }}>
                {rollingCompliance !== null ? "Rolling check-in completion rate" : "Insufficient check-in logs"}
              </p>
            </div>

            {/* Card 3: Top Concerns */}
            <div className="card" style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between", margin: 0, minHeight: "135px" }}>
              <div>
                <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "var(--color-ink-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Top Concerns</span>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--color-ink)", marginTop: "0.4rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {profile?.skin_concerns?.split(",").slice(0, 2).join(" & ") || "Acne & Dryness"}
                </h3>
              </div>
              <Link to="/skin-profile" style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--color-primary)", textDecoration: "none", alignSelf: "flex-start" }}>
                View Analysis →
              </Link>
            </div>

            {/* Card 4: Skin Type */}
            <div className="card" style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between", margin: 0, minHeight: "135px" }}>
              <div>
                <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "var(--color-ink-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Skin Type</span>
                <h3 style={{ fontSize: "1.35rem", fontWeight: "800", color: "var(--color-primary)", marginTop: "0.4rem", textTransform: "capitalize" }}>
                  {profile?.skin_type || "Combination"}
                </h3>
              </div>
              <Link to="/skin-profile" style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--color-primary)", textDecoration: "none", alignSelf: "flex-start" }}>
                Details →
              </Link>
            </div>

            {/* Card 5: Hydration Level */}
            <div className="card" style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between", margin: 0, minHeight: "135px" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "var(--color-ink-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Hydration Level</span>
                  <span style={{ fontSize: "0.82rem", color: "var(--color-primary)", fontWeight: "700" }}>{todayWater >= 2.0 ? "Ideal" : "Low"}</span>
                </div>
                <div style={{ fontSize: "1.2rem", fontWeight: "800", color: "var(--color-ink)", marginTop: "0.4rem" }}>
                  {todayWater.toFixed(1)} L <span style={{ fontSize: "0.85rem", color: "var(--color-ink-faint)", fontWeight: "500" }}>/ 2.5 L</span>
                </div>
              </div>
              <div style={{ marginTop: "0.5rem" }}>
                <div style={{ width: "100%", height: "6px", background: "var(--color-surface-sunken)", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(100, (todayWater / 2.5) * 100)}%`, height: "100%", background: "var(--color-primary)", borderRadius: "4px" }} />
                </div>
              </div>
            </div>

          </div>

          {/* MIDDLE GRID: Today's Routine, Skin Health Progress, and Photo Timeline */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            
            {/* AM/PM Daily Routine */}
            <div className="card" style={{ padding: "1.5rem 1.75rem", margin: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--color-border)", paddingBottom: "1rem", marginBottom: "1.25rem" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--color-ink)" }}>☀️ AM/PM Routine Checklists</h3>
                <span style={{ fontSize: "0.8rem", color: "var(--color-ink-muted)" }}>Tap steps to toggle completion</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                
                {/* Morning Routine Checklist */}
                <div>
                  <div style={{ fontSize: "0.78rem", fontWeight: "800", color: "var(--color-ink-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span>☀️</span> Morning Routine
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    {amSteps.length === 0 ? (
                      <p style={{ fontSize: "0.85rem", color: "var(--color-ink-faint)" }}>No AM steps generated yet.</p>
                    ) : (
                      amSteps.map((step) => {
                        const isCompleted = completedStepIds.includes(step.id);
                        return (
                          <div 
                            key={step.id} 
                            onClick={() => handleCheckboxChange(step.id, isCompleted)}
                            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 0.75rem", background: isCompleted ? "var(--color-primary-tint)" : "var(--color-bg)", borderRadius: "var(--radius-sm)", cursor: "pointer", transition: "all 0.2s", border: isCompleted ? "1px solid var(--color-primary)" : "1px solid transparent" }}
                          >
                            <span style={{ fontSize: "0.88rem", fontWeight: "600", color: isCompleted ? "var(--color-primary-dark)" : "var(--color-ink)" }}>
                              Step {step.step_number}: {step.step_category}
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

                {/* Evening Routine Checklist */}
                <div>
                  <div style={{ fontSize: "0.78rem", fontWeight: "800", color: "var(--color-ink-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span>🌙</span> Evening Routine
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    {pmSteps.length === 0 ? (
                      <p style={{ fontSize: "0.85rem", color: "var(--color-ink-faint)" }}>No PM steps generated yet.</p>
                    ) : (
                      pmSteps.map((step) => {
                        const isCompleted = completedStepIds.includes(step.id);
                        return (
                          <div 
                            key={step.id} 
                            onClick={() => handleCheckboxChange(step.id, isCompleted)}
                            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 0.75rem", background: isCompleted ? "var(--color-primary-tint)" : "var(--color-bg)", borderRadius: "var(--radius-sm)", cursor: "pointer", transition: "all 0.2s", border: isCompleted ? "1px solid var(--color-primary)" : "1px solid transparent" }}
                          >
                            <span style={{ fontSize: "0.88rem", fontWeight: "600", color: isCompleted ? "var(--color-primary-dark)" : "var(--color-ink)" }}>
                              Step {step.step_number}: {step.step_category}
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
            </div>

            {/* Score History Graph & Progress Photos */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              
              {/* Skin Health Progress */}
              <div className="card" style={{ padding: "1.5rem", margin: 0 }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--color-ink)", marginBottom: "0.25rem" }}>Skin Health Progress</h3>
                <p style={{ fontSize: "0.82rem", color: "var(--color-ink-muted)", marginBottom: "1.25rem" }}>
                  Your skin health score trend calculated from assessments.
                </p>

                <div style={{ width: "100%", overflowX: "auto" }}>
                  <svg viewBox="0 0 400 120" style={{ width: "100%", height: "auto" }}>
                    <polyline
                      fill="none"
                      stroke="var(--color-primary)"
                      strokeWidth="3.5"
                      points={svgPoints}
                    />
                    {svgCircles.map((pt, i) => (
                      <g key={i}>
                        <circle cx={pt.x} cy={pt.y} r="5" fill="#ffffff" stroke="var(--color-primary)" strokeWidth="3" />
                        <text x={pt.x} y={pt.y - 8} fontSize="7" fontWeight="bold" fill="var(--color-ink)" textAnchor="middle">{Math.round(pt.score)}</text>
                      </g>
                    ))}
                  </svg>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--color-ink-faint)", marginTop: "0.6rem" }}>
                    {timeline.length > 0 ? (
                      <>
                        <span>{new Date(timeline[0].created_at).toLocaleDateString()}</span>
                        <span>{new Date(timeline[timeline.length - 1].created_at).toLocaleDateString()}</span>
                      </>
                    ) : (
                      <>
                        <span>Baseline</span>
                        <span>Latest</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Photo Upload Widget */}
              <div className="card" style={{ padding: "1.5rem", margin: 0 }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--color-ink)", marginBottom: "0.25rem" }}>📸 Selfie Progress Upload</h3>
                <p style={{ fontSize: "0.82rem", color: "var(--color-ink-muted)", marginBottom: "1rem" }}>
                  Add a photo to build your progress timeline.
                </p>

                {uploadStatus && (
                  <div className={`status-msg ${uploadStatus.type}`} style={{ marginBottom: "1rem", fontSize: "0.82rem" }}>
                    {uploadStatus.text}
                  </div>
                )}

                <form onSubmit={handlePhotoUpload} style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={(e) => setPhotoFile(e.target.files[0])}
                    style={{ fontSize: "0.82rem", width: "100%", maxWidth: "200px" }}
                  />
                  <select 
                    value={photoTag} 
                    onChange={(e) => setPhotoTag(e.target.value)}
                    style={{ padding: "0.4rem 0.6rem", fontSize: "0.82rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}
                  >
                    <option value="Baseline">Baseline</option>
                    <option value="Week 2">Week 2</option>
                    <option value="Week 4">Week 4</option>
                    <option value="Week 8">Week 8</option>
                    <option value="Latest">Latest</option>
                  </select>
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-sm" 
                    disabled={uploadingPhoto || !photoFile}
                    style={{ padding: "0.5rem 1rem" }}
                  >
                    {uploadingPhoto ? "Uploading..." : "Upload Photo"}
                  </button>
                </form>

                {/* Progress Gallery strip */}
                {analyticsData?.photo_history?.length > 0 && (
                  <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem", overflowX: "auto", padding: "0.25rem 0" }}>
                    {analyticsData.photo_history.map((photo, index) => (
                      <div key={index} style={{ position: "relative", flexShrink: 0, width: "65px", height: "65px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", overflow: "hidden" }}>
                        <img src={photo.cloud_url} alt={photo.tag} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <span style={{ position: "absolute", bottom: 0, left: 0, width: "100%", background: "rgba(0,0,0,0.65)", color: "#fff", fontSize: "0.62rem", textAlign: "center", fontWeight: "700" }}>
                          {photo.tag}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* TODAY'S HABITS SECTION */}
          <div className="card" style={{ padding: "1.5rem 1.75rem", margin: 0 }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--color-ink)", marginBottom: "1.25rem" }}>💧 Lifestyle Habit Trackers</h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--color-bg)", padding: "1rem 1.25rem", borderRadius: "var(--radius-md)" }}>
                <div>
                  <strong style={{ fontSize: "0.95rem", color: "var(--color-ink)" }}>Water Intake</strong>
                  <div style={{ fontSize: "0.78rem", color: "var(--color-ink-muted)", marginTop: "0.2rem" }}>Target: 2.5L / Day</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <button className="btn btn-secondary btn-sm" style={{ padding: "0.3rem 0.6rem", fontSize: "0.78rem" }} onClick={() => handleHabitChange("water", -0.25)} disabled={actionLoading}>-250ml</button>
                  <span style={{ fontWeight: "700", fontSize: "0.9rem" }}>{todayWater.toFixed(2)} L</span>
                  <button className="btn btn-primary btn-sm" style={{ padding: "0.3rem 0.6rem", fontSize: "0.78rem" }} onClick={() => handleHabitChange("water", 0.25)} disabled={actionLoading}>+250ml</button>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--color-bg)", padding: "1rem 1.25rem", borderRadius: "var(--radius-md)" }}>
                <div>
                  <strong style={{ fontSize: "0.95rem", color: "var(--color-ink)" }}>Sleep Hours</strong>
                  <div style={{ fontSize: "0.78rem", color: "var(--color-ink-muted)", marginTop: "0.2rem" }}>Target: 8.0h / Day</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <button className="btn btn-secondary btn-sm" style={{ padding: "0.3rem 0.6rem", fontSize: "0.78rem" }} onClick={() => handleHabitChange("sleep", -0.5)} disabled={actionLoading}>-0.5h</button>
                  <span style={{ fontWeight: "700", fontSize: "0.9rem" }}>{todaySleep.toFixed(1)} h</span>
                  <button className="btn btn-primary btn-sm" style={{ padding: "0.3rem 0.6rem", fontSize: "0.78rem" }} onClick={() => handleHabitChange("sleep", 0.5)} disabled={actionLoading}>+0.5h</button>
                </div>
              </div>

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
    </div>
  );
}
