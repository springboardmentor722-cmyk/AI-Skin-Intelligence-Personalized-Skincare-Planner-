import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box, Stack, Typography, Avatar, IconButton, Button, CircularProgress,
  Chip, InputBase, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination
} from "@mui/material";
import {
  Search, Add, Edit, MoreVert, FilterList, LocalPharmacyOutlined, FileDownloadOutlined, PrintOutlined, DescriptionOutlined
} from "@mui/icons-material";
import { COLORS } from "../theme/colors";
import { getDermatologistPatients } from "../api/dashboard";
import { useNavigate } from "react-router-dom";

const cPrimary = COLORS.primary || "#8B6FC9";
const cCardBorder = COLORS.cardBorder || "rgba(225, 205, 235, 0.6)";
const cTextDark = COLORS.textDark || "#2D3748";
const cTextMuted = COLORS.textMuted || "#718096";

function initials(name) {
  return (name || "?").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function fmtDate(dateStr) {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function ExpertPrescriptionsPage() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDermatologistPatients();
      setPatients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredPatients = useMemo(() => {
    if (!searchQuery) return patients;
    const q = searchQuery.toLowerCase();
    return patients.filter(p => p.full_name?.toLowerCase().includes(q) || p.skin_type?.toLowerCase().includes(q));
  }, [patients, searchQuery]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress sx={{ color: cPrimary }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2.5, sm: 4 }, maxWidth: 1600, mx: "auto", width: "100%", backgroundColor: "#FAF8FC", minHeight: "100vh" }}>
      
      {/* 1. Header */}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} mb={3.5}>
        <Box>
          <Typography sx={{ fontSize: 26, fontWeight: 800, color: cTextDark, letterSpacing: "-0.5px", mb: 0.5 }}>
            Prescriptions
          </Typography>
          <Typography sx={{ fontSize: 13, color: cTextMuted, fontWeight: 500 }}>
            Manage active medical prescriptions, dosage instructions, and generate official RX PDFs.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          sx={{
            borderRadius: "12px",
            background: "linear-gradient(135deg, #8B6FC9, #E4749B)",
            color: "#fff",
            textTransform: "none",
            fontWeight: 700,
            fontSize: 13,
            px: 2.5,
            py: 1.2,
            boxShadow: "0 4px 14px rgba(139,111,201,0.25)",
            "&:hover": { background: "linear-gradient(135deg, #7B5EC0, #D6638A)" }
          }}
        >
          New Prescription
        </Button>
      </Stack>

      {/* 2. KPI Summary Cards */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2.5, mb: 3.5 }}>
        {[
          { label: "Total Prescriptions Issued", val: patients.length, color: cPrimary, icon: "💊" },
          { label: "Active Medical RX", val: patients.filter(p => p.health_score > 0).length, color: "#38A169", icon: "📄" },
          { label: "Refill Requests Pending", val: 0, color: "#DD6B20", icon: "⌛" }
        ].map((s, i) => (
          <Paper
            key={i}
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: "18px",
              border: "1px solid " + cCardBorder,
              backgroundColor: "#ffffff",
              display: "flex",
              alignItems: "center",
              justify: "space-between",
              boxShadow: "0 4px 16px rgba(139,111,201,0.04)"
            }}
          >
            <Box>
              <Typography sx={{ fontSize: 12, color: cTextMuted, fontWeight: 700, mb: 0.5, textTransform: "uppercase" }}>{s.label}</Typography>
              <Typography sx={{ fontSize: 26, fontWeight: 800, color: cTextDark, lineHeight: 1 }}>{s.val}</Typography>
            </Box>
            <Box sx={{ width: 44, height: 44, borderRadius: "14px", backgroundColor: `${s.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
              {s.icon}
            </Box>
          </Paper>
        ))}
      </Box>

      {/* 3. Toolbar */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: "18px",
          border: "1px solid " + cCardBorder,
          backgroundColor: "#ffffff",
          mb: 3.5,
          boxShadow: "0 4px 16px rgba(139,111,201,0.04)",
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          alignItems: "center",
          justify: "space-between"
        }}
      >
        <Paper
          elevation={0}
          sx={{
            display: "flex",
            alignItems: "center",
            px: 2,
            py: 0.8,
            borderRadius: "12px",
            border: `1px solid ${cCardBorder}`,
            backgroundColor: "#FAF8FC",
            flexGrow: 1,
            maxWidth: 480
          }}
        >
          <Search sx={{ color: cTextMuted, fontSize: 20, mr: 1 }} />
          <InputBase
            placeholder="Search prescriptions by patient name..."
            sx={{ fontSize: 13, flex: 1, color: cTextDark }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </Paper>

        <Button
          variant="outlined"
          startIcon={<FilterList />}
          sx={{
            borderRadius: "10px",
            borderColor: cCardBorder,
            color: cTextDark,
            textTransform: "none",
            fontWeight: 700,
            fontSize: 13,
            px: 2,
            py: 0.9,
            backgroundColor: "#fff",
            "&:hover": { borderColor: cPrimary, backgroundColor: `${cPrimary}08` }
          }}
        >
          Filter Prescriptions
        </Button>
      </Paper>

      {/* 4. Table / Empty State */}
      <Paper elevation={0} sx={{ borderRadius: "20px", border: "1px solid " + cCardBorder, overflow: "hidden", boxShadow: "0 4px 18px rgba(139,111,201,0.04)", backgroundColor: "#fff" }}>
        {filteredPatients.length === 0 ? (
          <Box sx={{ py: 10, px: 3, textAlign: "center", maxWidth: 500, mx: "auto" }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                backgroundColor: "rgba(139,111,201,0.08)",
                color: cPrimary,
                display: "flex",
                alignItems: "center",
                justify: "center",
                mx: "auto",
                mb: 2.5
              }}
            >
              <LocalPharmacyOutlined sx={{ fontSize: 32 }} />
            </Box>
            <Typography sx={{ fontSize: 18, fontWeight: 800, color: cTextDark, mb: 1 }}>
              {searchQuery ? "No matching prescriptions" : "No Prescriptions Issued"}
            </Typography>
            <Typography sx={{ fontSize: 13, color: cTextMuted, lineHeight: 1.6, mb: 3 }}>
              {searchQuery
                ? `We couldn't find any prescriptions matching "${searchQuery}".`
                : "You currently have no prescriptions issued. Prescriptions created for patients will appear here."}
            </Typography>
            {searchQuery && (
              <Button
                variant="outlined"
                onClick={() => setSearchQuery("")}
                sx={{ borderRadius: "10px", borderColor: cCardBorder, color: cPrimary, textTransform: "none", fontWeight: 700, fontSize: 13, px: 2.5 }}
              >
                Clear Search
              </Button>
            )}
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table sx={{ minWidth: 900 }}>
                <TableHead sx={{ backgroundColor: "#FDFCFE" }}>
                  <TableRow>
                    <TableCell sx={{ fontSize: 11, fontWeight: 800, color: cTextMuted, borderBottom: `1px solid ${cCardBorder}`, py: 2 }}>PATIENT DETAILS</TableCell>
                    <TableCell sx={{ fontSize: 11, fontWeight: 800, color: cTextMuted, borderBottom: `1px solid ${cCardBorder}`, py: 2 }}>PRIMARY DIAGNOSIS</TableCell>
                    <TableCell sx={{ fontSize: 11, fontWeight: 800, color: cTextMuted, borderBottom: `1px solid ${cCardBorder}`, py: 2 }}>STATUS</TableCell>
                    <TableCell sx={{ fontSize: 11, fontWeight: 800, color: cTextMuted, borderBottom: `1px solid ${cCardBorder}`, py: 2 }}>DATE PRESCRIBED</TableCell>
                    <TableCell sx={{ fontSize: 11, fontWeight: 800, color: cTextMuted, borderBottom: `1px solid ${cCardBorder}`, py: 2 }} align="right">ACTIONS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPatients.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(p => (
                    <TableRow key={p.id} hover sx={{ '& td': { borderBottom: `1px solid ${cCardBorder}`, py: 2 } }}>
                      <TableCell>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar sx={{ width: 40, height: 40, background: `${cPrimary}15`, color: cPrimary, fontWeight: 800, fontSize: 14 }}>
                            {initials(p.full_name)}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontSize: 14, fontWeight: 700, color: cTextDark }}>{p.full_name}</Typography>
                            <Typography sx={{ fontSize: 12, color: cTextMuted, mt: 0.25 }}>{p.age || 0} yrs • {p.gender || "Unknown"}</Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: cTextDark, textTransform: "capitalize", mb: 0.5 }}>{Array.isArray(p.concerns) && p.concerns.length > 0 ? p.concerns[0] : "General Consultation"}</Typography>
                        <Typography sx={{ fontSize: 12, color: cTextMuted }}>{p.skin_type || "Unknown Skin Type"}</Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                           {p.health_score > 0 ? (
                             <Chip icon={<DescriptionOutlined sx={{ fontSize: 14 }} />} label="Active Rx" size="small" sx={{ backgroundColor: `${cPrimary}15`, color: cPrimary, fontWeight: 700, fontSize: 11, '.MuiChip-icon': { color: cPrimary } }} />
                           ) : (
                             <Chip label="No Rx" size="small" sx={{ backgroundColor: `${cCardBorder}`, color: cTextMuted, fontWeight: 700, fontSize: 11 }} />
                           )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: cTextDark }}>{fmtDate(p.last_assessment_date)}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button size="small" variant="outlined" startIcon={<Edit />} sx={{ textTransform: "none", borderRadius: "8px", fontWeight: 700, borderColor: cCardBorder, color: cTextDark }}>
                            Edit Rx
                          </Button>
                          <IconButton size="small" sx={{ color: "#4EA8DE", backgroundColor: "#4EA8DE10", '&:hover': { backgroundColor: "#4EA8DE20" } }} title="Download PDF">
                            <FileDownloadOutlined sx={{ fontSize: 18 }} />
                          </IconButton>
                          <IconButton size="small" sx={{ color: cTextMuted, '&:hover': { color: cTextDark } }}>
                            <PrintOutlined sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[]}
              component="div"
              count={filteredPatients.length}
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
