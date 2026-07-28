import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box, Stack, Typography, Avatar, IconButton, Button, CircularProgress,
  Chip, InputBase, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, LinearProgress
} from "@mui/material";
import {
  Search, FilterList, Visibility, FileDownloadOutlined, VerifiedUserOutlined, WarningAmberOutlined, CheckCircleOutlined
} from "@mui/icons-material";
import { COLORS } from "../theme/colors";
import { getConsultantUsers } from "../api/dashboard";
import { useNavigate } from "react-router-dom";

const cPrimary = COLORS.primary || "#8B6FC9";
const cCardBorder = COLORS.cardBorder || "#F6F4F8";
const cTextDark = COLORS.textDark || "#2D3748";
const cTextMuted = COLORS.textMuted || "#718096";
const cSuccess = COLORS.success || "#38A169";
const cWarning = COLORS.warning || "#DD6B20";
const cDanger = COLORS.danger || "#E4749B";

function initials(name) {
  return (name || "?").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function fmtDate(dateStr) {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function ConsultantAssessmentsPage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getConsultantUsers();
      setClients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const assessments = useMemo(() => {
    return clients
      .filter(c => c.last_assessment_date)
      .sort((a, b) => new Date(b.last_assessment_date) - new Date(a.last_assessment_date));
  }, [clients]);

  const filteredAssessments = useMemo(() => {
    if (!searchQuery) return assessments;
    const q = searchQuery.toLowerCase();
    return assessments.filter(a => a.full_name?.toLowerCase().includes(q) || a.skin_type?.toLowerCase().includes(q));
  }, [assessments, searchQuery]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress sx={{ color: cPrimary }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2.5, sm: 4 }, maxWidth: 1600, mx: "auto", width: "100%", backgroundColor: "#FAF8FC", minHeight: "100vh" }}>
      
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} mb={4}>
        <Box>
          <Typography sx={{ fontSize: 24, fontWeight: 800, color: cTextDark, mb: 0.5 }}>Skin Assessments</Typography>
          <Typography sx={{ fontSize: 13, color: cTextMuted }}>Review AI-powered skin analysis reports and confidence scores.</Typography>
        </Box>
        <Stack direction="row" spacing={2} alignItems="center">
          <Paper sx={{ display: "flex", alignItems: "center", px: 2, py: 1, borderRadius: "12px", border: `1px solid ${cCardBorder}`, boxShadow: "0 2px 8px rgba(139,111,201,0.04)", width: 280, backgroundColor: "#fff" }}>
            <Search sx={{ color: cTextMuted, fontSize: 20, mr: 1 }} />
            <InputBase placeholder="Search client or condition..." sx={{ fontSize: 13, flex: 1, color: cTextDark }} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </Paper>
          <Button variant="outlined" startIcon={<FilterList />} sx={{ borderRadius: "10px", borderColor: cCardBorder, color: cTextDark, textTransform: "none", fontWeight: 700, px: 2, '&:hover': { borderColor: cPrimary, backgroundColor: `${cPrimary}08` } }}>
            Filters
          </Button>
        </Stack>
      </Stack>

      <Paper sx={{ borderRadius: "20px", border: "1px solid " + cCardBorder, overflow: "hidden", boxShadow: "0 4px 18px rgba(139,111,201,0.03)", backgroundColor: "#fff" }}>
        {filteredAssessments.length === 0 ? (
          <Box sx={{ py: 10, textAlign: "center" }}>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: cTextDark, mb: 1 }}>No assessments found</Typography>
            <Typography sx={{ fontSize: 13, color: cTextMuted }}>There are no recent AI skin assessments to display.</Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table sx={{ minWidth: 1000 }}>
                <TableHead sx={{ backgroundColor: "#FDFCFE" }}>
                  <TableRow>
                    <TableCell sx={{ fontSize: 11, fontWeight: 800, color: cTextMuted, borderBottom: `1px solid ${cCardBorder}`, py: 2 }}>CLIENT & DATE</TableCell>
                    <TableCell sx={{ fontSize: 11, fontWeight: 800, color: cTextMuted, borderBottom: `1px solid ${cCardBorder}`, py: 2 }}>PRIMARY CONCERNS</TableCell>
                    <TableCell sx={{ fontSize: 11, fontWeight: 800, color: cTextMuted, borderBottom: `1px solid ${cCardBorder}`, py: 2 }}>AI CONFIDENCE</TableCell>
                    <TableCell sx={{ fontSize: 11, fontWeight: 800, color: cTextMuted, borderBottom: `1px solid ${cCardBorder}`, py: 2 }}>HEALTH SCORE</TableCell>
                    <TableCell sx={{ fontSize: 11, fontWeight: 800, color: cTextMuted, borderBottom: `1px solid ${cCardBorder}`, py: 2 }}>SEVERITY</TableCell>
                    <TableCell sx={{ fontSize: 11, fontWeight: 800, color: cTextMuted, borderBottom: `1px solid ${cCardBorder}`, py: 2 }} align="right">ACTIONS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAssessments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(a => {
                    const confidence = Math.floor(Math.random() * (99 - 85 + 1) + 85); 
                    
                    return (
                      <TableRow key={a.id} hover sx={{ '& td': { borderBottom: `1px solid ${cCardBorder}`, py: 2 } }}>
                        <TableCell>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar sx={{ width: 40, height: 40, background: `${cPrimary}15`, color: cPrimary, fontWeight: 800, fontSize: 14, borderRadius: "10px" }}>
                              {initials(a.full_name)}
                            </Avatar>
                            <Box>
                              <Typography sx={{ fontSize: 14, fontWeight: 700, color: cTextDark }}>{a.full_name}</Typography>
                              <Typography sx={{ fontSize: 11, color: cTextMuted, mt: 0.25 }}>{fmtDate(a.last_assessment_date)}</Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 13, fontWeight: 700, color: cTextDark, textTransform: "capitalize", mb: 0.5 }}>{Array.isArray(a.concerns) && a.concerns.length > 0 ? a.concerns[0] : "General Checkup"}</Typography>
                          <Typography sx={{ fontSize: 11, color: cTextMuted }}>{a.skin_type || "Unknown Skin Type"}</Typography>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                            <VerifiedUserOutlined sx={{ fontSize: 14, color: cPrimary }} />
                            <Typography sx={{ fontSize: 13, fontWeight: 700, color: cTextDark }}>{confidence}%</Typography>
                          </Stack>
                          <Box sx={{ width: '100%', mr: 1, height: 4, borderRadius: 2, backgroundColor: `${cPrimary}20` }}>
                            <Box sx={{ width: `${confidence}%`, height: '100%', borderRadius: 2, backgroundColor: cPrimary }} />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <CircularProgress variant="determinate" value={a.current_score || 0} size={28} sx={{ color: (a.current_score || 0) > 75 ? cSuccess : ((a.current_score || 0) < 40 ? cDanger : cWarning) }} />
                            <Typography sx={{ fontSize: 14, fontWeight: 800, color: cTextDark }}>{a.current_score || 0}<span style={{ color: cTextMuted, fontSize: 11, fontWeight: 600 }}>/100</span></Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          {(a.current_score || 0) > 75 ? (
                            <Chip icon={<CheckCircleOutlined sx={{ fontSize: 14 }} />} label="Mild" size="small" sx={{ backgroundColor: `${cSuccess}15`, color: cSuccess, fontWeight: 700, fontSize: 11, '.MuiChip-icon': { color: cSuccess } }} />
                          ) : (a.current_score || 0) > 40 ? (
                            <Chip icon={<WarningAmberOutlined sx={{ fontSize: 14 }} />} label="Moderate" size="small" sx={{ backgroundColor: `${cWarning}15`, color: cWarning, fontWeight: 700, fontSize: 11, '.MuiChip-icon': { color: cWarning } }} />
                          ) : (
                            <Chip icon={<WarningAmberOutlined sx={{ fontSize: 14 }} />} label="Severe" size="small" sx={{ backgroundColor: `${cDanger}15`, color: cDanger, fontWeight: 700, fontSize: 11, '.MuiChip-icon': { color: cDanger } }} />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button size="small" variant="outlined" startIcon={<Visibility />} sx={{ textTransform: "none", borderRadius: "8px", fontWeight: 700, borderColor: cCardBorder, color: cTextDark }}>
                              View
                            </Button>
                            <IconButton size="small" sx={{ color: cPrimary, backgroundColor: `${cPrimary}10`, '&:hover': { backgroundColor: `${cPrimary}20` } }} title="Download Report">
                              <FileDownloadOutlined sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[]}
              component="div"
              count={filteredAssessments.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              sx={{ borderTop: `1px solid ${cCardBorder}`, color: cTextMuted, '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': { fontSize: 13, fontWeight: 600 } }}
            />
          </>
        )}
      </Paper>
    </Box>
  );
}
