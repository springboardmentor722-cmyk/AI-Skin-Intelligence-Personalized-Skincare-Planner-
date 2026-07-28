import React, { useState, useEffect, useMemo } from "react";
import {
  Box, Typography, Stack, Button, InputBase, Chip, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton, Select, MenuItem,
  CircularProgress, Alert, Pagination, Paper, useMediaQuery, useTheme, Grid
} from "@mui/material";
import {
  Search, Add, FilterList, MoreVert, Circle, Edit, Delete, Visibility,
  Api, FilterDrama, Storage, CheckCircle, WarningAmber, CloudDone,
  AccessTime, ShowChart, Language, PlayArrow, Refresh, Sensors, Email,
  Payment, SmartToy, DataObject, Autorenew, Key, CloudDownload, Settings, VerifiedUser
} from "@mui/icons-material";
import { COLORS, FONT_DISPLAY } from "../theme/colors";
import { getApiIntegrations } from "../api/admin";

// Custom SVG Multi-Line Chart
const UsageLineChart = () => {
  const points1 = "0,80 15,60 30,70 50,45 65,65 85,40 100,50";
  const points2 = "0,120 15,115 30,125 50,110 65,120 85,115 100,125";
  const points3 = "0,140 15,138 30,142 50,135 65,140 85,138 100,140";
  
  const dates = ["20 Jul", "21 Jul", "22 Jul", "23 Jul", "24 Jul", "25 Jul", "26 Jul"];

  return (
    <Box sx={{ width: "100%", height: 180, position: "relative", mt: 2 }}>
      <svg width="100%" height="100%" viewBox="0 0 100 160" preserveAspectRatio="none">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(139,111,201,0.2)" />
            <stop offset="100%" stopColor="rgba(139,111,201,0.0)" />
          </linearGradient>
        </defs>
        
        {/* Fill for Requests */}
        <path d={`M 0,160 L 0,80 L 15,60 L 30,70 L 50,45 L 65,65 L 85,40 L 100,50 L 100,160 Z`} fill="url(#chartGradient)" />
        
        {/* Lines */}
        <polyline fill="none" stroke="#8B6FC9" strokeWidth="2" points={points1} strokeLinejoin="round" />
        <polyline fill="none" stroke="#42A5F5" strokeWidth="2" points={points2} strokeLinejoin="round" />
        <polyline fill="none" stroke="#E4749B" strokeWidth="2" points={points3} strokeLinejoin="round" />
        
        {/* Points for Requests */}
        {points1.split(" ").map((p, i) => {
          const [x, y] = p.split(",");
          return <circle key={i} cx={x} cy={y} r="2.5" fill="#FFF" stroke="#8B6FC9" strokeWidth="1.5" />;
        })}
      </svg>
      {/* X Axis Labels */}
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 1, px: 0.5 }}>
        {dates.map((d, i) => (
          <Typography key={i} sx={{ fontSize: 9, color: COLORS.textMuted }}>{d}</Typography>
        ))}
      </Stack>
    </Box>
  );
};

export default function AdminApiPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        setLoading(true);
        const res = await getApiIntegrations();
        setData(res);
      } catch (err) {
        setError("Failed to load integrations.");
      } finally {
        setLoading(false);
      }
    };
    fetchIntegrations();
  }, []);

  const integrations = data?.integrations || [];
  const kpis = data?.kpis || {};

  const filteredIntegrations = useMemo(() => {
    return integrations.filter(p => {
      const matchSearch = search ? (
        (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.endpoint || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.type || "").toLowerCase().includes(search.toLowerCase())
      ) : true;
      return matchSearch;
    });
  }, [integrations, search]);

  const totalPages = Math.ceil(filteredIntegrations.length / rowsPerPage);
  const paginatedIntegrations = filteredIntegrations.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // UI Helpers to mock logos using customized Material Icons
  const getServiceLogo = (id) => {
    switch (id) {
      case "int_openweather": return { icon: <FilterDrama />, color: "#FFA726", bg: "rgba(255,167,38,0.1)" };
      case "int_groq": return { icon: <SmartToy />, color: "#000", bg: "#f0f0f0" };
      case "int_mongo": return { icon: <Storage />, color: "#4CAF7D", bg: "rgba(76,175,125,0.1)" };
      case "int_postgres": return { icon: <Storage />, color: "#336791", bg: "rgba(51,103,145,0.1)" };
      case "int_s3": return { icon: <CloudDone />, color: "#FF9900", bg: "rgba(255,153,0,0.1)" };
      case "int_firebase": return { icon: <Language />, color: "#FFCA28", bg: "rgba(255,202,40,0.1)" };
      case "int_smtp": return { icon: <Email />, color: "#42A5F5", bg: "rgba(66,165,245,0.1)" };
      case "int_stripe": return { icon: <Payment />, color: "#6772E5", bg: "rgba(103,114,229,0.1)" };
      case "int_openai": return { icon: <SmartToy />, color: "#10A37F", bg: "rgba(16,163,127,0.1)" };
      case "int_twilio": return { icon: <Language />, color: "#F22F46", bg: "rgba(242,47,70,0.1)" };
      default: return { icon: <Api />, color: COLORS.primary, bg: "rgba(139,111,201,0.1)" };
    }
  };

  const getStatusStyle = (status) => {
    const s = status?.toLowerCase() || "";
    if (s === "connected") return { color: "#4CAF7D", bg: "rgba(76,175,125,0.1)" };
    if (s === "disconnected") return { color: "#E4749B", bg: "rgba(228,116,155,0.1)" };
    if (s === "slow") return { color: "#FFA726", bg: "rgba(255,167,38,0.1)" };
    return { color: "#78909C", bg: "rgba(120,144,156,0.1)" };
  };

  const getTypeStyle = (type) => {
    switch (type) {
      case "Database": return { color: "#4CAF7D", bg: "rgba(76,175,125,0.1)" };
      case "AI / LLM": return { color: "#E4749B", bg: "rgba(228,116,155,0.1)" };
      case "Storage": return { color: "#FF9900", bg: "rgba(255,153,0,0.1)" };
      case "Authentication": return { color: "#42A5F5", bg: "rgba(66,165,245,0.1)" };
      case "Payments": return { color: "#8B6FC9", bg: "rgba(139,111,201,0.1)" };
      default: return { color: COLORS.primary, bg: "rgba(139,111,201,0.1)" };
    }
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto", width: "100%", pb: 4 }}>
      {/* Breadcrumbs */}
      <Typography sx={{ fontSize: 12, color: COLORS.textMuted, mb: 1, fontWeight: 500 }}>
        Dashboard <span style={{ margin: "0 4px" }}>›</span> <span style={{ color: COLORS.textDark, fontWeight: 700 }}>API Integrations</span>
      </Typography>

      {/* Header */}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} sx={{ mb: 4 }}>
        <Box>
          <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 800, color: COLORS.textDark, mb: 0.5 }}>
            API Integrations
          </Typography>
          <Typography sx={{ fontSize: 13, color: COLORS.textMuted }}>
            Manage external services, AI models, databases, and system connections.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap", rowGap: 1 }}>
          <Button variant="contained" startIcon={<Add />} sx={{ backgroundColor: COLORS.primary, borderRadius: "10px", textTransform: "none", fontWeight: 700, boxShadow: "0 4px 14px rgba(139,111,201,0.3)", "&:hover": { backgroundColor: COLORS.primaryDark } }}>
            Add Integration
          </Button>
          <Button variant="outlined" startIcon={<Refresh />} sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, color: COLORS.textDark, borderColor: COLORS.cardBorder, backgroundColor: "#FFF" }}>
            Refresh Status
          </Button>
          <Button variant="outlined" startIcon={<Sensors />} sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, color: COLORS.textDark, borderColor: COLORS.cardBorder, backgroundColor: "#FFF" }}>
            Test All Connections
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={3}>
        {/* Main Content Area */}
        <Grid item xs={12} lg={9}>
          {/* KPI Cards */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            {[
              { label: "Total Integrations", val: kpis.total, desc: "All configured services", iconColor: "#8B6FC9", bg: "rgba(139,111,201,0.1)", icon: <Api /> },
              { label: "Active APIs", val: kpis.active, desc: "Connected successfully", iconColor: "#4CAF7D", bg: "rgba(76,175,125,0.1)", icon: <CheckCircle /> },
              { label: "Failed Connections", val: kpis.failed, desc: "Require attention", iconColor: "#E4749B", bg: "rgba(228,116,155,0.1)", icon: <WarningAmber /> },
              { label: "Avg. Response Time", val: kpis.avg_response_time, desc: "Across all services", iconColor: "#42A5F5", bg: "rgba(66,165,245,0.1)", icon: <AccessTime /> },
              { label: "API Requests Today", val: kpis.requests_today, desc: "Total requests", iconColor: "#8B6FC9", bg: "rgba(139,111,201,0.1)", icon: <ShowChart /> },
              { label: "Uptime", val: kpis.uptime, desc: "System availability", iconColor: "#FFA726", bg: "rgba(255,167,38,0.1)", icon: <VerifiedUser /> }
            ].map((kpi, idx) => (
              <Grid item xs={12} sm={6} md={4} xl={2} key={idx}>
                <Box sx={{ backgroundColor: "#FFF", borderRadius: "16px", p: 2, border: "1px solid " + COLORS.cardBorder, boxShadow: "0 4px 18px rgba(139,111,201,0.02)", height: "100%" }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ width: 40, height: 40, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: kpi.bg, color: kpi.iconColor, flexShrink: 0 }}>
                      {kpi.icon}
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 20, fontWeight: 800, color: COLORS.textDark, lineHeight: 1 }}>{loading ? "-" : kpi.val}</Typography>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textDark, mt: 0.5 }}>{kpi.label}</Typography>
                      <Typography sx={{ fontSize: 9, color: COLORS.textFaint }}>{kpi.desc}</Typography>
                    </Box>
                  </Stack>
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Filters Row */}
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center" sx={{ mb: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ backgroundColor: "#FFF", border: "1px solid " + COLORS.cardBorder, borderRadius: "12px", px: 2, py: 1.25, flex: 1, minWidth: { xs: "100%", md: 250 } }}>
              <Search sx={{ fontSize: 18, color: COLORS.textFaint }} />
              <InputBase placeholder="Search API by name or endpoint..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ fontSize: 13, flex: 1 }} />
            </Stack>
            <Stack direction="row" spacing={2} sx={{ width: { xs: "100%", md: "auto" } }}>
              <Select defaultValue="all" size="small" sx={{ backgroundColor: "#FFF", borderRadius: "10px", fontSize: 13, fontWeight: 600, color: COLORS.textMuted, minWidth: 120, "& fieldset": { borderColor: COLORS.cardBorder } }}>
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="connected">Connected</MenuItem>
                <MenuItem value="disconnected">Disconnected</MenuItem>
              </Select>
              <Select defaultValue="all" size="small" sx={{ backgroundColor: "#FFF", borderRadius: "10px", fontSize: 13, fontWeight: 600, color: COLORS.textMuted, minWidth: 120, "& fieldset": { borderColor: COLORS.cardBorder } }}>
                <MenuItem value="all">All Providers</MenuItem>
              </Select>
              <Select defaultValue="prod" size="small" sx={{ backgroundColor: "#FFF", borderRadius: "10px", fontSize: 13, fontWeight: 600, color: COLORS.textMuted, minWidth: 120, "& fieldset": { borderColor: COLORS.cardBorder } }}>
                <MenuItem value="prod">Production</MenuItem>
                <MenuItem value="dev">Development</MenuItem>
              </Select>
              <Button variant="outlined" startIcon={<FilterList />} sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, color: COLORS.textMuted, borderColor: COLORS.cardBorder, px: 2, whiteSpace: "nowrap", backgroundColor: "#FFF" }}>
                Advanced Filters
              </Button>
            </Stack>
          </Stack>

          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: "12px" }}>{error}</Alert>}

          {/* Main Content Area */}
          {loading ? (
            <Stack alignItems="center" sx={{ py: 10 }}><CircularProgress sx={{ color: COLORS.primary }} /></Stack>
          ) : (
            <>
              {!isMobile ? (
                /* Desktop Table */
                <TableContainer component={Paper} elevation={0} sx={{ borderRadius: "16px", border: "1px solid " + COLORS.cardBorder, mb: 3 }}>
                  <Table size="small">
                    <TableHead sx={{ backgroundColor: "#FAF8FC" }}>
                      <TableRow>
                        <TableCell sx={{ fontSize: 10, fontWeight: 800, color: COLORS.textFaint, py: 2 }}>SERVICE</TableCell>
                        <TableCell sx={{ fontSize: 10, fontWeight: 800, color: COLORS.textFaint, py: 2 }}>TYPE</TableCell>
                        <TableCell sx={{ fontSize: 10, fontWeight: 800, color: COLORS.textFaint, py: 2 }}>STATUS</TableCell>
                        <TableCell sx={{ fontSize: 10, fontWeight: 800, color: COLORS.textFaint, py: 2 }}>ENDPOINT</TableCell>
                        <TableCell sx={{ fontSize: 10, fontWeight: 800, color: COLORS.textFaint, py: 2 }}>RESPONSE TIME</TableCell>
                        <TableCell sx={{ fontSize: 10, fontWeight: 800, color: COLORS.textFaint, py: 2 }}>LAST SYNC</TableCell>
                        <TableCell sx={{ fontSize: 10, fontWeight: 800, color: COLORS.textFaint, py: 2, textAlign: "center" }}>ACTIONS</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedIntegrations.length === 0 ? (
                        <TableRow><TableCell colSpan={7} sx={{ textAlign: "center", py: 5, color: COLORS.textMuted }}>No integrations found.</TableCell></TableRow>
                      ) : paginatedIntegrations.map((p) => {
                        const logo = getServiceLogo(p.id);
                        const sStyle = getStatusStyle(p.status);
                        const tStyle = getTypeStyle(p.type);

                        return (
                          <TableRow key={p.id} hover sx={{ "& td": { borderBottom: "1px solid " + COLORS.cardBorder } }}>
                            <TableCell sx={{ py: 1.5 }}>
                              <Stack direction="row" spacing={1.5} alignItems="center">
                                <Box sx={{ width: 32, height: 32, borderRadius: "8px", backgroundColor: logo.bg, display: "flex", alignItems: "center", justifyContent: "center", "& > svg": { fontSize: 18, color: logo.color } }}>
                                  {logo.icon}
                                </Box>
                                <Box>
                                  <Typography sx={{ fontSize: 13, fontWeight: 800, color: COLORS.textDark, mb: 0.2 }}>{p.name}</Typography>
                                  <Typography sx={{ fontSize: 10, color: COLORS.textFaint }}>{p.description}</Typography>
                                </Box>
                              </Stack>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontSize: 10, fontWeight: 700, color: tStyle.color, backgroundColor: tStyle.bg, px: 1, py: 0.5, borderRadius: "6px", display: "inline-block" }}>
                                {p.type}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Circle sx={{ fontSize: 6, color: sStyle.color }} />
                                <Typography sx={{ fontSize: 11, fontWeight: 700, color: sStyle.color }}>{p.status}</Typography>
                              </Stack>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted }}>{p.endpoint}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontSize: 11, fontWeight: 600, color: COLORS.textDark }}>{p.response_time}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontSize: 11, color: COLORS.textMuted }}>{p.last_sync}</Typography>
                            </TableCell>
                            <TableCell sx={{ textAlign: "center" }}>
                              <Stack direction="row" spacing={0.5} justifyContent="center">
                                <IconButton size="small" sx={{ color: COLORS.textMuted }}><PlayArrow sx={{ fontSize: 16 }} /></IconButton>
                                <IconButton size="small" sx={{ color: COLORS.textMuted }}><Edit sx={{ fontSize: 16 }} /></IconButton>
                                <IconButton size="small" sx={{ color: COLORS.textMuted }}><Visibility sx={{ fontSize: 16 }} /></IconButton>
                                <IconButton size="small"><MoreVert sx={{ fontSize: 16, color: COLORS.textFaint }} /></IconButton>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                /* Mobile Cards */
                <Stack spacing={2} sx={{ mb: 3 }}>
                  {paginatedIntegrations.map((p) => {
                    const logo = getServiceLogo(p.id);
                    const sStyle = getStatusStyle(p.status);
                    const tStyle = getTypeStyle(p.type);

                    return (
                      <Box key={p.id} sx={{ backgroundColor: "#FFF", borderRadius: "16px", p: 2, border: "1px solid " + COLORS.cardBorder }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                           <Stack direction="row" spacing={1.5}>
                             <Box sx={{ width: 32, height: 32, borderRadius: "8px", backgroundColor: logo.bg, display: "flex", alignItems: "center", justifyContent: "center", "& > svg": { fontSize: 18, color: logo.color } }}>
                               {logo.icon}
                             </Box>
                             <Box sx={{ pr: 2 }}>
                               <Typography sx={{ fontSize: 14, fontWeight: 800, color: COLORS.textDark }}>{p.name}</Typography>
                               <Typography sx={{ fontSize: 11, color: COLORS.textFaint }}>{p.endpoint}</Typography>
                             </Box>
                           </Stack>
                           <IconButton size="small" sx={{ p: 0.5, mt: -0.5, mr: -0.5 }}><MoreVert sx={{ fontSize: 18, color: COLORS.textFaint }} /></IconButton>
                        </Stack>
                        
                        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2, mt: 1 }}>
                          <Typography sx={{ color: tStyle.color, backgroundColor: tStyle.bg, px: 1, py: 0.5, borderRadius: "6px", fontWeight: 700, fontSize: 10 }}>{p.type}</Typography>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Circle sx={{ fontSize: 6, color: sStyle.color }} />
                            <Typography sx={{ fontSize: 11, fontWeight: 700, color: sStyle.color }}>{p.status}</Typography>
                          </Stack>
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              )}

              {/* Pagination */}
              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center" spacing={2}>
                <Typography sx={{ fontSize: 12, color: COLORS.textMuted, fontWeight: 500 }}>
                  Showing {(page - 1) * rowsPerPage + 1} to {Math.min(page * rowsPerPage, filteredIntegrations.length)} of {integrations.length} integrations
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Pagination 
                    count={totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" shape="rounded" size={isMobile ? "small" : "medium"}
                    sx={{ "& .MuiPaginationItem-root": { fontWeight: 600, color: COLORS.textMuted }, "& .Mui-selected": { backgroundColor: "rgba(139,111,201,0.1) !important", color: COLORS.primary } }}
                  />
                  <Select
                    value={rowsPerPage} onChange={(e) => { setRowsPerPage(e.target.value); setPage(1); }} size="small"
                    sx={{ backgroundColor: "#FFF", borderRadius: "8px", fontSize: 12, fontWeight: 600, color: COLORS.textDark, "& fieldset": { borderColor: COLORS.cardBorder } }}
                  >
                    <MenuItem value={10}>10 per page</MenuItem>
                    <MenuItem value={25}>25 per page</MenuItem>
                  </Select>
                </Stack>
              </Stack>
            </>
          )}
        </Grid>

        {/* Right Sidebar */}
        <Grid item xs={12} lg={3}>
          <Stack spacing={3}>
            {/* API Health Monitor */}
            <Box sx={{ backgroundColor: "#FFF", borderRadius: "16px", p: 3, border: "1px solid " + COLORS.cardBorder }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 800, color: COLORS.textDark }}>API Health Monitor</Typography>
                <Typography sx={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, cursor: "pointer" }}>View All</Typography>
              </Stack>
              
              <Stack spacing={2.5}>
                {integrations.filter(i => ["int_postgres", "int_mongo", "int_groq", "int_openweather", "int_firebase", "int_stripe", "int_smtp"].includes(i.id)).map((api, i) => {
                  const sColor = getStatusStyle(api.status).color;
                  return (
                    <Stack key={i} direction="row" alignItems="center" justifyContent="space-between">
                      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ width: "45%" }}>
                        <Circle sx={{ fontSize: 6, color: sColor }} />
                        <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textDark, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{api.name}</Typography>
                      </Stack>
                      <Typography sx={{ fontSize: 10, fontWeight: 700, color: sColor, width: "30%" }}>{api.status === "Connected" ? "Healthy" : api.status}</Typography>
                      <Typography sx={{ fontSize: 10, fontWeight: 600, color: COLORS.textMuted, width: "25%", textAlign: "right" }}>{api.response_time}</Typography>
                    </Stack>
                  );
                })}
              </Stack>
            </Box>

            {/* API Usage Chart */}
            <Box sx={{ backgroundColor: "#FFF", borderRadius: "16px", p: 3, border: "1px solid " + COLORS.cardBorder }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 800, color: COLORS.textDark }}>API Usage <span style={{ color: COLORS.textFaint, fontWeight: 500 }}>(This Week)</span></Typography>
                <Typography sx={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, cursor: "pointer" }}>View Analytics</Typography>
              </Stack>
              
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={2} sx={{ mb: 1 }}>
                 <Stack direction="row" alignItems="center" spacing={0.5}>
                   <Circle sx={{ fontSize: 6, color: "#8B6FC9" }} />
                   <Typography sx={{ fontSize: 9, fontWeight: 600, color: COLORS.textDark }}>Requests</Typography>
                 </Stack>
                 <Stack direction="row" alignItems="center" spacing={0.5}>
                   <Circle sx={{ fontSize: 6, color: "#E4749B" }} />
                   <Typography sx={{ fontSize: 9, fontWeight: 600, color: COLORS.textDark }}>Errors</Typography>
                 </Stack>
                 <Stack direction="row" alignItems="center" spacing={0.5}>
                   <Circle sx={{ fontSize: 6, color: "#42A5F5" }} />
                   <Typography sx={{ fontSize: 9, fontWeight: 600, color: COLORS.textDark }}>Latency (ms)</Typography>
                 </Stack>
              </Stack>

              <UsageLineChart />
            </Box>

            {/* Quick Actions */}
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 800, color: COLORS.textDark, mb: 2 }}>Quick Actions</Typography>
              <Grid container spacing={1.5}>
                {[
                  { label: "Import OpenAPI", icon: <DataObject /> },
                  { label: "Generate API Key", icon: <Key /> },
                  { label: "Rotate Keys", removal: true, icon: <Autorenew /> },
                  { label: "Download Logs", icon: <CloudDownload /> },
                  { label: "Export Config", icon: <Settings /> }
                ].map((act, i) => (
                  <Grid item xs={2.4} key={i}>
                    <Stack alignItems="center" spacing={1}>
                      <Box sx={{ width: 36, height: 36, borderRadius: "10px", backgroundColor: "#FFF", border: "1px solid " + COLORS.cardBorder, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.primary, "& > svg": { fontSize: 16 }, cursor: "pointer", "&:hover": { backgroundColor: "rgba(139,111,201,0.05)" } }}>
                        {act.icon}
                      </Box>
                      <Typography sx={{ fontSize: 9, fontWeight: 700, color: COLORS.textMuted, textAlign: "center", lineHeight: 1.1 }}>{act.label}</Typography>
                    </Stack>
                  </Grid>
                ))}
              </Grid>
            </Box>

          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
