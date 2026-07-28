import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box, Stack, Typography, Paper, CircularProgress, Alert, Avatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, Button, Divider
} from "@mui/material";
import {
  PeopleAltOutlined, AssessmentOutlined, FormatListBulletedOutlined,
  TrendingUp, CalendarToday, MoreVert, Spa
} from "@mui/icons-material";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, YAxis as BarYAxis, XAxis as BarXAxis, Tooltip
} from "recharts";
import { COLORS } from "../theme/colors";
import { getConsultantDashboard, getConsultantUsers } from "../api/dashboard";
import { getProfessionalIncomingAppointments } from "../api/engagement";
import { useNavigate } from "react-router-dom";

const cPrimary = COLORS.primary || "#8B6FC9";
const cCardBorder = COLORS.cardBorder || "#F6F4F8";
const cTextDark = COLORS.textDark || "#2D3748";
const cTextMuted = COLORS.textMuted || "#718096";
const cSuccess = COLORS.success || "#38A169";
const cWarning = COLORS.warning || "#DD6B20";

const PIE_COLORS = ["#8B6FC9", "#4EA8DE", "#F6AD55", "#F687B3", "#68D391"];

function initials(name) {
  return (name || "?").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function fmtDate(dateStr) {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function ConsultantDashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboardData, setDashboardData] = useState(null);
  const [clients, setClients] = useState([]);
  const [appointments, setAppointments] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [dash, cls, appts] = await Promise.all([
        getConsultantDashboard(),
        getConsultantUsers(),
        getProfessionalIncomingAppointments()
      ]);
      setDashboardData(dash);
      setClients(Array.isArray(cls) ? cls : []);
      setAppointments(Array.isArray(appts) ? appts : []);
    } catch (err) {
      setError(err?.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived Data for Charts using REAL backend data
  const skinTypeData = useMemo(() => {
    const counts = {};
    clients.forEach(c => {
      const st = c.skin_type || "Unknown";
      counts[st] = (counts[st] || 0) + 1;
    });
    return Object.keys(counts).map(k => ({ name: k, value: counts[k] })).sort((a,b) => b.value - a.value);
  }, [clients]);

  const concernData = useMemo(() => {
    const counts = {};
    clients.forEach(c => {
      if (c.concerns && Array.isArray(c.concerns)) {
        c.concerns.forEach(concern => {
          counts[concern] = (counts[concern] || 0) + 1;
        });
      }
    });
    return Object.keys(counts)
      .map(k => ({ name: k, count: counts[k] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // top 5
  }, [clients]);

  const progressData = useMemo(() => {
    // We plot recent clients' health scores over their assessment dates
    const valid = clients
      .filter(c => c.last_assessment_date && c.health_score)
      .sort((a, b) => new Date(a.last_assessment_date) - new Date(b.last_assessment_date));
    
    return valid.map(c => ({
      date: new Date(c.last_assessment_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      score: c.health_score
    }));
  }, [clients]);

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

  const stats = dashboardData?.stats || {};
  
  return (
    <Box sx={{ p: { xs: 2.5, sm: 4 }, maxWidth: 1600, mx: "auto", width: "100%", backgroundColor: "#FAF8FC", minHeight: "100vh" }}>
      
      {/* KPI Cards Row */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(5, 1fr)" }, gap: 3, mb: 4 }}>
        {[
          { label: "Total Clients", val: stats.total_assigned_users || 0, color: "#8B6FC9", icon: PeopleAltOutlined },
          { label: "Assessments Done", val: stats.completed_consultations || 0, color: cSuccess, icon: AssessmentOutlined },
          { label: "Active Routines", val: stats.active_skincare_plans || 0, color: "#4EA8DE", icon: FormatListBulletedOutlined },
          { label: "Avg. Improvement", val: `${stats.average_user_improvement || 0}%`, color: "#F6AD55", icon: TrendingUp },
          { label: "Upcoming Follow-ups", val: appointments.length || 0, color: "#F687B3", icon: CalendarToday }
        ].map((k, i) => {
          const Icon = k.icon;
          return (
            <Paper key={i} sx={{ p: 3, borderRadius: "20px", border: "1px solid " + cCardBorder, display: "flex", alignItems: "center", gap: 2.5, boxShadow: "0 4px 18px rgba(139,111,201,0.03)" }}>
              <Box sx={{ width: 50, height: 50, borderRadius: "50%", backgroundColor: `${k.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon sx={{ fontSize: 24, color: k.color }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, color: cTextMuted, fontWeight: 700 }}>{k.label}</Typography>
                <Typography sx={{ fontSize: 24, fontWeight: 800, color: cTextDark, lineHeight: 1.2 }}>{k.val}</Typography>
              </Box>
            </Paper>
          )
        })}
      </Box>

      {/* Main Grid */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" }, gap: 4 }}>
        
        {/* LEFT COLUMN */}
        <Stack spacing={4}>
          
          {/* Client Overview Table */}
          <Paper sx={{ borderRadius: "20px", border: "1px solid " + cCardBorder, overflow: "hidden", boxShadow: "0 4px 18px rgba(139,111,201,0.03)", p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography sx={{ fontSize: 16, fontWeight: 800, color: cTextDark }}>Client Overview</Typography>
              <Button size="small" sx={{ textTransform: "none", fontWeight: 700, color: cPrimary }} onClick={() => navigate("/consultant/clients")}>
                View All Clients →
              </Button>
            </Stack>
            
            {clients.length === 0 ? (
              <Box sx={{ py: 6, textAlign: "center" }}>
                <PeopleAltOutlined sx={{ fontSize: 40, color: cCardBorder, mb: 1 }} />
                <Typography sx={{ fontSize: 14, color: cTextMuted }}>No assigned clients found.</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table sx={{ minWidth: 700 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontSize: 11, fontWeight: 800, color: cTextMuted, borderBottom: "none" }}>CLIENT NAME</TableCell>
                      <TableCell sx={{ fontSize: 11, fontWeight: 800, color: cTextMuted, borderBottom: "none" }}>SKIN TYPE</TableCell>
                      <TableCell sx={{ fontSize: 11, fontWeight: 800, color: cTextMuted, borderBottom: "none" }}>HEALTH SCORE</TableCell>
                      <TableCell sx={{ fontSize: 11, fontWeight: 800, color: cTextMuted, borderBottom: "none" }}>LAST ASSESSMENT</TableCell>
                      <TableCell sx={{ fontSize: 11, fontWeight: 800, color: cTextMuted, borderBottom: "none" }} align="right"></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {clients.slice(0, 5).map(c => (
                      <TableRow key={c.id} hover sx={{ '& td': { borderBottom: "1px solid #F0E8FD" } }}>
                        <TableCell>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar sx={{ width: 32, height: 32, background: `${cPrimary}15`, color: cPrimary, fontWeight: 800, fontSize: 12 }}>
                              {initials(c.full_name)}
                            </Avatar>
                            <Box>
                              <Typography sx={{ fontSize: 13, fontWeight: 700, color: cTextDark }}>{c.full_name}</Typography>
                              <Typography sx={{ fontSize: 11, color: cTextMuted }}>{c.age || 0} yrs, {c.gender || "U"}</Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: cPrimary, textTransform: "capitalize" }}>{c.skin_type || "Unknown"}</Typography>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <CircularProgress variant="determinate" value={c.health_score || 0} size={24} sx={{ color: (c.health_score || 0) > 75 ? cSuccess : cWarning }} />
                            <Typography sx={{ fontSize: 13, fontWeight: 800, color: cTextDark }}>{c.health_score || 0}<span style={{ color: cTextMuted, fontSize: 11, fontWeight: 600 }}>/100</span></Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 13, color: cTextDark }}>{fmtDate(c.last_assessment_date)}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" sx={{ color: cTextMuted }}>
                            <MoreVert sx={{ fontSize: 18 }} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>

          {/* Client Progress Line Chart */}
          <Paper sx={{ borderRadius: "20px", border: "1px solid " + cCardBorder, boxShadow: "0 4px 18px rgba(139,111,201,0.03)", p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography sx={{ fontSize: 16, fontWeight: 800, color: cTextDark }}>Client Progress Overview</Typography>
            </Stack>
            {progressData.length < 2 ? (
              <Box sx={{ py: 6, textAlign: "center" }}>
                <TrendingUp sx={{ fontSize: 40, color: cCardBorder, mb: 1 }} />
                <Typography sx={{ fontSize: 14, color: cTextMuted }}>Not enough recent assessment data to visualize progress.</Typography>
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

          {/* Consultant Tip Banner */}
          <Paper sx={{ borderRadius: "16px", background: "linear-gradient(135deg, rgba(139,111,201,0.1), rgba(78,168,222,0.1))", p: 3, display: "flex", alignItems: "center", gap: 3 }}>
            <Box sx={{ width: 48, height: 48, borderRadius: "14px", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(139,111,201,0.1)" }}>
              <Spa sx={{ color: cPrimary, fontSize: 24 }} />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Typography sx={{ fontSize: 15, fontWeight: 800, color: cPrimary, mb: 0.5 }}>Consultant Tip</Typography>
              <Typography sx={{ fontSize: 13, color: cTextDark }}>Clients who follow routines consistently show 2x better improvement. Encourage hydration and sunscreen daily!</Typography>
            </Box>
            <Button variant="contained" sx={{ background: "#fff", color: cPrimary, fontWeight: 700, textTransform: "none", boxShadow: "none", '&:hover': { background: "#f8f8f8" } }}>
              View AI Insights ✦
            </Button>
          </Paper>

        </Stack>

        {/* RIGHT COLUMN */}
        <Stack spacing={4}>
          
          {/* Donut Chart: Skin Types */}
          <Paper sx={{ borderRadius: "20px", border: "1px solid " + cCardBorder, boxShadow: "0 4px 18px rgba(139,111,201,0.03)", p: 3 }}>
            <Typography sx={{ fontSize: 16, fontWeight: 800, color: cTextDark, mb: 3 }}>Clients by Skin Type</Typography>
            {skinTypeData.length === 0 ? (
              <Box sx={{ py: 4, textAlign: "center" }}>
                <Typography sx={{ fontSize: 13, color: cTextMuted }}>No data available.</Typography>
              </Box>
            ) : (
              <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
                <Box sx={{ width: 140, height: 140, position: "relative" }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={skinTypeData} innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value" stroke="none">
                        {skinTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <Typography sx={{ fontSize: 20, fontWeight: 800, color: cTextDark }}>{clients.length}</Typography>
                    <Typography sx={{ fontSize: 10, color: cTextMuted, fontWeight: 700 }}>Total Clients</Typography>
                  </Box>
                </Box>
                <Stack spacing={1.5} flexGrow={1}>
                  {skinTypeData.map((entry, index) => (
                    <Stack key={index} direction="row" alignItems="center" justifyContent="space-between">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                        <Typography sx={{ fontSize: 12, color: cTextDark, textTransform: "capitalize", fontWeight: 600 }}>{entry.name}</Typography>
                      </Stack>
                      <Typography sx={{ fontSize: 12, color: cTextMuted }}>{entry.value} ({Math.round((entry.value/clients.length)*100)}%)</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            )}
          </Paper>

          {/* Horizontal Bar Chart: Top Skin Concerns */}
          <Paper sx={{ borderRadius: "20px", border: "1px solid " + cCardBorder, boxShadow: "0 4px 18px rgba(139,111,201,0.03)", p: 3 }}>
            <Typography sx={{ fontSize: 16, fontWeight: 800, color: cTextDark, mb: 3 }}>Top Skin Concerns</Typography>
            {concernData.length === 0 ? (
              <Box sx={{ py: 4, textAlign: "center" }}>
                <Typography sx={{ fontSize: 13, color: cTextMuted }}>No data available.</Typography>
              </Box>
            ) : (
              <Box sx={{ width: "100%", height: 220 }}>
                <ResponsiveContainer>
                  <BarChart data={concernData} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <BarXAxis type="number" hide />
                    <BarYAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: cTextDark, fontWeight: 600 }} width={120} />
                    <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }} />
                    <Bar dataKey="count" fill={cPrimary} radius={[0, 4, 4, 0]} barSize={12}>
                      {concernData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Paper>
          
          {/* Recent Assessments List */}
          <Paper sx={{ borderRadius: "20px", border: "1px solid " + cCardBorder, boxShadow: "0 4px 18px rgba(139,111,201,0.03)", p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography sx={{ fontSize: 16, fontWeight: 800, color: cTextDark }}>Recent Assessments</Typography>
              <Button size="small" sx={{ textTransform: "none", fontWeight: 700, color: cPrimary }} onClick={() => navigate("/consultant/assessments")}>
                View All
              </Button>
            </Stack>
            <Stack spacing={0} divider={<Divider sx={{ my: 1.5, borderColor: "#F0E8FD" }} />}>
              {clients.filter(c => c.last_assessment_date).sort((a,b) => new Date(b.last_assessment_date) - new Date(a.last_assessment_date)).slice(0,4).map((c, i) => (
                <Stack key={i} direction="row" alignItems="center" justifyContent="space-between">
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar sx={{ width: 32, height: 32, background: `${cPrimary}15`, color: cPrimary, fontWeight: 800, fontSize: 12 }}>
                      {initials(c.full_name)}
                    </Avatar>
                    <Box>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: cTextDark }}>{c.full_name}</Typography>
                      <Typography sx={{ fontSize: 11, color: cTextMuted }}>{fmtDate(c.last_assessment_date)}</Typography>
                    </Box>
                  </Stack>
                  <Box textAlign="right">
                    <Typography sx={{ fontSize: 13, fontWeight: 800, color: (c.health_score || 0) > 75 ? cSuccess : cWarning }}>{c.health_score || 0}/100</Typography>
                    <Typography sx={{ fontSize: 11, color: cTextMuted }}>Score</Typography>
                  </Box>
                </Stack>
              ))}
              {clients.filter(c => c.last_assessment_date).length === 0 && (
                <Typography sx={{ fontSize: 13, color: cTextMuted, textAlign: "center", py: 2 }}>No recent assessments.</Typography>
              )}
            </Stack>
          </Paper>

        </Stack>
      </Box>
    </Box>
  );
}
