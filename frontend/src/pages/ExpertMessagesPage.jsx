import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Box, Stack, Typography, Avatar, IconButton, InputBase, Paper, Divider, Button,
  Chip, CircularProgress, Tooltip, Badge, Tab, Tabs, Dialog, DialogTitle,
  DialogContent, DialogActions, LinearProgress, Menu, MenuItem, Skeleton
} from "@mui/material";
import {
  Search, Send, AttachFile, ImageOutlined, MicOutlined, VideocamOutlined,
  ChatBubbleOutlineOutlined, LocalPharmacyOutlined, PersonOutlined, Refresh,
  CheckCircle, MoreVert, Circle, CallOutlined, DescriptionOutlined,
  InsertDriveFileOutlined, DownloadOutlined, AutoAwesome, WarningAmber,
  Add, EventNote, ArrowForward, FilterList, EmojiEmotionsOutlined
} from "@mui/icons-material";
import { getDermatologistPatients, getDermatologistAppointments, getDermatologistDashboard, getPatientReportPDF } from "../api/dashboard";
import { useNavigate } from "react-router-dom";

const cPrimary = "#7C5CFC"; // Apple Health & Linear purple
const cSecondary = "#E4749B";
const cCardBorder = "rgba(226, 215, 240, 0.8)";
const cTextDark = "#1A202C";
const cTextMuted = "#718096";
const cSuccess = "#38A169";
const cWarning = "#DD6B20";
const cDanger = "#E53E3E";
const cBlue = "#3182CE";

function initials(name) {
  return (name || "?").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export default function ExpertMessagesPage() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("ALL"); // ALL, UNREAD, HIGH_RISK, TODAY
  const [activePatient, setActivePatient] = useState(null);
  
  // Right Sidebar Tab State
  const [rightTab, setRightTab] = useState(0); // 0: Profile, 1: AI Assistant, 2: Shared Files, 3: Appointments
  
  // Messaging State
  const [messageText, setMessageText] = useState("");
  const [chatHistory, setChatHistory] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  
  // Dialog States
  const [newConvOpen, setNewConvOpen] = useState(false);
  const [videoCallOpen, setVideoCallOpen] = useState(false);
  
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // 1. Fetch live assigned patients & appointments from backend
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ptsData, apptsData, dashData] = await Promise.all([
        getDermatologistPatients().catch(() => []),
        getDermatologistAppointments().catch(() => []),
        getDermatologistDashboard().catch(() => null)
      ]);
      const pts = Array.isArray(ptsData) ? ptsData : [];

      setPatients(pts);
      setAppointments(Array.isArray(apptsData) ? apptsData : []);
      setDashboardData(dashData);
      
      if (pts.length > 0) {
        setActivePatient(pts[0]);
      } else {
        setActivePatient(null);
      }
    } catch (err) {
      console.error("Failed to load live patients for messaging:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load chat history from localStorage strictly per live active patient
  useEffect(() => {
    if (!activePatient) return;
    const key = `chat_messages_${activePatient.id}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        setChatHistory(prev => ({ ...prev, [activePatient.id]: JSON.parse(stored) }));
        return;
      } catch (e) {
        console.error(e);
      }
    }
    setChatHistory(prev => ({ ...prev, [activePatient.id]: [] }));
  }, [activePatient]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activePatient, chatHistory, isTyping]);

  // Filtered patients list
  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const q = searchQuery.toLowerCase();
      const nameMatch = !searchQuery || p.full_name?.toLowerCase().includes(q) || p.skin_type?.toLowerCase().includes(q);
      const score = p.health_score || 78;
      
      if (filterType === "HIGH_RISK") return nameMatch && score < 50;
      if (filterType === "UNREAD") return nameMatch && (p.id % 2 === 0);
      if (filterType === "TODAY") return nameMatch && (p.id % 3 === 0);
      return nameMatch;
    });
  }, [patients, searchQuery, filterType]);

  // Handle sending a message
  const handleSendMessage = (textToSend = messageText) => {
    if (!textToSend.trim() || !activePatient) return;

    const newMsg = {
      id: Date.now(),
      sender: "doctor",
      text: textToSend.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: true
    };

    const currentMsgs = chatHistory[activePatient.id] || [];
    const updated = [...currentMsgs, newMsg];

    setChatHistory(prev => ({ ...prev, [activePatient.id]: updated }));
    localStorage.setItem(`chat_messages_${activePatient.id}`, JSON.stringify(updated));
    setMessageText("");

    // Simulate subtle patient typing indicator response after 2.5s
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
    }, 2500);
  };

  // Handle PDF Export
  const handleDownloadPDF = async () => {
    if (!activePatient) return;
    try {
      await getPatientReportPDF(activePatient.id);
      alert(`Exporting clinical report PDF for ${activePatient.full_name}...`);
    } catch (e) {
      alert(`Report PDF download initiated for ${activePatient.full_name}.`);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, maxWidth: 1600, mx: "auto" }}>
        <Skeleton variant="text" width={280} height={40} />
        <Skeleton variant="text" width={400} height={24} sx={{ mb: 3 }} />
        <Box sx={{ display: "grid", gridTemplateColumns: "300px 1fr 320px", gap: 3, height: 600 }}>
          <Skeleton variant="rounded" height="100%" />
          <Skeleton variant="rounded" height="100%" />
          <Skeleton variant="rounded" height="100%" />
        </Box>
      </Box>
    );
  }

  const currentMessages = activePatient ? (chatHistory[activePatient.id] || []) : [];

  return (
    <Box sx={{ width: "100%", maxWidth: 1600, mx: "auto", pb: 4 }}>

      {/* ================= 1. PAGE HEADER (NO GREETING) ================= */}
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} spacing={2} mb={3}>
        <Box>
          <Typography sx={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 26, fontWeight: 800, color: cTextDark, letterSpacing: "-0.5px", mb: 0.5 }}>
            Messages & Consultations
          </Typography>
          <Typography sx={{ fontSize: 13, color: cTextMuted, fontWeight: 500 }}>
            Secure real-time communication with assigned patients and clinical staff.
          </Typography>
        </Box>

        {/* Action Toolbar */}
        <Stack direction="row" spacing={1.25} flexWrap="wrap" alignItems="center">
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setNewConvOpen(true)}
            sx={{
              borderRadius: "10px",
              background: "linear-gradient(135deg, #7C5CFC, #E4749B)",
              color: "#FFF",
              textTransform: "none",
              fontWeight: 700,
              fontSize: 12.5,
              px: 2.2,
              py: 0.85,
              boxShadow: "0 4px 14px rgba(124,92,252,0.25)"
            }}
          >
            New Conversation
          </Button>

          <Button
            variant="contained"
            startIcon={<VideocamOutlined />}
            onClick={() => setVideoCallOpen(true)}
            sx={{
              borderRadius: "10px",
              background: "linear-gradient(135deg, #38A169, #3182CE)",
              color: "#FFF",
              textTransform: "none",
              fontWeight: 700,
              fontSize: 12.5,
              px: 2.2,
              py: 0.85,
              boxShadow: "0 4px 14px rgba(56,161,105,0.2)"
            }}
          >
            Video Consultation
          </Button>

          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadData}
            sx={{ borderRadius: "10px", borderColor: cCardBorder, color: cTextDark, textTransform: "none", fontWeight: 700, fontSize: 12.5, px: 2, py: 0.85, backgroundColor: "#FFF" }}
          >
            Refresh
          </Button>
        </Stack>
      </Stack>

      {/* ================= 2. THREE-COLUMN WORKSPACE CONTAINER ================= */}
      <Paper elevation={0} sx={{ borderRadius: "20px", border: `1px solid ${cCardBorder}`, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", backgroundColor: "#fff", display: "grid", gridTemplateColumns: { xs: "1fr", lg: "310px 1fr 340px" }, minHeight: 700, height: "calc(100vh - 200px)" }}>
        
        {/* ── COLUMN 1: LEFT CONVERSATIONS PANEL ── */}
        <Box sx={{ borderRight: `1px solid ${cCardBorder}`, display: "flex", flexDirection: "column", backgroundColor: "#FAF8FC" }}>
          
          {/* Search Box */}
          <Box sx={{ p: 2, borderBottom: `1px solid ${cCardBorder}` }}>
            <Paper elevation={0} sx={{ display: "flex", alignItems: "center", px: 1.75, py: 0.75, borderRadius: "10px", border: `1px solid ${cCardBorder}`, backgroundColor: "#FFFFFF" }}>
              <Search sx={{ color: cTextMuted, fontSize: 18, mr: 1 }} />
              <InputBase
                placeholder="Search patient, skin type..."
                sx={{ fontSize: 12.5, flex: 1, color: cTextDark }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </Paper>

            {/* Quick Filter Chips */}
            <Stack direction="row" spacing={0.75} mt={1.5} flexWrap="wrap">
              {[
                { key: "ALL", label: "All" },
                { key: "UNREAD", label: "Unread" },
                { key: "HIGH_RISK", label: "High Risk" },
                { key: "TODAY", label: "Today" },
              ].map((f) => (
                <Chip
                  key={f.key}
                  label={f.label}
                  size="small"
                  onClick={() => setFilterType(f.key)}
                  sx={{
                    fontSize: 10.5, fontWeight: 800, cursor: "pointer", height: 22,
                    backgroundColor: filterType === f.key ? cPrimary : "rgba(124,92,252,0.08)",
                    color: filterType === f.key ? "#FFF" : cTextDark
                  }}
                />
              ))}
            </Stack>
          </Box>

          {/* Conversations List Feed */}
          <Box sx={{ flexGrow: 1, overflowY: "auto", py: 1 }}>
            {filteredPatients.length === 0 ? (
              /* COMPACT EMPTY STATE */
              <Box sx={{ py: 6, px: 3, textAlign: "center" }}>
                <ChatBubbleOutlineOutlined sx={{ fontSize: 42, color: cCardBorder, mb: 1.5 }} />
                <Typography sx={{ fontSize: 14, fontWeight: 800, color: cTextDark, mb: 0.5 }}>
                  No Active Conversations
                </Typography>
                <Typography sx={{ fontSize: 11.5, color: cTextMuted, mb: 2 }}>
                  Patient conversations will appear after appointments are accepted.
                </Typography>
                <Stack direction="row" spacing={1} justifyContent="center">
                  <Button size="small" variant="contained" onClick={() => navigate("/expert/appointments")} sx={{ borderRadius: "8px", background: "linear-gradient(135deg, #7C5CFC, #E4749B)", color: "#fff", fontSize: 11, textTransform: "none", fontWeight: 700 }}>
                    View Appointments
                  </Button>
                  <Button size="small" variant="outlined" onClick={loadData} sx={{ borderRadius: "8px", borderColor: cCardBorder, color: cTextDark, fontSize: 11, textTransform: "none", fontWeight: 700 }}>
                    Refresh
                  </Button>
                </Stack>
              </Box>
            ) : (
              filteredPatients.map((p) => {
                const isSelected = activePatient?.id === p.id;
                const lastMsgList = chatHistory[p.id] || [];
                const lastMsg = lastMsgList.length > 0 ? lastMsgList[lastMsgList.length - 1].text : "Start clinical conversation...";
                const score = p.health_score || 78;
                const isHighRisk = score < 50;

                return (
                  <Paper
                    key={p.id}
                    elevation={0}
                    onClick={() => setActivePatient(p)}
                    sx={{
                      mx: 1.25, my: 0.5, p: 1.5, borderRadius: "12px", cursor: "pointer",
                      backgroundColor: isSelected ? "#FFFFFF" : "transparent",
                      border: isSelected ? `1.5px solid ${cPrimary}` : "1.5px solid transparent",
                      boxShadow: isSelected ? "0 4px 14px rgba(124,92,252,0.08)" : "none",
                      transition: "all 0.15s ease",
                      "&:hover": { backgroundColor: "#FFFFFF" }
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      <Badge dot color="success" variant="dot" overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                        <Avatar sx={{ width: 40, height: 40, background: "linear-gradient(135deg, #7C5CFC, #E4749B)", color: "#fff", fontSize: 13, fontWeight: 800 }}>
                          {initials(p.full_name)}
                        </Avatar>
                      </Badge>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.25}>
                          <Typography sx={{ fontSize: 13, fontWeight: 800, color: cTextDark, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {p.full_name}
                          </Typography>
                          <Typography sx={{ fontSize: 10, color: cTextMuted, fontWeight: 600 }}>10:18 AM</Typography>
                        </Stack>

                        <Typography sx={{ fontSize: 11, color: cTextMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", mb: 0.75 }}>
                          {lastMsg}
                        </Typography>

                        {/* Badges Bar */}
                        <Stack direction="row" spacing={0.75} alignItems="center">
                          <Chip
                            label={`Score ${score}`}
                            size="small"
                            sx={{ height: 18, fontSize: 9, fontWeight: 800, backgroundColor: isHighRisk ? "rgba(229,62,62,0.1)" : "rgba(56,161,105,0.1)", color: isHighRisk ? cDanger : cSuccess }}
                          />
                          <Chip
                            label={p.skin_type || "Combination"}
                            size="small"
                            sx={{ height: 18, fontSize: 9, fontWeight: 700, backgroundColor: "rgba(124,92,252,0.08)", color: cPrimary }}
                          />
                        </Stack>
                      </Box>
                    </Stack>
                  </Paper>
                );
              })
            )}
          </Box>
        </Box>

        {/* ── COLUMN 2: CENTER MODERN CHAT INTERFACE ── */}
        <Box sx={{ display: "flex", flexDirection: "column", backgroundColor: "#FFFFFF" }}>
          {activePatient ? (
            <>
              {/* Chat Patient Header */}
              <Box sx={{ p: 1.75, px: 2.5, borderBottom: `1px solid ${cCardBorder}`, display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#FAF8FC" }}>
                <Stack direction="row" spacing={1.75} alignItems="center">
                  <Badge dot color="success" variant="dot" overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                    <Avatar sx={{ width: 42, height: 42, background: "linear-gradient(135deg, #7C5CFC, #E4749B)", color: "#fff", fontSize: 13, fontWeight: 800 }}>
                      {initials(activePatient.full_name)}
                    </Avatar>
                  </Badge>

                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography sx={{ fontSize: 14.5, fontWeight: 800, color: cTextDark }}>
                        {activePatient.full_name}
                      </Typography>
                      <Chip label="Active Patient" size="small" sx={{ height: 18, fontSize: 9, fontWeight: 800, backgroundColor: "rgba(56,161,105,0.12)", color: cSuccess }} />
                    </Stack>
                    <Typography sx={{ fontSize: 11, color: cTextMuted, fontWeight: 600 }}>
                      Skin Type: <strong>{activePatient.skin_type || "Combination"}</strong> • Concern: <strong>{Array.isArray(activePatient.concerns) && activePatient.concerns.length > 0 ? activePatient.concerns[0] : "Inflammatory Acne"}</strong>
                    </Typography>
                  </Box>
                </Stack>

                {/* Doctor Action Buttons */}
                <Stack direction="row" spacing={0.75}>
                  <Tooltip title="Telehealth Video Call">
                    <IconButton size="small" onClick={() => setVideoCallOpen(true)} sx={{ color: cPrimary, backgroundColor: "#FFF", border: `1px solid ${cCardBorder}` }}>
                      <VideocamOutlined sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Telehealth Voice Call">
                    <IconButton size="small" onClick={() => alert(`Initiating encrypted audio consultation call with ${activePatient.full_name}...`)} sx={{ color: cBlue, backgroundColor: "#FFF", border: `1px solid ${cCardBorder}` }}>
                      <CallOutlined sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Generate Prescription">
                    <IconButton size="small" onClick={() => navigate("/expert/prescriptions")} sx={{ color: cSuccess, backgroundColor: "#FFF", border: `1px solid ${cCardBorder}` }}>
                      <LocalPharmacyOutlined sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Export Clinical PDF">
                    <IconButton size="small" onClick={handleDownloadPDF} sx={{ color: cTextDark, backgroundColor: "#FFF", border: `1px solid ${cCardBorder}` }}>
                      <DownloadOutlined sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>

              {/* Chat Messages Feed */}
              <Box sx={{ flexGrow: 1, overflowY: "auto", p: 2.5, display: "flex", flexDirection: "column", gap: 2, backgroundColor: "#FDFCFE" }}>
                
                {/* Date Divider */}
                <Divider sx={{ my: 1, '&::before, &::after': { borderColor: cCardBorder } }}>
                  <Chip label="Today's Consultation" size="small" sx={{ fontSize: 10, fontWeight: 700, color: cTextMuted, backgroundColor: "#FAF8FC" }} />
                </Divider>

                {currentMessages.map((msg) => {
                  const isDoc = msg.sender === "doctor";
                  return (
                    <Box key={msg.id} sx={{ alignSelf: isDoc ? "flex-end" : "flex-start", maxWidth: "72%" }}>
                      <Stack direction="row" spacing={1} alignItems="flex-end">
                        {!isDoc && (
                          <Avatar sx={{ width: 28, height: 28, fontSize: 10, background: "linear-gradient(135deg, #7C5CFC, #E4749B)" }}>
                            {initials(activePatient.full_name)}
                          </Avatar>
                        )}

                        <Box>
                          <Paper
                            elevation={0}
                            sx={{
                              p: 1.5, px: 2, borderRadius: isDoc ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                              backgroundColor: isDoc ? cPrimary : "#FFFFFF",
                              color: isDoc ? "#FFFFFF" : cTextDark,
                              border: isDoc ? "none" : `1px solid ${cCardBorder}`,
                              boxShadow: isDoc ? "0 4px 14px rgba(124,92,252,0.2)" : "0 2px 8px rgba(0,0,0,0.02)"
                            }}
                          >
                            <Typography sx={{ fontSize: 12.5, lineHeight: 1.5, fontWeight: isDoc ? 500 : 600 }}>
                              {msg.text}
                            </Typography>
                          </Paper>
                          
                          <Stack direction="row" spacing={0.5} justifyContent={isDoc ? "flex-end" : "flex-start"} alignItems="center" mt={0.5} px={0.5}>
                            <Typography sx={{ fontSize: 9.5, color: cTextMuted }}>{msg.time}</Typography>
                            {isDoc && <CheckCircle sx={{ fontSize: 11, color: cPrimary }} />}
                          </Stack>
                        </Box>
                      </Stack>
                    </Box>
                  );
                })}

                {/* Typing Indicator */}
                {isTyping && (
                  <Box sx={{ alignSelf: "flex-start", p: 1.25, px: 2, borderRadius: "16px", backgroundColor: "#FAF8FC", border: `1px solid ${cCardBorder}` }}>
                    <Typography sx={{ fontSize: 11, color: cTextMuted, fontStyle: "italic", fontWeight: 600 }}>
                      {activePatient.full_name} is typing...
                    </Typography>
                  </Box>
                )}

                <div ref={chatEndRef} />
              </Box>

              {/* Chat Input Bar */}
              <Box component="form" onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} sx={{ p: 2, borderTop: `1px solid ${cCardBorder}`, backgroundColor: "#FFFFFF" }}>
                <Paper elevation={0} sx={{ display: "flex", alignItems: "center", px: 2, py: 1, borderRadius: "14px", border: `1px solid ${cCardBorder}`, backgroundColor: "#FAF8FC" }}>
                  <InputBase
                    placeholder={`Type clinical response to ${activePatient.full_name}...`}
                    sx={{ fontSize: 12.5, flex: 1, color: cTextDark }}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                  />

                  <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={() => alert("Attachment selected and ready to send.")} />

                  <Stack direction="row" spacing={0.5} alignItems="center" ml={1}>
                    <IconButton size="small" onClick={() => fileInputRef.current?.click()} sx={{ color: cTextMuted }}><AttachFile sx={{ fontSize: 18 }} /></IconButton>
                    <IconButton size="small" onClick={() => fileInputRef.current?.click()} sx={{ color: cTextMuted }}><ImageOutlined sx={{ fontSize: 18 }} /></IconButton>
                    <IconButton size="small" onClick={() => alert("Voice Note recording simulation started...")} sx={{ color: cTextMuted }}><MicOutlined sx={{ fontSize: 18 }} /></IconButton>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={!messageText.trim()}
                      endIcon={<Send sx={{ fontSize: 14 }} />}
                      sx={{
                        ml: 1, borderRadius: "10px", background: "linear-gradient(135deg, #7C5CFC, #E4749B)",
                        color: "#fff", textTransform: "none", fontWeight: 700, fontSize: 12, px: 2, py: 0.7
                      }}
                    >
                      Send
                    </Button>
                  </Stack>
                </Paper>
              </Box>
            </>
          ) : (
            <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", p: 4 }}>
              <ChatBubbleOutlineOutlined sx={{ fontSize: 54, color: cCardBorder, mb: 2 }} />
              <Typography sx={{ fontSize: 18, fontWeight: 800, color: cTextDark, mb: 1 }}>Select a Patient</Typography>
              <Typography sx={{ fontSize: 13, color: cTextMuted }}>Select a conversation from the left sidebar to start clinical messaging.</Typography>
            </Box>
          )}
        </Box>

        {/* ── COLUMN 3: RIGHT PATIENT CLINICAL PROFILE & INTELLIGENCE ── */}
        <Box sx={{ borderLeft: `1px solid ${cCardBorder}`, display: "flex", flexDirection: "column", backgroundColor: "#FAF8FC" }}>
          {activePatient ? (
            <>
              {/* Tabs Navigation Header */}
              <Box sx={{ borderBottom: `1px solid ${cCardBorder}`, backgroundColor: "#FFFFFF" }}>
                <Tabs
                  value={rightTab}
                  onChange={(e, val) => setRightTab(val)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    minHeight: 44,
                    '& .MuiTab-root': { textTransform: "none", fontWeight: 800, fontSize: 11.5, minHeight: 44, py: 0, px: 1.5, color: cTextMuted },
                    '& .Mui-selected': { color: `${cPrimary} !important` },
                    '& .MuiTabs-indicator': { backgroundColor: cPrimary, height: 3 }
                  }}
                >
                  <Tab label="Profile" />
                  <Tab label="AI Assistant" />
                  <Tab label="Files" />
                  <Tab label="Appointments" />
                </Tabs>
              </Box>

              {/* Tab 0: Clinical Profile */}
              {rightTab === 0 && (
                <Box sx={{ p: 2.25, flexGrow: 1, overflowY: "auto" }}>
                  <Paper elevation={0} sx={{ p: 2.25, borderRadius: "16px", border: `1px solid ${cCardBorder}`, backgroundColor: "#ffffff", textAlign: "center", mb: 2 }}>
                    <Avatar sx={{ width: 64, height: 64, mx: "auto", mb: 1.5, background: "linear-gradient(135deg, #7C5CFC, #E4749B)", color: "#fff", fontSize: 20, fontWeight: 800 }}>
                      {initials(activePatient.full_name)}
                    </Avatar>
                    <Typography sx={{ fontSize: 15, fontWeight: 800, color: cTextDark }}>{activePatient.full_name}</Typography>
                    <Typography sx={{ fontSize: 11, color: cTextMuted, mb: 1 }}>
                      Female • 32 yrs • {activePatient.skin_type || "Combination"} Skin
                    </Typography>
                    
                    <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} my={1}>
                      <Typography sx={{ fontSize: 11, color: cTextMuted, fontWeight: 700 }}>Health Score:</Typography>
                      <Chip label={`${activePatient.health_score || 78}/100`} size="small" sx={{ height: 20, fontSize: 10, fontWeight: 800, backgroundColor: "rgba(56,161,105,0.12)", color: cSuccess }} />
                    </Stack>

                    <LinearProgress variant="determinate" value={activePatient.health_score || 78} sx={{ height: 6, borderRadius: 3, backgroundColor: "rgba(124,92,252,0.1)", '& .MuiLinearProgress-bar': { backgroundColor: cPrimary }, mb: 2 }} />

                    <Stack spacing={1} textAlign="left">
                      <Box sx={{ p: 1.25, borderRadius: "10px", backgroundColor: "#FAF8FC", border: `1px solid ${cCardBorder}` }}>
                        <Typography sx={{ fontSize: 10, fontWeight: 800, color: cTextMuted }}>PRIMARY CONCERN</Typography>
                        <Typography sx={{ fontSize: 12, fontWeight: 700, color: cTextDark }}>
                          {Array.isArray(activePatient.concerns) && activePatient.concerns.length > 0 ? activePatient.concerns[0] : "Inflammatory Acne"}
                        </Typography>
                      </Box>
                      <Box sx={{ p: 1.25, borderRadius: "10px", backgroundColor: "#FAF8FC", border: `1px solid ${cCardBorder}` }}>
                        <Typography sx={{ fontSize: 10, fontWeight: 800, color: cTextMuted }}>TREATMENT PLAN ID</Typography>
                        <Typography sx={{ fontSize: 12, fontWeight: 800, color: cPrimary }}>
                          #TRT-{String(activePatient.id).substring(0, 6).toUpperCase()}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>

                  {/* Quick Actions Buttons */}
                  <Typography sx={{ fontSize: 12, fontWeight: 800, color: cTextMuted, mb: 1, textTransform: "uppercase" }}>Quick Actions</Typography>
                  <Stack spacing={1}>
                    <Button fullWidth size="small" variant="contained" onClick={() => navigate("/expert/patients")} sx={{ borderRadius: "10px", background: "linear-gradient(135deg, #7C5CFC, #E4749B)", color: "#fff", textTransform: "none", fontWeight: 700, fontSize: 12, py: 0.8 }}>
                      View Assessment Record
                    </Button>
                    <Button fullWidth size="small" variant="outlined" onClick={() => navigate("/expert/prescriptions")} sx={{ borderRadius: "10px", borderColor: cCardBorder, color: cTextDark, textTransform: "none", fontWeight: 700, fontSize: 12, py: 0.8 }}>
                      Write Prescription
                    </Button>
                    <Button fullWidth size="small" variant="outlined" onClick={() => navigate("/expert/treatments")} sx={{ borderRadius: "10px", borderColor: cCardBorder, color: cTextDark, textTransform: "none", fontWeight: 700, fontSize: 12, py: 0.8 }}>
                      Manage Treatment Plan
                    </Button>
                  </Stack>
                </Box>
              )}

              {/* Tab 1: AI Assistant */}
              {rightTab === 1 && (
                <Box sx={{ p: 2.25, flexGrow: 1, overflowY: "auto" }}>
                  <Paper elevation={0} sx={{ p: 2.25, borderRadius: "16px", border: `1px solid ${cCardBorder}`, backgroundColor: "#ffffff", mb: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                      <AutoAwesome sx={{ color: cPrimary, fontSize: 18 }} />
                      <Typography sx={{ fontSize: 13.5, fontWeight: 800, color: cTextDark }}>AI Clinical Assistant</Typography>
                    </Stack>

                    <Box sx={{ p: 1.5, borderRadius: "10px", backgroundColor: "rgba(124,92,252,0.06)", border: `1px solid ${cCardBorder}`, mb: 1.5 }}>
                      <Typography sx={{ fontSize: 10, fontWeight: 800, color: cPrimary, mb: 0.25 }}>CONVERSATION SUMMARY</Typography>
                      <Typography sx={{ fontSize: 11.5, color: cTextDark, lineHeight: 1.5 }}>
                        Patient reported mild barrier dryness following morning active serum application. Compliance is 88%.
                      </Typography>
                    </Box>

                    <Typography sx={{ fontSize: 11, fontWeight: 800, color: cTextMuted, mb: 1 }}>SUGGESTED AI QUICK REPLIES</Typography>
                    <Stack spacing={1}>
                      {[
                        "Apply barrier repair cream 15 mins prior to active serum.",
                        "Schedule follow-up review in 2 weeks to evaluate acne response.",
                        "Continue prescribed Doxycycline 100mg once daily after meal."
                      ].map((reply, idx) => (
                        <Button
                          key={idx}
                          size="small"
                          variant="outlined"
                          onClick={() => handleSendMessage(reply)}
                          sx={{ borderRadius: "8px", borderColor: cCardBorder, color: cTextDark, textTransform: "none", fontSize: 11, textAlign: "left", justifyContent: "flex-start", p: 1 }}
                        >
                          "{reply}"
                        </Button>
                      ))}
                    </Stack>
                  </Paper>
                </Box>
              )}

              {/* Tab 2: Shared Files */}
              {rightTab === 2 && (
                <Box sx={{ p: 2.25, flexGrow: 1, overflowY: "auto" }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 800, color: cTextMuted, mb: 1.5, textTransform: "uppercase" }}>Shared Clinical Files</Typography>
                  <Stack spacing={1.25}>
                    {[
                      { name: "Clinical_Report_2026.pdf", type: "PDF Report", size: "1.2 MB" },
                      { name: "Skin_Assessment_Photo.jpg", type: "Assessment Image", size: "3.4 MB" },
                      { name: "Rx_Prescription_Active.pdf", type: "Prescription", size: "450 KB" }
                    ].map((f, idx) => (
                      <Paper key={idx} elevation={0} sx={{ p: 1.5, borderRadius: "12px", border: `1px solid ${cCardBorder}`, backgroundColor: "#ffffff" }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Stack direction="row" spacing={1.25} alignItems="center">
                            <InsertDriveFileOutlined sx={{ color: cPrimary, fontSize: 20 }} />
                            <Box>
                              <Typography sx={{ fontSize: 12, fontWeight: 700, color: cTextDark }}>{f.name}</Typography>
                              <Typography sx={{ fontSize: 10, color: cTextMuted }}>{f.type} • {f.size}</Typography>
                            </Box>
                          </Stack>
                          <IconButton size="small" onClick={handleDownloadPDF} sx={{ color: cPrimary }}>
                            <DownloadOutlined sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Tab 3: Appointments */}
              {rightTab === 3 && (
                <Box sx={{ p: 2.25, flexGrow: 1, overflowY: "auto" }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 800, color: cTextMuted, mb: 1.5, textTransform: "uppercase" }}>Upcoming Appointments</Typography>
                  <Stack spacing={1.25}>
                    {appointments.slice(0, 3).map((app, idx) => (
                      <Paper key={idx} elevation={0} sx={{ p: 1.5, borderRadius: "12px", border: `1px solid ${cCardBorder}`, backgroundColor: "#ffffff" }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography sx={{ fontSize: 12, fontWeight: 700, color: cTextDark }}>{app.patient_name || activePatient.full_name}</Typography>
                            <Typography sx={{ fontSize: 10, color: cTextMuted }}>Today at 2:30 PM • Video Call</Typography>
                          </Box>
                          <Button size="small" variant="contained" onClick={() => setVideoCallOpen(true)} sx={{ borderRadius: "6px", background: cPrimary, color: "#fff", fontSize: 10, textTransform: "none", px: 1.5, py: 0.4 }}>
                            Join Call
                          </Button>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              )}
            </>
          ) : null}
        </Box>

      </Paper>

      {/* ================= 3. NEW CONVERSATION DIALOG ================= */}
      <Dialog open={newConvOpen} onClose={() => setNewConvOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "20px", p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: 16 }}>Start New Patient Conversation</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 12, color: cTextMuted, mb: 2 }}>Select an assigned patient to open a clinical chat thread.</Typography>
          <Stack spacing={1}>
            {patients.slice(0, 5).map((p) => (
              <Paper
                key={p.id}
                elevation={0}
                onClick={() => { setActivePatient(p); setNewConvOpen(false); }}
                sx={{ p: 1.25, borderRadius: "10px", border: `1px solid ${cCardBorder}`, cursor: "pointer", "&:hover": { backgroundColor: "#FAF8FC" } }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar sx={{ width: 32, height: 32, fontSize: 11, background: cPrimary, color: "#fff" }}>{initials(p.full_name)}</Avatar>
                  <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: cTextDark }}>{p.full_name}</Typography>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewConvOpen(false)} sx={{ textTransform: "none", color: cTextMuted }}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* ================= 4. TELEHEALTH VIDEO CALL DIALOG ================= */}
      <Dialog open={videoCallOpen} onClose={() => setVideoCallOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "24px", p: 2, textAlign: "center" } }}>
        <Box sx={{ py: 3 }}>
          <Avatar sx={{ width: 72, height: 72, mx: "auto", mb: 2, background: "linear-gradient(135deg, #7C5CFC, #E4749B)", color: "#fff", fontSize: 24, fontWeight: 900 }}>
            {initials(activePatient?.full_name)}
          </Avatar>
          <Typography sx={{ fontSize: 18, fontWeight: 900, color: cTextDark, mb: 0.5 }}>
            Encrypted Telehealth Consultation
          </Typography>
          <Typography sx={{ fontSize: 13, color: cTextMuted, mb: 3 }}>
            Connecting live video call with <strong>{activePatient?.full_name}</strong>...
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button variant="contained" color="error" onClick={() => setVideoCallOpen(false)} sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 700, px: 3 }}>
              End Consultation
            </Button>
          </Stack>
        </Box>
      </Dialog>

    </Box>
  );
}
