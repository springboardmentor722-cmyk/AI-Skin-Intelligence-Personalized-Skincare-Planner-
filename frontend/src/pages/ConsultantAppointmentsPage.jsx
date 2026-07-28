import { useState, useEffect, useCallback } from "react";
import {
  Box, Stack, Typography, Avatar, IconButton, Button, CircularProgress,
  Chip, InputBase, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, Breadcrumbs, Link, Grid, Select, MenuItem,
  Alert
} from "@mui/material";
import {
  Search, Add, Edit, MoreVert, FilterList, EventNoteOutlined,
  CalendarToday, AccessTime, CancelOutlined, Autorenew, FileDownloadOutlined,
  VideocamOutlined, CheckCircle, ArrowForward, ChevronLeft, ChevronRight
} from "@mui/icons-material";
import { COLORS } from "../theme/colors";
import { getConsultantAppointments } from "../api/dashboard";
import { updateAppointmentStatusNew } from "../api/engagement";

const cPrimary = COLORS.primary || "#8B6FC9";
const cCardBorder = COLORS.cardBorder || "#F6F4F8";
const cTextDark = COLORS.textDark || "#2D3748";
const cTextMuted = COLORS.textMuted || "#718096";
const cSuccess = COLORS.success || "#38A169";
const cWarning = COLORS.warning || "#DD6B20";
const cDanger = COLORS.danger || "#E53E3E";
const cSecondary = "#4EA8DE";

function initials(name) {
  return (name || "?").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function fmtDate(dateStr) {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" });
}

function fmtTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function isToday(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const today = new Date();
  return d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
}

export default function ConsultantAppointmentsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [appointmentsData, setAppointmentsData] = useState({ upcoming: [], completed: [], cancelled: [] });
  
  // Filters and Pagination
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getConsultantAppointments();
      setAppointmentsData(res || { upcoming: [], completed: [], cancelled: [] });
    } catch (err) {
      setError(err?.message || "Failed to load appointments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const allAppointments = [
    ...(appointmentsData.upcoming || []),
    ...(appointmentsData.completed || []),
    ...(appointmentsData.cancelled || [])
  ].sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at));

  // Derived metrics
  const totalAppointments = allAppointments.length;
  const upcomingCount = appointmentsData.upcoming?.length || 0;
  const todayCount = appointmentsData.upcoming?.filter(a => isToday(a.scheduled_at)).length || 0;
  const cancelledCount = appointmentsData.cancelled?.length || 0;

  const todayAppts = (appointmentsData.upcoming || []).filter(a => isToday(a.scheduled_at));
  const upcomingAppts = (appointmentsData.upcoming || []).filter(a => !isToday(a.scheduled_at) && new Date(a.scheduled_at) > new Date());

  // Filtered list
  const filteredAppointments = allAppointments.filter(a => {
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (dateFilter === "today" && !isToday(a.scheduled_at)) return false;
    if (typeFilter !== "all" && "video consultation" !== typeFilter) return false; // mockup all video
    
    if (search) {
      const q = search.toLowerCase();
      if (!a.user_name?.toLowerCase().includes(q) && !a.user_email?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const handleStatusUpdate = async (apptId, newStatus) => {
    try {
      await updateAppointmentStatusNew(apptId, newStatus);
      setSuccess(`Appointment status updated to ${newStatus}.`);
      loadAppointments();
    } catch (err) {
      setError(err?.message || "Failed to update appointment.");
    }
  };

  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <Box sx={{ p: { xs: 2.5, sm: 4 }, maxWidth: 1600, mx: "auto", width: "100%", backgroundColor: "#FAF8FC", minHeight: "100vh" }}>
      {/* Header section */}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} mb={4} spacing={2}>
        <Box>
          <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: 13, color: cTextMuted, mb: 1 }}>
            <Link underline="hover" color="inherit" href="/consultant/dashboard">Dashboard</Link>
            <Typography color="text.primary" sx={{ fontSize: 13, fontWeight: 700 }}>Appointments</Typography>
          </Breadcrumbs>
          <Typography sx={{ fontSize: 28, fontWeight: 800, color: cTextDark, mb: 0.5 }}>Appointments</Typography>
          <Typography sx={{ fontSize: 14, color: cTextMuted }}>Manage and view all your client appointments in one place.</Typography>
        </Box>
        <Stack direction="row" spacing={2} sx={{ height: 42 }}>
          <Button variant="outlined" startIcon={<FileDownloadOutlined />} sx={{ height: "100%", borderRadius: "10px", borderColor: cCardBorder, color: cTextDark, textTransform: "none", fontWeight: 700 }}>
            Export
          </Button>
          <Button variant="outlined" onClick={loadAppointments} startIcon={<Autorenew />} sx={{ height: "100%", borderRadius: "10px", borderColor: cCardBorder, color: cTextDark, textTransform: "none", fontWeight: 700 }}>
            Refresh
          </Button>
          <Button variant="contained" startIcon={<Add />} sx={{ height: "100%", backgroundColor: cPrimary, color: "#fff", textTransform: "none", fontWeight: 700, borderRadius: "10px", px: 3, boxShadow: "none", '&:hover': { backgroundColor: "#7c61b4", boxShadow: "none" } }}>
            New Appointment
          </Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess("")}>{success}</Alert>}

      <Grid container spacing={4}>
        {/* LEFT COLUMN - MAIN */}
        <Grid item xs={12} lg={9}>
          {/* KPI Cards */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }, gap: 3, mb: 4 }}>
            {[
              { label: "Total Appointments", val: totalAppointments, color: cPrimary, change: "+12%", icon: EventNoteOutlined },
              { label: "Upcoming", val: upcomingCount, color: cSuccess, change: "+8%", icon: CalendarToday },
              { label: "Today", val: todayCount, color: cWarning, change: "— No change", icon: AccessTime },
              { label: "Cancelled", val: cancelledCount, color: cDanger, change: "-4%", icon: CancelOutlined }
            ].map((k, i) => {
              const Icon = k.icon;
              return (
                <Paper key={i} sx={{ p: 3, borderRadius: "20px", border: "1px solid " + cCardBorder, backgroundColor: "#fff", position: 'relative', overflow: 'hidden', boxShadow: "0 4px 18px rgba(139,111,201,0.03)" }}>
                  <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                    <Box sx={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: `${k.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon sx={{ fontSize: 20, color: k.color }} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 12, color: cTextMuted, fontWeight: 700 }}>{k.label}</Typography>
                      <Typography sx={{ fontSize: 24, fontWeight: 800, color: cTextDark, lineHeight: 1.2 }}>{k.val}</Typography>
                    </Box>
                  </Stack>
                  <Typography sx={{ fontSize: 11, color: k.change.startsWith("-") || k.change.includes("No") ? cTextMuted : cSuccess, fontWeight: 600 }}>
                    {k.change.startsWith("+") ? "↑" : (k.change.startsWith("-") ? "↓" : "")} {k.change.replace("— ", "")} {k.change.includes("No") ? "" : "from last month"}
                  </Typography>
                  
                  {/* Decorative mini sparkline */}
                  <Box sx={{ position: 'absolute', bottom: -10, left: 0, right: 0, height: 40, opacity: 0.2 }}>
                    <svg viewBox="0 0 100 30" preserveAspectRatio="none" width="100%" height="100%">
                      <path d={i%2 === 0 ? "M0 30 Q 15 10 30 20 T 60 10 T 100 20 L 100 30 Z" : "M0 30 Q 20 20 40 10 T 80 20 T 100 10 L 100 30 Z"} fill="none" stroke={k.color} strokeWidth="3" />
                    </svg>
                  </Box>
                </Paper>
              )
            })}
          </Box>

          {/* Filters and Search */}
          <Paper sx={{ p: 2.5, borderRadius: "20px", border: "1px solid " + cCardBorder, backgroundColor: "#fff", mb: 4, display: "flex", flexWrap: "wrap", gap: 3, alignItems: "center", boxShadow: "0 4px 18px rgba(139,111,201,0.03)" }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ backgroundColor: "#F9F8FA", border: "1px solid " + cCardBorder, borderRadius: "12px", px: 2, py: 1.5, flexGrow: 1, minWidth: 280 }}>
              <Search sx={{ fontSize: 20, color: cTextMuted }} />
              <InputBase placeholder="Search appointments by client name, email or phone..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ fontSize: 14, width: "100%", color: cTextDark }} />
            </Stack>
            
            <Box sx={{ display: "flex", gap: 3, alignItems: "center" }}>
              <Box>
                <Typography sx={{ fontSize: 11, color: cTextMuted, mb: 0.5, fontWeight: 700 }}>Status</Typography>
                <Select size="small" variant="standard" disableUnderline value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ fontSize: 14, fontWeight: 600, color: cTextDark, minWidth: 100 }}>
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </Box>

              <Box>
                <Typography sx={{ fontSize: 11, color: cTextMuted, mb: 0.5, fontWeight: 700 }}>Date</Typography>
                <Select size="small" variant="standard" disableUnderline value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} sx={{ fontSize: 14, fontWeight: 600, color: cTextDark, minWidth: 100 }}>
                  <MenuItem value="all">All Dates</MenuItem>
                  <MenuItem value="today">Today</MenuItem>
                  <MenuItem value="upcoming">Upcoming</MenuItem>
                </Select>
              </Box>
              
              <Box>
                <Typography sx={{ fontSize: 11, color: cTextMuted, mb: 0.5, fontWeight: 700 }}>Type</Typography>
                <Select size="small" variant="standard" disableUnderline value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} sx={{ fontSize: 14, fontWeight: 600, color: cTextDark, minWidth: 100 }}>
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="video">Video Call</MenuItem>
                  <MenuItem value="in-person">In-Person</MenuItem>
                </Select>
              </Box>
              
              <Button variant="outlined" startIcon={<FilterList />} sx={{ height: 42, mt: 2, borderRadius: "10px", textTransform: "none", color: cTextDark, borderColor: cCardBorder, fontWeight: 700 }}>
                Filters
              </Button>
            </Box>
          </Paper>

          {/* Main Table */}
          <Paper sx={{ borderRadius: "20px", border: "1px solid " + cCardBorder, backgroundColor: "#fff", overflow: "hidden", boxShadow: "0 4px 18px rgba(139,111,201,0.03)" }}>
            {loading ? (
              <Stack alignItems="center" justifyContent="center" sx={{ py: 10 }}>
                <CircularProgress sx={{ color: cPrimary }} />
              </Stack>
            ) : filteredAppointments.length === 0 ? (
              <Box sx={{ py: 10, px: 3, textAlign: "center" }}>
                <Typography sx={{ fontSize: 18, fontWeight: 800, color: cTextDark, mb: 1 }}>No appointments found</Typography>
                <Typography sx={{ fontSize: 13, color: cTextMuted }}>Try adjusting your search or filters.</Typography>
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table sx={{ minWidth: 1000 }}>
                    <TableHead sx={{ backgroundColor: "#FDFCFE" }}>
                      <TableRow>
                        <TableCell sx={{ fontSize: 11, fontWeight: 800, color: cTextMuted, py: 2.5, borderBottom: `1px solid ${cCardBorder}` }}>CLIENT</TableCell>
                        <TableCell sx={{ fontSize: 11, fontWeight: 800, color: cTextMuted, py: 2.5, borderBottom: `1px solid ${cCardBorder}` }}>DATE & TIME</TableCell>
                        <TableCell sx={{ fontSize: 11, fontWeight: 800, color: cTextMuted, py: 2.5, borderBottom: `1px solid ${cCardBorder}` }}>TYPE</TableCell>
                        <TableCell sx={{ fontSize: 11, fontWeight: 800, color: cTextMuted, py: 2.5, borderBottom: `1px solid ${cCardBorder}` }}>STATUS</TableCell>
                        <TableCell sx={{ fontSize: 11, fontWeight: 800, color: cTextMuted, py: 2.5, borderBottom: `1px solid ${cCardBorder}` }}>REASON</TableCell>
                        <TableCell sx={{ fontSize: 11, fontWeight: 800, color: cTextMuted, py: 2.5, borderBottom: `1px solid ${cCardBorder}` }} align="right">ACTIONS</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredAppointments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(a => {
                        let statusColor = a.status === "confirmed" || a.status === "completed" || a.status === "accepted" ? cSuccess : a.status === "pending" ? cWarning : cDanger;
                        
                        return (
                          <TableRow key={a.id} hover sx={{ '& td': { borderBottom: `1px solid ${cCardBorder}`, py: 2 } }}>
                            <TableCell>
                              <Stack direction="row" spacing={2} alignItems="center">
                                <Avatar sx={{ width: 42, height: 42, background: `${cPrimary}15`, color: cPrimary, fontWeight: 800, fontSize: 14 }}>
                                  {initials(a.user_name)}
                                </Avatar>
                                <Box>
                                  <Typography sx={{ fontSize: 14, fontWeight: 800, color: cTextDark }}>{a.user_name}</Typography>
                                  <Typography sx={{ fontSize: 12, color: cTextMuted }}>ID: CLI-{a.user_id?.substring(0, 4).toUpperCase()}</Typography>
                                </Box>
                              </Stack>
                            </TableCell>
                            <TableCell>
                              <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                                <CalendarToday sx={{ fontSize: 14, color: cPrimary }} />
                                <Typography sx={{ fontSize: 13, color: cTextDark, fontWeight: 700 }}>{fmtDate(a.scheduled_at)}</Typography>
                              </Stack>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <AccessTime sx={{ fontSize: 14, color: cTextMuted }} />
                                <Typography sx={{ fontSize: 12, color: cTextMuted }}>{fmtTime(a.scheduled_at)}</Typography>
                              </Stack>
                            </TableCell>
                            <TableCell>
                              <Chip icon={<VideocamOutlined style={{ color: "#E05286" }}/>} label="Video Consultation" size="small" sx={{ backgroundColor: "#FDEFF4", color: "#E05286", fontWeight: 700, fontSize: 11, borderRadius: "6px" }} />
                            </TableCell>
                            <TableCell>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: statusColor }} />
                                <Typography sx={{ fontSize: 13, color: statusColor, fontWeight: 700, textTransform: "capitalize" }}>{a.status === "accepted" ? "confirmed" : a.status}</Typography>
                              </Stack>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontSize: 13, color: cTextDark, fontWeight: 600, maxWidth: 200, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {a.reason || "Routine checkup"}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Stack direction="row" spacing={1} justifyContent="flex-end">
                                {a.status === "pending" && (
                                  <>
                                    <IconButton size="small" onClick={() => handleStatusUpdate(a.id, "confirmed")} sx={{ color: cSuccess, backgroundColor: `${cSuccess}10`, '&:hover':{backgroundColor:`${cSuccess}20`} }}>
                                      <CheckCircle sx={{ fontSize: 16 }} />
                                    </IconButton>
                                    <IconButton size="small" onClick={() => handleStatusUpdate(a.id, "cancelled")} sx={{ color: cDanger, backgroundColor: `${cDanger}10`, '&:hover':{backgroundColor:`${cDanger}20`} }}>
                                      <CancelOutlined sx={{ fontSize: 16 }} />
                                    </IconButton>
                                  </>
                                )}
                                <IconButton size="small" sx={{ color: cPrimary, backgroundColor: `${cPrimary}10`, '&:hover':{backgroundColor:`${cPrimary}20`} }}>
                                  <Edit sx={{ fontSize: 16 }} />
                                </IconButton>
                                <IconButton size="small" sx={{ color: cTextMuted }}>
                                  <MoreVert sx={{ fontSize: 18 }} />
                                </IconButton>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 3, py: 2 }}>
                  <Typography sx={{ fontSize: 13, color: cTextMuted, fontWeight: 600 }}>
                    Showing {page * rowsPerPage + 1} to {Math.min((page + 1) * rowsPerPage, filteredAppointments.length)} of {filteredAppointments.length} results
                  </Typography>
                  <TablePagination 
                    component="div" 
                    count={filteredAppointments.length} 
                    page={page} 
                    onPageChange={(e, p) => setPage(p)} 
                    rowsPerPage={rowsPerPage} 
                    onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} 
                    rowsPerPageOptions={[5, 10, 25]} 
                    labelRowsPerPage=""
                    sx={{ borderBottom: "none", '.MuiTablePagination-selectLabel': {display: 'none'}, '.MuiTablePagination-displayedRows': {display: 'none'} }}
                  />
                </Stack>
              </>
            )}
          </Paper>
        </Grid>

        {/* RIGHT COLUMN - SIDEBAR */}
        <Grid item xs={12} lg={3}>
          {/* Today's Schedule */}
          <Paper sx={{ p: 3, borderRadius: "20px", border: "1px solid " + cCardBorder, backgroundColor: "#fff", mb: 3, boxShadow: "0 4px 18px rgba(139,111,201,0.03)" }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2.5}>
              <EventNoteOutlined sx={{ fontSize: 18, color: cPrimary }} />
              <Typography sx={{ fontSize: 15, fontWeight: 800, color: cTextDark }}>Today's Schedule</Typography>
            </Stack>
            
            <Stack spacing={2.5}>
              {todayAppts.length === 0 ? (
                <Stack alignItems="center" justifyContent="center" sx={{ py: 3 }}>
                  <Box sx={{ width: 64, height: 64, borderRadius: "16px", backgroundColor: "#F9F5FF", display: "flex", alignItems: "center", justifyContent: "center", mb: 2 }}>
                    <EventNoteOutlined sx={{ fontSize: 32, color: cPrimary }} />
                  </Box>
                  <Typography sx={{ fontSize: 14, fontWeight: 800, color: cTextDark }}>No appointments for today</Typography>
                  <Typography sx={{ fontSize: 12, color: cTextMuted, mt: 0.5 }}>Enjoy your free time!</Typography>
                </Stack>
              ) : todayAppts.map(a => (
                <Stack key={a.id} direction="row" alignItems="center" justifyContent="space-between">
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: 12, fontWeight: 800, backgroundColor: `${cPrimary}15`, color: cPrimary }}>
                      {initials(a.user_name)}
                    </Avatar>
                    <Box>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: cTextDark }}>{a.user_name}</Typography>
                      <Typography sx={{ fontSize: 11, color: cTextMuted }}>{a.reason || "Routine review"}</Typography>
                    </Box>
                  </Stack>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: cTextDark }}>{fmtTime(a.scheduled_at)}</Typography>
                </Stack>
              ))}
            </Stack>
          </Paper>

          {/* Upcoming Appointments */}
          <Paper sx={{ p: 3, borderRadius: "20px", border: "1px solid " + cCardBorder, backgroundColor: "#fff", mb: 3, boxShadow: "0 4px 18px rgba(139,111,201,0.03)" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <EventNoteOutlined sx={{ fontSize: 18, color: cTextDark }} />
                <Typography sx={{ fontSize: 15, fontWeight: 800, color: cTextDark }}>Upcoming Appointments</Typography>
              </Stack>
              <Chip label={upcomingAppts.length} size="small" sx={{ backgroundColor: "#F6F4F8", color: cTextDark, fontWeight: 800, fontSize: 11, borderRadius: "8px" }} />
            </Stack>
            
            <Stack spacing={2.5}>
              {upcomingAppts.length === 0 ? (
                <Typography sx={{ fontSize: 13, color: cTextMuted }}>No upcoming appointments.</Typography>
              ) : upcomingAppts.slice(0,3).map(a => (
                <Stack key={a.id} direction="row" alignItems="center" justifyContent="space-between">
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: 12, fontWeight: 800, backgroundColor: `${cSecondary}15`, color: cSecondary }}>
                      {initials(a.user_name)}
                    </Avatar>
                    <Box>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: cTextDark }}>{a.user_name}</Typography>
                      <Typography sx={{ fontSize: 11, color: cTextMuted }}>{fmtDate(a.scheduled_at)}, {fmtTime(a.scheduled_at)}</Typography>
                    </Box>
                  </Stack>
                  <Typography sx={{ fontSize: 10, fontWeight: 800, color: "#E05286", backgroundColor: "#FDEFF4", px: 1, py: 0.5, borderRadius: 1 }}>
                    Video Call
                  </Typography>
                </Stack>
              ))}
            </Stack>
            {upcomingAppts.length > 0 && (
              <Button endIcon={<ArrowForward sx={{fontSize: 14}} />} sx={{ mt: 2, fontSize: 12, fontWeight: 700, textTransform: "none", p: 0, color: cPrimary }}>
                View all upcoming
              </Button>
            )}
          </Paper>

          {/* Calendar Widget */}
          <Paper sx={{ p: 3, borderRadius: "20px", border: "1px solid " + cCardBorder, backgroundColor: "#fff", boxShadow: "0 4px 18px rgba(139,111,201,0.03)" }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2.5}>
              <CalendarToday sx={{ fontSize: 18, color: cTextDark }} />
              <Typography sx={{ fontSize: 15, fontWeight: 800, color: cTextDark }}>Calendar</Typography>
            </Stack>
            
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography sx={{ fontSize: 14, fontWeight: 800, color: cTextDark }}>{currentMonth}</Typography>
              <Stack direction="row" spacing={0.5}>
                <IconButton size="small"><ChevronLeft sx={{ fontSize: 18 }} /></IconButton>
                <IconButton size="small"><ChevronRight sx={{ fontSize: 18 }} /></IconButton>
              </Stack>
            </Stack>
            
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, textAlign: "center" }}>
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                <Typography key={day} sx={{ fontSize: 9, fontWeight: 800, color: cTextMuted }}>{day}</Typography>
              ))}
              {/* Dummy dates for visual matching the mockup */}
              {[28,29,30,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,1].map((date, idx) => {
                const isCurrentMonth = idx > 2 && idx < 34;
                const isTodayStr = date === new Date().getDate() && isCurrentMonth;
                return (
                  <Box key={idx} sx={{ 
                    height: 28, 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    fontSize: 12, 
                    fontWeight: isTodayStr ? 800 : 600, 
                    color: !isCurrentMonth ? "#E2E8F0" : (isTodayStr ? "#fff" : cTextDark),
                    backgroundColor: isTodayStr ? cPrimary : "transparent",
                    borderRadius: "50%",
                    cursor: "pointer",
                    '&:hover': { backgroundColor: !isTodayStr ? "#F6F4F8" : cPrimary }
                  }}>
                    {date}
                  </Box>
                )
              })}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
