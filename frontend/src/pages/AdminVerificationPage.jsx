import React, { useState, useEffect } from "react";
import {
  Box, Typography, Stack, Button, InputBase, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, Select, MenuItem,
  CircularProgress, Alert, Paper, useMediaQuery, useTheme, Grid,
  Drawer, Divider, Avatar, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Chip, Checkbox, FormControlLabel
} from "@mui/material";
import {
  Search, FilterList, CheckCircle, WarningAmber, Cancel,
  AccessTime, AssignmentTurnedIn, EventBusy, Close, Download,
  Visibility, PictureAsPdf, Image as ImageIcon, GppGood
} from "@mui/icons-material";
import { COLORS, FONT_DISPLAY } from "../theme/colors";
import { 
  getVerifications, getVerificationKpis, getVerificationDetails,
  approveProfessional, rejectProfessional
} from "../api/verifications";

export default function AdminVerificationPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));
  
  const [data, setData] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  
  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  
  // Reject Dialog state
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectNotes, setRejectNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  
  // Checklist state
  const [checklist, setChecklist] = useState({
    identity: false, license: false, degree: false, 
    hospital: false, experience: false, govId: false
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [kpiRes, verificationsRes] = await Promise.all([
        getVerificationKpis(),
        getVerifications(roleFilter, statusFilter)
      ]);
      setKpis(kpiRes);
      setData(verificationsRes);
    } catch (err) {
      setError("Failed to load verification data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [roleFilter, statusFilter]);

  const filteredData = data.filter(u => 
    u.full_name.toLowerCase().includes(search.toLowerCase()) || 
    u.hospital.toLowerCase().includes(search.toLowerCase()) ||
    u.medical_license.toLowerCase().includes(search.toLowerCase())
  );

  const handleReviewClick = async (userId) => {
    setDrawerOpen(true);
    setDetailsLoading(true);
    setChecklist({ identity: false, license: false, degree: false, hospital: false, experience: false, govId: false });
    try {
      const details = await getVerificationDetails(userId);
      setSelectedUser(details);
    } catch (err) {
      alert("Error fetching user details");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await approveProfessional(selectedUser.id);
      setDrawerOpen(false);
      fetchData(); // Refresh list
    } catch (err) {
      alert("Failed to approve professional");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!selectedUser || !rejectReason) return;
    setActionLoading(true);
    try {
      await rejectProfessional(selectedUser.id, rejectReason, rejectNotes);
      setRejectOpen(false);
      setDrawerOpen(false);
      fetchData(); // Refresh list
    } catch (err) {
      alert("Failed to reject professional");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "approved": return { color: "#4CAF7D", bg: "rgba(76,175,125,0.1)" };
      case "pending": return { color: "#FFA726", bg: "rgba(255,167,38,0.1)" };
      case "under review": return { color: "#42A5F5", bg: "rgba(66,165,245,0.1)" };
      case "rejected": return { color: "#E4749B", bg: "rgba(228,116,155,0.1)" };
      default: return { color: "#78909C", bg: "rgba(120,144,156,0.1)" };
    }
  };

  const completedChecks = Object.values(checklist).filter(Boolean).length;

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto", width: "100%", pb: 4 }}>
      {/* Header */}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} sx={{ mb: 4 }}>
        <Box>
          <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 900, color: COLORS.textDark, mb: 0.5 }}>
            Professional Verification
          </Typography>
          <Typography sx={{ fontSize: 13, color: COLORS.textMuted }}>
            Review consultant and dermatologist verification requests before granting platform access.
          </Typography>
        </Box>
      </Stack>

      {/* KPI Cards */}
      {kpis && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {[
            { label: "Pending Verification", val: kpis.pending_verification, iconColor: "#FFA726", bg: "rgba(255,167,38,0.1)", icon: <WarningAmber /> },
            { label: "Approved Professionals", val: kpis.approved_professionals, iconColor: "#4CAF7D", bg: "rgba(76,175,125,0.1)", icon: <CheckCircle /> },
            { label: "Rejected Applications", val: kpis.rejected_applications, iconColor: "#E4749B", bg: "rgba(228,116,155,0.1)", icon: <Cancel /> },
            { label: "Today's Requests", val: kpis.todays_requests, iconColor: "#8B6FC9", bg: "rgba(139,111,201,0.1)", icon: <AssignmentTurnedIn /> },
            { label: "Average Review Time", val: kpis.average_review_time, iconColor: "#42A5F5", bg: "rgba(66,165,245,0.1)", icon: <AccessTime /> },
            { label: "Expiring Licenses", val: kpis.expiring_licenses, iconColor: "#E4749B", bg: "rgba(228,116,155,0.1)", icon: <EventBusy /> }
          ].map((kpi, idx) => (
            <Grid item xs={12} sm={6} md={4} xl={2} key={idx}>
              <Box sx={{ backgroundColor: "#FFF", borderRadius: "16px", p: 2, border: "1px solid " + COLORS.cardBorder, boxShadow: "0 4px 18px rgba(139,111,201,0.02)" }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ width: 40, height: 40, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: kpi.bg, color: kpi.iconColor }}>
                    {kpi.icon}
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 20, fontWeight: 800, color: COLORS.textDark, lineHeight: 1 }}>{kpi.val}</Typography>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textDark, mt: 0.5 }}>{kpi.label}</Typography>
                  </Box>
                </Stack>
              </Box>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Filters Row */}
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ backgroundColor: "#FFF", border: "1px solid " + COLORS.cardBorder, borderRadius: "12px", px: 2, py: 1.25, flex: 1, minWidth: { xs: "100%", md: 300 } }}>
          <Search sx={{ fontSize: 18, color: COLORS.textFaint }} />
          <InputBase placeholder="Search Professional, Hospital, or License..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ fontSize: 13, flex: 1 }} />
        </Stack>
        <Stack direction="row" spacing={2} sx={{ width: { xs: "100%", md: "auto" } }}>
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            size="small"
            sx={{ backgroundColor: "#FFF", borderRadius: "10px", fontSize: 13, fontWeight: 600, color: COLORS.textMuted, minWidth: 150, "& fieldset": { borderColor: COLORS.cardBorder } }}
          >
            <MenuItem value="All">All Roles</MenuItem>
            <MenuItem value="Consultant">Consultant</MenuItem>
            <MenuItem value="Dermatologist">Dermatologist</MenuItem>
          </Select>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            size="small"
            sx={{ backgroundColor: "#FFF", borderRadius: "10px", fontSize: 13, fontWeight: 600, color: COLORS.textMuted, minWidth: 150, "& fieldset": { borderColor: COLORS.cardBorder } }}
          >
            <MenuItem value="All">All Status</MenuItem>
            <MenuItem value="Pending">Pending</MenuItem>
            <MenuItem value="Under Review">Under Review</MenuItem>
            <MenuItem value="Approved">Approved</MenuItem>
            <MenuItem value="Rejected">Rejected</MenuItem>
          </Select>
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: "12px" }}>{error}</Alert>}

      {/* Table */}
      {loading ? (
        <Stack alignItems="center" sx={{ py: 10 }}><CircularProgress sx={{ color: COLORS.primary }} /></Stack>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: "16px", border: "1px solid " + COLORS.cardBorder }}>
          <Table>
            <TableHead sx={{ backgroundColor: "#FAF8FC" }}>
              <TableRow>
                <TableCell sx={{ fontSize: 11, fontWeight: 800, color: COLORS.textFaint, py: 2 }}>PROFILE</TableCell>
                <TableCell sx={{ fontSize: 11, fontWeight: 800, color: COLORS.textFaint, py: 2 }}>ROLE</TableCell>
                <TableCell sx={{ fontSize: 11, fontWeight: 800, color: COLORS.textFaint, py: 2 }}>HOSPITAL / LICENSE</TableCell>
                <TableCell sx={{ fontSize: 11, fontWeight: 800, color: COLORS.textFaint, py: 2 }}>EXPERIENCE</TableCell>
                <TableCell sx={{ fontSize: 11, fontWeight: 800, color: COLORS.textFaint, py: 2 }}>DOCUMENTS</TableCell>
                <TableCell sx={{ fontSize: 11, fontWeight: 800, color: COLORS.textFaint, py: 2 }}>STATUS</TableCell>
                <TableCell sx={{ fontSize: 11, fontWeight: 800, color: COLORS.textFaint, py: 2, textAlign: "right" }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow><TableCell colSpan={7} sx={{ textAlign: "center", py: 5, color: COLORS.textMuted }}>No requests found.</TableCell></TableRow>
              ) : filteredData.map((row) => {
                const sColor = getStatusColor(row.status);
                return (
                  <TableRow key={row.id} hover sx={{ "& td": { borderBottom: "1px solid " + COLORS.cardBorder } }}>
                    <TableCell sx={{ py: 2 }}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{ width: 36, height: 36, bgcolor: COLORS.primaryDark }}>
                          {row.full_name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography sx={{ fontSize: 13, fontWeight: 800, color: COLORS.textDark }}>{row.full_name}</Typography>
                          <Typography sx={{ fontSize: 11, color: COLORS.textFaint }}>{row.email}</Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.primary }}>{row.role}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: COLORS.textDark }}>{row.hospital}</Typography>
                      <Typography sx={{ fontSize: 11, color: COLORS.textMuted }}>{row.medical_license}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORS.textDark }}>{row.experience}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORS.textDark }}>{row.documents_uploaded}</Typography>
                      <Typography sx={{ fontSize: 10, color: COLORS.textMuted }}>Submitted: {row.submitted_date}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={row.status} size="small" sx={{ backgroundColor: sColor.bg, color: sColor.color, fontWeight: 800, fontSize: 10, borderRadius: "6px" }} />
                    </TableCell>
                    <TableCell sx={{ textAlign: "right" }}>
                      <Button 
                        variant="contained" 
                        size="small"
                        onClick={() => handleReviewClick(row.id)}
                        sx={{ backgroundColor: COLORS.primary, borderRadius: "8px", textTransform: "none", fontWeight: 700, boxShadow: "none", "&:hover": { backgroundColor: COLORS.primaryDark } }}
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Review Right Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: "100%", sm: 500, md: 600 }, p: 0, backgroundColor: "#FAF8FC" } }}
      >
        {detailsLoading || !selectedUser ? (
          <Stack alignItems="center" justifyContent="center" sx={{ height: "100%" }}><CircularProgress sx={{ color: COLORS.primary }} /></Stack>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
            
            {/* Drawer Header */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 3, backgroundColor: "#FFF", borderBottom: "1px solid " + COLORS.cardBorder }}>
              <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 900, color: COLORS.textDark }}>
                Review Application
              </Typography>
              <IconButton onClick={() => setDrawerOpen(false)}><Close /></IconButton>
            </Stack>
            
            {/* Drawer Content */}
            <Box sx={{ flex: 1, overflowY: "auto", p: 3 }}>
              
              {/* Profile Overview */}
              <Box sx={{ backgroundColor: "#FFF", borderRadius: "16px", p: 3, border: "1px solid " + COLORS.cardBorder, mb: 3 }}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                  <Avatar sx={{ width: 70, height: 70, bgcolor: COLORS.primaryDark, fontSize: 32 }}>
                    {selectedUser.full_name.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontSize: 20, fontWeight: 900, color: COLORS.textDark }}>{selectedUser.full_name}</Typography>
                    <Typography sx={{ fontSize: 13, color: COLORS.primary, fontWeight: 700 }}>{selectedUser.role}</Typography>
                    <Chip label={selectedUser.status} size="small" sx={{ mt: 1, backgroundColor: getStatusColor(selectedUser.status).bg, color: getStatusColor(selectedUser.status).color, fontWeight: 800, fontSize: 10, borderRadius: "6px" }} />
                  </Box>
                </Stack>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography sx={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 700, textTransform: "uppercase" }}>Email</Typography>
                    <Typography sx={{ fontSize: 13, color: COLORS.textDark, fontWeight: 600 }}>{selectedUser.email}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography sx={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 700, textTransform: "uppercase" }}>Hospital / Clinic</Typography>
                    <Typography sx={{ fontSize: 13, color: COLORS.textDark, fontWeight: 600 }}>{selectedUser.profile.hospital || "-"}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography sx={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 700, textTransform: "uppercase" }}>Specialization</Typography>
                    <Typography sx={{ fontSize: 13, color: COLORS.textDark, fontWeight: 600 }}>{selectedUser.profile.specialization || "-"}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography sx={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 700, textTransform: "uppercase" }}>Experience</Typography>
                    <Typography sx={{ fontSize: 13, color: COLORS.textDark, fontWeight: 600 }}>{selectedUser.profile.years_experience ? `${selectedUser.profile.years_experience} Years` : "-"}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography sx={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 700, textTransform: "uppercase" }}>Medical License Number</Typography>
                    <Typography sx={{ fontSize: 13, color: COLORS.textDark, fontWeight: 600 }}>{selectedUser.profile.medical_license || "-"}</Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Uploaded Documents */}
              <Typography sx={{ fontSize: 15, fontWeight: 900, color: COLORS.textDark, mb: 2 }}>Uploaded Documents</Typography>
              <Grid container spacing={2} sx={{ mb: 4 }}>
                {selectedUser.documents.length === 0 ? (
                  <Grid item xs={12}><Typography sx={{ fontSize: 13, color: COLORS.textMuted }}>No documents uploaded.</Typography></Grid>
                ) : selectedUser.documents.map(doc => (
                  <Grid item xs={12} sm={6} key={doc.id}>
                    <Box sx={{ backgroundColor: "#FFF", borderRadius: "12px", p: 2, border: "1px solid " + COLORS.cardBorder, display: "flex", flexDirection: "column", height: "100%" }}>
                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                        {doc.content_type.includes("pdf") ? <PictureAsPdf sx={{ color: "#E4749B", fontSize: 28 }} /> : <ImageIcon sx={{ color: "#42A5F5", fontSize: 28 }} />}
                        <Box sx={{ overflow: "hidden" }}>
                          <Typography sx={{ fontSize: 12, fontWeight: 800, color: COLORS.textDark, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>{doc.document_type || doc.filename}</Typography>
                          <Typography sx={{ fontSize: 10, color: COLORS.textMuted }}>{new Date(doc.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Typography>
                        </Box>
                      </Stack>
                      <Stack direction="row" spacing={1} mt="auto">
                        <Button 
                          variant="outlined" size="small" fullWidth 
                          onClick={() => window.open(`http://localhost:8000/documents/${doc.id}`, "_blank")}
                          startIcon={<Visibility sx={{ fontSize: 14 }} />} 
                          sx={{ borderRadius: "8px", textTransform: "none", fontSize: 11, fontWeight: 700 }}
                        >
                          Preview
                        </Button>
                      </Stack>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              {/* Verification Checklist */}
              <Box sx={{ backgroundColor: "#FFF", borderRadius: "16px", p: 3, border: "1px solid " + COLORS.cardBorder, mb: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography sx={{ fontSize: 15, fontWeight: 900, color: COLORS.textDark }}>Verification Checklist</Typography>
                  <Typography sx={{ fontSize: 12, fontWeight: 800, color: COLORS.primary }}>{completedChecks} / 6 Completed</Typography>
                </Stack>
                <Grid container>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel control={<Checkbox checked={checklist.identity} onChange={e => setChecklist({...checklist, identity: e.target.checked})} sx={{ color: COLORS.primary, '&.Mui-checked': { color: COLORS.primary } }} />} label={<Typography sx={{ fontSize: 13, fontWeight: 600 }}>Identity Verified</Typography>} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel control={<Checkbox checked={checklist.license} onChange={e => setChecklist({...checklist, license: e.target.checked})} sx={{ color: COLORS.primary, '&.Mui-checked': { color: COLORS.primary } }} />} label={<Typography sx={{ fontSize: 13, fontWeight: 600 }}>Medical License Verified</Typography>} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel control={<Checkbox checked={checklist.degree} onChange={e => setChecklist({...checklist, degree: e.target.checked})} sx={{ color: COLORS.primary, '&.Mui-checked': { color: COLORS.primary } }} />} label={<Typography sx={{ fontSize: 13, fontWeight: 600 }}>Degree Verified</Typography>} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel control={<Checkbox checked={checklist.hospital} onChange={e => setChecklist({...checklist, hospital: e.target.checked})} sx={{ color: COLORS.primary, '&.Mui-checked': { color: COLORS.primary } }} />} label={<Typography sx={{ fontSize: 13, fontWeight: 600 }}>Hospital Verified</Typography>} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel control={<Checkbox checked={checklist.experience} onChange={e => setChecklist({...checklist, experience: e.target.checked})} sx={{ color: COLORS.primary, '&.Mui-checked': { color: COLORS.primary } }} />} label={<Typography sx={{ fontSize: 13, fontWeight: 600 }}>Experience Verified</Typography>} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel control={<Checkbox checked={checklist.govId} onChange={e => setChecklist({...checklist, govId: e.target.checked})} sx={{ color: COLORS.primary, '&.Mui-checked': { color: COLORS.primary } }} />} label={<Typography sx={{ fontSize: 13, fontWeight: 600 }}>Government ID Verified</Typography>} />
                  </Grid>
                </Grid>
              </Box>
              
            </Box>
            
            {/* Drawer Footer Actions */}
            <Stack direction="row" spacing={2} sx={{ p: 3, backgroundColor: "#FFF", borderTop: "1px solid " + COLORS.cardBorder }}>
              <Button 
                variant="outlined" 
                color="error"
                fullWidth 
                disabled={actionLoading}
                onClick={() => setRejectOpen(true)}
                sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 800, py: 1.5 }}
              >
                Reject
              </Button>
              <Button 
                variant="contained" 
                fullWidth 
                disabled={actionLoading || completedChecks < 6}
                onClick={handleApprove}
                startIcon={<GppGood />}
                sx={{ backgroundColor: COLORS.primary, borderRadius: "10px", textTransform: "none", fontWeight: 800, py: 1.5, "&:hover": { backgroundColor: COLORS.primaryDark } }}
              >
                {actionLoading ? "Processing..." : "Approve Application"}
              </Button>
            </Stack>
          </Box>
        )}
      </Drawer>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} PaperProps={{ sx: { borderRadius: "16px", minWidth: 400 } }}>
        <DialogTitle sx={{ fontFamily: FONT_DISPLAY, fontWeight: 900, pb: 1 }}>Reject Application</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 13, color: COLORS.textMuted, mb: 3 }}>
            Please provide a reason for rejecting this professional. They will be notified via email to upload updated documents.
          </Typography>
          <Typography sx={{ fontSize: 12, fontWeight: 800, color: COLORS.textDark, mb: 1 }}>Reason for Rejection *</Typography>
          <Select
            fullWidth size="small"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            sx={{ mb: 3, borderRadius: "10px", "& fieldset": { borderColor: COLORS.cardBorder } }}
            displayEmpty
          >
            <MenuItem value="" disabled>Select Reason</MenuItem>
            <MenuItem value="License Expired">License Expired</MenuItem>
            <MenuItem value="Degree Not Valid">Degree Not Valid</MenuItem>
            <MenuItem value="Document Blurry">Document Blurry</MenuItem>
            <MenuItem value="Identity Mismatch">Identity Mismatch</MenuItem>
            <MenuItem value="Incomplete Documents">Incomplete Documents</MenuItem>
            <MenuItem value="Fake Certificate">Fake Certificate</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </Select>
          
          <Typography sx={{ fontSize: 12, fontWeight: 800, color: COLORS.textDark, mb: 1 }}>Admin Notes (Optional)</Typography>
          <TextField 
            fullWidth multiline rows={3} 
            value={rejectNotes} onChange={e => setRejectNotes(e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setRejectOpen(false)} sx={{ textTransform: "none", fontWeight: 700, color: COLORS.textMuted }}>Cancel</Button>
          <Button 
            onClick={handleRejectSubmit} 
            variant="contained" color="error" 
            disabled={!rejectReason || actionLoading}
            sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 700 }}
          >
            {actionLoading ? "Rejecting..." : "Confirm Rejection"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
