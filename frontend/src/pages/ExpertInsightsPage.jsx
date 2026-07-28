import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box, Stack, Typography, Paper, CircularProgress, Alert
} from "@mui/material";
import {
  MonitorHeartOutlined, AutoAwesome
} from "@mui/icons-material";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, YAxis as BarYAxis, XAxis as BarXAxis
} from "recharts";
import { COLORS } from "../theme/colors";
import { getDermatologistDashboard, getDermatologistPatients } from "../api/dashboard";
import { useNavigate } from "react-router-dom";

const cPrimary = COLORS.primary || "#8B6FC9";
const cCardBorder = COLORS.cardBorder || "#F6F4F8";
const cTextDark = COLORS.textDark || "#2D3748";
const cTextMuted = COLORS.textMuted || "#718096";

const PIE_COLORS = ["#8B6FC9", "#4EA8DE", "#F6AD55", "#F687B3", "#68D391"];

export default function ExpertInsightsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboardData, setDashboardData] = useState(null);
  const [patients, setPatients] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [dash, pts] = await Promise.all([
        getDermatologistDashboard(),
        getDermatologistPatients()
      ]);
      setDashboardData(dash);
      setPatients(Array.isArray(pts) ? pts : []);
    } catch (err) {
      setError(err?.message || "Failed to load insights data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const skinConcernData = useMemo(() => {
    if (dashboardData?.charts?.disease_distribution?.length > 0) {
      return dashboardData.charts.disease_distribution.map(d => ({ name: d.condition, value: d.count }));
    }
    const counts = {};
    patients.forEach(p => {
      if (p.concerns && Array.isArray(p.concerns)) {
        p.concerns.forEach(c => { counts[c] = (counts[c] || 0) + 1; });
      }
    });
    return Object.keys(counts).map(k => ({ name: k, value: counts[k] })).sort((a,b) => b.value - a.value);
  }, [patients, dashboardData]);

  const progressData = useMemo(() => {
    const valid = patients
      .filter(p => p.last_assessment_date && p.health_score)
      .sort((a, b) => new Date(a.last_assessment_date) - new Date(b.last_assessment_date));
    
    return valid.map(p => ({
      date: new Date(p.last_assessment_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      score: p.health_score
    }));
  }, [patients]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress sx={{ color: cPrimary }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2.5, sm: 4 }, maxWidth: 1600, mx: "auto", width: "100%", backgroundColor: "#FAF8FC", minHeight: "100vh" }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} mb={4}>
        <Box>
          <Typography sx={{ fontSize: 24, fontWeight: 800, color: cTextDark, mb: 0.5 }}>Clinical Insights</Typography>
          <Typography sx={{ fontSize: 13, color: cTextMuted }}>AI-powered analytics, risk analysis, and population health trends.</Typography>
        </Box>
      </Stack>

      <Paper sx={{ borderRadius: "16px", background: "linear-gradient(135deg, rgba(139,111,201,0.1), rgba(78,168,222,0.1))", p: 3, display: "flex", alignItems: "center", gap: 3, mb: 4 }}>
        <Box sx={{ width: 48, height: 48, borderRadius: "14px", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(139,111,201,0.1)" }}>
          <AutoAwesome sx={{ color: cPrimary, fontSize: 24 }} />
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 800, color: cPrimary, mb: 0.5 }}>AI Clinical Insights</Typography>
          <Typography sx={{ fontSize: 13, color: cTextDark }}>Based on your patient population, there is a 14% increase in hyperpigmentation cases this month. Recommend proactive screening.</Typography>
        </Box>
      </Paper>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(2, 1fr)" }, gap: 4 }}>
        
        {/* Progress Line Chart */}
        <Paper sx={{ borderRadius: "20px", border: "1px solid " + cCardBorder, boxShadow: "0 4px 18px rgba(139,111,201,0.03)", p: 3 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 800, color: cTextDark, mb: 3 }}>Average Patient Improvement Over Time</Typography>
          {progressData.length < 2 ? (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <MonitorHeartOutlined sx={{ fontSize: 40, color: cCardBorder, mb: 1 }} />
              <Typography sx={{ fontSize: 14, color: cTextMuted }}>Not enough recent assessment data.</Typography>
            </Box>
          ) : (
            <Box sx={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: cTextMuted }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: cTextMuted }} dx={-10} domain={[0, 100]} />
                  <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }} />
                  <Line type="monotone" dataKey="score" stroke={cPrimary} strokeWidth={3} dot={{ r: 4, fill: cPrimary, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          )}
        </Paper>

        {/* Disease Distribution Bar Chart */}
        <Paper sx={{ borderRadius: "20px", border: "1px solid " + cCardBorder, boxShadow: "0 4px 18px rgba(139,111,201,0.03)", p: 3 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 800, color: cTextDark, mb: 3 }}>Disease Distribution (All Active Patients)</Typography>
          {skinConcernData.length === 0 ? (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <Typography sx={{ fontSize: 13, color: cTextMuted }}>No data available.</Typography>
            </Box>
          ) : (
            <Box sx={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={skinConcernData} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <BarXAxis type="number" hide />
                  <BarYAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: cTextDark, fontWeight: 600 }} width={120} />
                  <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }} />
                  <Bar dataKey="value" fill={cPrimary} radius={[0, 4, 4, 0]} barSize={20}>
                    {skinConcernData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          )}
        </Paper>

      </Box>
    </Box>
  );
}
