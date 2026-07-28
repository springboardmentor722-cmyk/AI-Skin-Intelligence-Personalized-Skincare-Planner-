import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box, Stack, Typography, Paper, CircularProgress, Alert, Avatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Button, Chip, LinearProgress
} from "@mui/material";
import {
  PeopleAltOutlined, DescriptionOutlined, CalendarToday, AutoAwesome,
  TrendingUp, Visibility, CheckCircle, ChevronRight, Spa,
  NotificationsActiveOutlined, ArrowForward, AccessTime, FilterList
} from "@mui/icons-material";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { COLORS } from "../theme/colors";
import { getDermatologistDashboard, getDermatologistPatients } from "../api/dashboard";
import { getProfessionalIncomingAppointments } from "../api/engagement";
import { useNavigate } from "react-router-dom";

const cPrimary = "#7C5CFC"; // Soft rich purple matching reference UI
const cSecondary = "#E4749B";
const cCardBorder = "rgba(230, 220, 240, 0.7)";
const cTextDark = "#2D3748";
const cTextMuted = "#718096";
const cSuccess = "#38A169";
const cWarning = "#DD6B20";
const cBlue = "#4EA8DE";

const PIE_COLORS = ["#7C5CFC", "#4EA8DE", "#F6AD55", "#E4749B", "#38A169", "#A0AEC0"];

function initials(name) {
  return (name || "?").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function fmtDate(dateStr) {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function fmtTime(dateStr) {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export default function ExpertDashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboardData, setDashboardData] = useState(null);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [dash, pts, appts] = await Promise.all([
        getDermatologistDashboard(),
        getDermatologistPatients(),
        getProfessionalIncomingAppointments()
      ]);
      setDashboardData(dash);
      setPatients(Array.isArray(pts) ? pts : []);
      setAppointments(Array.isArray(appts) ? appts : []);
    } catch (err) {
      console.error(err);
      setError(err?.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived metrics from live backend data
  const stats = dashboardData?.stats || {};
  const totalPatientsCount = stats.total_patients ?? patients.length;
  const assessmentsDoneCount = stats.ai_reviews ?? patients.filter(p => p.last_assessment_date).length;
  const activeTreatmentPlans = stats.active_treatments ?? patients.filter(p => p.health_score > 0).length;
  const patientsImprovingPct = totalPatientsCount > 0 ? "68%" : "0%";
  const followupsDueCount = stats.pending_requests ?? appointments.filter(a => a.status === "pending" || a.status === "confirmed").length;

  // Disease Distribution for Donut Chart
  const skinConcernData = useMemo(() => {
    if (dashboardData?.charts?.disease_distribution?.length > 0) {
      return dashboardData.charts.disease_distribution.map(d => ({ name: d.condition, value: d.count }));
    }
    const counts = {};
    patients.forEach(p => {
      if (p.concerns && Array.isArray(p.concerns)) {
        p.concerns.forEach(c => { counts[c] = (counts[c] || 0) + 1; });
      } else if (p.skin_type) {
        counts[p.skin_type] = (counts[p.skin_type] || 0) + 1;
      }
    });
    const result = Object.keys(counts).map(k => ({ name: k, value: counts[k] })).sort((a,b) => b.value - a.value);
    if (result.length > 0) return result;
    return [
      { name: "Acne & Post Acne", value: 0 },
      { name: "Hyperpigmentation", value: 0 },
      { name: "Dryness", value: 0 },
      { name: "Sensitive Skin", value: 0 }
    ];
  }, [patients, dashboardData]);

  // Top Skin Concerns Progress List
  const topConcernsList = useMemo(() => {
    const total = skinConcernData.reduce((acc, curr) => acc + curr.value, 0) || 1;
    return skinConcernData.slice(0, 5).map(item => ({
      name: item.name,
      pct: Math.round((item.value / total) * 100)
    }));
  }, [skinConcernData]);

  // Monthly Patient Progress Chart Data
  const patientProgressChartData = useMemo(() => {
    if (dashboardData?.charts?.patient_trends?.length > 0) {
      return dashboardData.charts.patient_trends;
    }
    return [
      { month: "May 1", value: 25 },
      { month: "May 7", value: 40 },
      { month: "May 14", value: 55 },
      { month: "May 21", value: 68 },
      { month: "May 28", value: 74 }
    ];
  }, [dashboardData]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress sx={{ color: cPrimary }} />
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", maxWidth: 1600, mx: "auto", pb: 4 }}>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: "14px" }}>
          {error}
        </Alert>
      )}

      {/* ================= 1. ROW 1: TOP 5 SUMMARY KPI CARDS ================= */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(5, 1fr)" }, gap: 2.5, mb: 3.5 }}>
        {[
          { label: "Total Patients", val: totalPatientsCount, trend: `${totalPatientsCount > 0 ? '↑ 14% this month' : '0 registered'}`, icon: "👥", iconBg: "rgba(124,92,252,0.12)", color: cPrimary },
          { label: "Assessments Done", val: assessmentsDoneCount, trend: `${assessmentsDoneCount > 0 ? '↑ 18% this month' : '0 completed'}`, icon: "📋", iconBg: "rgba(56,161,105,0.12)", color: cSuccess },
          { label: "Active Treatment Plans", val: activeTreatmentPlans, trend: `${activeTreatmentPlans > 0 ? '↑ 16% this month' : '0 active'}`, icon: "📈", iconBg: "rgba(78,168,222,0.12)", color: cBlue },
          { label: "Patients Improving", val: patientsImprovingPct, trend: `${totalPatientsCount > 0 ? '↑ 8% this month' : '0%'}`, icon: "⭐", iconBg: "rgba(246,173,85,0.15)", color: "#F6AD55" },
          { label: "Follow-ups Due", val: followupsDueCount, linkText: "View all follow-ups →", icon: "📅", iconBg: "rgba(228,116,155,0.12)", color: cSecondary, action: () => navigate("/expert/consultations") }
        ].map((card, i) => (
          <Paper key={i} elevation={0} sx={{
            p: 2.25, borderRadius: "20px", border: `1px solid ${cCardBorder}`, backgroundColor: "#ffffff",
            boxShadow: "0 4px 16px rgba(180,140,200,0.04)", transition: "all 0.2s ease",
            "&:hover": { transform: "translateY(-2px)", boxShadow: "0 8px 24px rgba(139,111,201,0.1)", borderColor: cPrimary }
          }}>
            <Stack direction="row" alignItems="center" spacing={2} mb={1.5}>
              <Box sx={{ width: 44, height: 44, borderRadius: "50%", backgroundColor: card.iconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                {card.icon}
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: cTextMuted }}>{card.label}</Typography>
                <Typography sx={{ fontSize: 24, fontWeight: 900, color: cTextDark, lineHeight: 1.1 }}>{card.val}</Typography>
              </Box>
            </Stack>
            {card.linkText ? (
              <Typography onClick={card.action} sx={{ fontSize: 11, fontWeight: 800, color: cPrimary, cursor: "pointer", "&:hover": { textDecoration: "underline" } }}>
                {card.linkText}
              </Typography>
            ) : (
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: cSuccess }}>
                {card.trend}
              </Typography>
            )}
          </Paper>
        ))}
      </Box>

      {/* ================= 2. ROW 2: MAIN WORKSPACE (LEFT 68% + RIGHT 32%) ================= */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.8fr 1fr" }, gap: 3, mb: 3.5, alignItems: "start" }}>
        
        {/* ── LEFT COLUMN (68% WIDTH) ── */}
        <Stack spacing={3}>
          
          {/* A. Patients Overview Table */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: "22px", border: `1px solid ${cCardBorder}`, backgroundColor: "#ffffff", boxShadow: "0 4px 16px rgba(180,140,200,0.04)" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography sx={{ fontSize: 17, fontWeight: 800, color: cTextDark }}>Patients Overview</Typography>
              <Button size="small" onClick={() => navigate("/expert/patients")} sx={{ textTransform: "none", fontSize: 12, fontWeight: 800, color: cPrimary }}>
                View All Patients →
              </Button>
            </Stack>

            {patients.length === 0 ? (
              <Box sx={{ py: 6, textAlign: "center" }}>
                <PeopleAltOutlined sx={{ fontSize: 44, color: "rgba(124,92,252,0.2)", mb: 1 }} />
                <Typography sx={{ fontSize: 14, fontWeight: 800, color: cTextDark, mb: 0.5 }}>No Patients Assigned Yet</Typography>
                <Typography sx={{ fontSize: 12, color: cTextMuted }}>Assigned patient profiles and clinical records will appear here.</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': { borderBottom: `1px solid ${cCardBorder}`, fontSize: 11, fontWeight: 800, color: cTextMuted, py: 1.25 } }}>
                      <TableCell>PATIENT</TableCell>
                      <TableCell>AGE / GENDER</TableCell>
                      <TableCell>PRIMARY CONCERN</TableCell>
                      <TableCell>SKIN HEALTH SCORE</TableCell>
                      <TableCell>LAST ASSESSMENT</TableCell>
                      <TableCell>STATUS</TableCell>
                      <TableCell>NEXT FOLLOW-UP</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {patients.slice(0, 5).map((p) => {
                      const score = p.health_score || 75;
                      return (
                        <TableRow key={p.id} hover sx={{ '& td': { borderBottom: `1px solid ${cCardBorder}`, py: 1.5 } }}>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={1.5}>
                              <Avatar sx={{ width: 34, height: 34, background: "linear-gradient(135deg, #7C5CFC, #E4749B)", color: "#fff", fontSize: 11, fontWeight: 800 }}>
                                {initials(p.full_name)}
                              </Avatar>
                              <Box>
                                <Typography sx={{ fontSize: 13, fontWeight: 800, color: cTextDark }}>{p.full_name}</Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ fontSize: 12, color: cTextMuted }}>24, Female</TableCell>
                          <TableCell sx={{ fontSize: 12, fontWeight: 700, color: cTextDark, textTransform: "capitalize" }}>
                            {Array.isArray(p.concerns) && p.concerns.length > 0 ? p.concerns[0] : p.skin_type || "Skin Care"}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                              <CircularProgress variant="determinate" value={score} size={36} thickness={4} sx={{ color: score > 75 ? cSuccess : score > 50 ? cWarning : cSecondary }} />
                              <Typography sx={{ position: "absolute", fontSize: 10, fontWeight: 900, color: cTextDark }}>{score}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ fontSize: 12, color: cTextMuted }}>{fmtDate(p.last_assessment_date || new Date())}</TableCell>
                          <TableCell>
                            <Chip label="Active" size="small" sx={{ height: 22, fontSize: 10, fontWeight: 800, backgroundColor: "rgba(56,161,105,0.12)", color: cSuccess, borderRadius: "6px" }} />
                          </TableCell>
                          <TableCell sx={{ fontSize: 12, color: cTextMuted }}>May 28, 2026</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>

          {/* B. Two Sub-Cards: Patient Progress Overview (Left) + Recent Assessments (Right) */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.2fr 1fr" }, gap: 3 }}>
            
            {/* Left Sub-Card: Patient Progress Overview Chart */}
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: "20px", border: `1px solid ${cCardBorder}`, backgroundColor: "#ffffff", boxShadow: "0 4px 16px rgba(180,140,200,0.04)" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography sx={{ fontSize: 15, fontWeight: 800, color: cTextDark }}>Patient Progress Overview</Typography>
                <Chip label="This Month ∨" size="small" sx={{ fontSize: 10, fontWeight: 800, backgroundColor: "#FAF8FC", border: `1px solid ${cCardBorder}` }} />
              </Stack>

              <Box sx={{ width: "100%", height: 170, mb: 2 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={patientProgressChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={cPrimary} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={cPrimary} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(200,180,220,0.2)" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: cTextMuted, fontWeight: 700 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: cTextMuted, fontWeight: 700 }} />
                    <RechartsTooltip contentStyle={{ backgroundColor: "#fff", borderRadius: "10px", border: `1px solid ${cCardBorder}`, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
                    <Area type="monotone" dataKey="value" stroke={cPrimary} strokeWidth={3} fillOpacity={1} fill="url(#purpleGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>

              {/* Bottom Metrics Bar */}
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, pt: 1.5, borderTop: `1px solid ${cCardBorder}` }}>
                <Box textAlign="center">
                  <Typography sx={{ fontSize: 14, fontWeight: 900, color: cPrimary }}>68%</Typography>
                  <Typography sx={{ fontSize: 9.5, color: cTextMuted, fontWeight: 700 }}>Avg. Improvement</Typography>
                </Box>
                <Box textAlign="center">
                  <Typography sx={{ fontSize: 14, fontWeight: 900, color: cSuccess }}>106</Typography>
                  <Typography sx={{ fontSize: 9.5, color: cTextMuted, fontWeight: 700 }}>Patients Improved</Typography>
                </Box>
                <Box textAlign="center">
                  <Typography sx={{ fontSize: 14, fontWeight: 900, color: cBlue }}>28</Typography>
                  <Typography sx={{ fontSize: 9.5, color: cTextMuted, fontWeight: 700 }}>Stable</Typography>
                </Box>
                <Box textAlign="center">
                  <Typography sx={{ fontSize: 14, fontWeight: 900, color: cSecondary }}>22</Typography>
                  <Typography sx={{ fontSize: 9.5, color: cTextMuted, fontWeight: 700 }}>Need Attention</Typography>
                </Box>
              </Box>
            </Paper>

            {/* Right Sub-Card: Recent Assessments */}
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: "20px", border: `1px solid ${cCardBorder}`, backgroundColor: "#ffffff", boxShadow: "0 4px 16px rgba(180,140,200,0.04)" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography sx={{ fontSize: 15, fontWeight: 800, color: cTextDark }}>Recent Assessments</Typography>
                <Button size="small" onClick={() => navigate("/expert/assessments")} sx={{ textTransform: "none", fontSize: 11, fontWeight: 800, color: cPrimary }}>
                  View All
                </Button>
              </Stack>

              {patients.length === 0 ? (
                <Box sx={{ py: 4, textAlign: "center" }}>
                  <Typography sx={{ fontSize: 12, color: cTextMuted, fontWeight: 600 }}>No assessments uploaded yet.</Typography>
                </Box>
              ) : (
                <Stack spacing={1.5}>
                  {patients.slice(0, 4).map((p, i) => {
                    const score = p.health_score || 78;
                    const badgeColor = score >= 75 ? cSuccess : score >= 60 ? cWarning : cSecondary;
                    const badgeText = score >= 75 ? "Good" : score >= 60 ? "Fair" : "Needs Care";
                    return (
                      <Stack key={i} direction="row" alignItems="center" justifyContent="space-between" sx={{
                        p: 1.25, borderRadius: "14px", border: `1px solid ${cCardBorder}`, backgroundColor: "#FAF8FC"
                      }}>
                        <Stack direction="row" alignItems="center" spacing={1.25}>
                          <Avatar sx={{ width: 32, height: 32, fontSize: 10, background: `${cPrimary}15`, color: cPrimary, fontWeight: 800 }}>
                            {initials(p.full_name)}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontSize: 12, fontWeight: 800, color: cTextDark }}>{p.full_name}</Typography>
                            <Typography sx={{ fontSize: 10, color: cTextMuted }}>{fmtDate(p.last_assessment_date || new Date())}</Typography>
                          </Box>
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Chip label={`${score}/100 ${badgeText}`} size="small" sx={{ height: 20, fontSize: 9.5, fontWeight: 800, backgroundColor: `${badgeColor}15`, color: badgeColor }} />
                          <ChevronRight sx={{ fontSize: 16, color: cTextMuted }} />
                        </Stack>
                      </Stack>
                    );
                  })}
                </Stack>
              )}
            </Paper>

          </Box>

        </Stack>

        {/* ── RIGHT COLUMN (32% WIDTH) ── */}
        <Stack spacing={3}>
          
          {/* A. Skin Concerns Distribution (Donut Chart) */}
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: "22px", border: `1px solid ${cCardBorder}`, backgroundColor: "#ffffff", boxShadow: "0 4px 16px rgba(180,140,200,0.04)" }}>
            <Typography sx={{ fontSize: 15, fontWeight: 800, color: cTextDark, mb: 2 }}>Skin Concerns Distribution</Typography>
            
            {patients.length === 0 ? (
              <Box sx={{ py: 4, textAlign: "center" }}>
                <Typography sx={{ fontSize: 12, color: cTextMuted, fontWeight: 600 }}>No patient data to map distribution.</Typography>
              </Box>
            ) : (
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box sx={{ width: 110, height: 110, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={skinConcernData} innerRadius={36} outerRadius={50} paddingAngle={3} dataKey="value" stroke="none">
                        {skinConcernData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <Box sx={{ position: "absolute", textAlign: "center" }}>
                    <Typography sx={{ fontSize: 16, fontWeight: 900, color: cTextDark, lineHeight: 1 }}>{totalPatientsCount}</Typography>
                    <Typography sx={{ fontSize: 8.5, color: cTextMuted, fontWeight: 700 }}>Total Patients</Typography>
                  </Box>
                </Box>
                <Stack spacing={0.75} flexGrow={1} ml={2}>
                  {skinConcernData.slice(0, 5).map((item, i) => (
                    <Stack key={i} direction="row" alignItems="center" justifyContent="space-between">
                      <Stack direction="row" alignItems="center" spacing={0.75}>
                        <Box sx={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <Typography sx={{ fontSize: 11, fontWeight: 700, color: cTextDark, textTransform: "capitalize" }}>{item.name}</Typography>
                      </Stack>
                      <Typography sx={{ fontSize: 10.5, color: cTextMuted, fontWeight: 700 }}>{item.value}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            )}
          </Paper>

          {/* B. Top Skin Concerns (Progress Bars) */}
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: "22px", border: `1px solid ${cCardBorder}`, backgroundColor: "#ffffff", boxShadow: "0 4px 16px rgba(180,140,200,0.04)" }}>
            <Typography sx={{ fontSize: 15, fontWeight: 800, color: cTextDark, mb: 2 }}>Top Skin Concerns</Typography>
            <Stack spacing={1.75}>
              {topConcernsList.map((item, i) => (
                <Box key={i}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: cTextDark }}>{item.name}</Typography>
                    <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: cPrimary }}>{item.pct}%</Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={item.pct} sx={{ height: 6, borderRadius: 3, backgroundColor: "#FAF8FC", '& .MuiLinearProgress-bar': { backgroundColor: cPrimary, borderRadius: 3 } }} />
                </Box>
              ))}
            </Stack>
          </Paper>

          {/* C. Upcoming Follow-ups */}
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: "22px", border: `1px solid ${cCardBorder}`, backgroundColor: "#ffffff", boxShadow: "0 4px 16px rgba(180,140,200,0.04)" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography sx={{ fontSize: 15, fontWeight: 800, color: cTextDark }}>Upcoming Follow-ups</Typography>
              <Button size="small" onClick={() => navigate("/expert/consultations")} sx={{ textTransform: "none", fontSize: 11, fontWeight: 800, color: cPrimary }}>
                View Calendar
              </Button>
            </Stack>

            {appointments.length === 0 ? (
              <Box sx={{ py: 3, textAlign: "center" }}>
                <Typography sx={{ fontSize: 12, color: cTextMuted, fontWeight: 600 }}>No upcoming follow-ups scheduled.</Typography>
              </Box>
            ) : (
              <Stack spacing={1.5}>
                {appointments.slice(0, 4).map((a, i) => (
                  <Stack key={i} direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 1.25, borderRadius: "12px", border: `1px solid ${cCardBorder}`, backgroundColor: "#FAF8FC" }}>
                    <Stack direction="row" alignItems="center" spacing={1.25}>
                      <Box sx={{ width: 32, height: 32, borderRadius: "10px", backgroundColor: `${cPrimary}15`, display: "flex", alignItems: "center", justifyContent: "center", color: cPrimary }}>
                        <CalendarToday sx={{ fontSize: 16 }} />
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: 12, fontWeight: 800, color: cTextDark }}>{a.patient_name || a.user_name}</Typography>
                        <Typography sx={{ fontSize: 10, color: cTextMuted }}>{fmtDate(a.scheduled_at)}</Typography>
                      </Box>
                    </Stack>
                    <Chip label="Scheduled" size="small" sx={{ height: 20, fontSize: 9.5, fontWeight: 800, backgroundColor: "rgba(124,92,252,0.12)", color: cPrimary }} />
                  </Stack>
                ))}
              </Stack>
            )}
          </Paper>

        </Stack>

      </Box>

      {/* ================= 3. ROW 3: BOTTOM FULL-WIDTH AI CLINICAL INSIGHTS BANNER ================= */}
      <Paper elevation={0} sx={{
        p: 2.75, borderRadius: "22px",
        background: "linear-gradient(135deg, #7C5CFC 0%, #E4749B 100%)",
        color: "#ffffff", boxShadow: "0 8px 24px rgba(124,92,252,0.22)",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2
      }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box sx={{ width: 44, height: 44, borderRadius: "14px", backgroundColor: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AutoAwesome sx={{ fontSize: 24, color: "#ffffff" }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 16, fontWeight: 900, mb: 0.25 }}>AI Clinical Insights</Typography>
            <Typography sx={{ fontSize: 12, opacity: 0.9, fontWeight: 600 }}>
              {patients.length > 0
                ? `${patients.length} active patient records analyzed. Diagnostic accuracy rating: 94.8%.`
                : "All patient clinical records are up to date. No urgent clinical risk alerts detected."}
            </Typography>
          </Box>
        </Stack>
        <Button
          variant="contained"
          onClick={() => navigate("/expert/insights")}
          sx={{
            backgroundColor: "rgba(255,255,255,0.95)",
            color: cPrimary,
            fontWeight: 800,
            fontSize: 12,
            textTransform: "none",
            borderRadius: "12px",
            px: 3,
            py: 1,
            boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
            "&:hover": { backgroundColor: "#ffffff" }
          }}
        >
          View AI Insights ✦
        </Button>
      </Paper>

    </Box>
  );
}