import { useState, useEffect, useCallback } from "react";
import {
  Box, Stack, Typography, IconButton, Button, CircularProgress,
  InputBase, Paper, Divider
} from "@mui/material";
import {
  Search, NotificationsActiveOutlined, Add, AccessTime, MoreVert
} from "@mui/icons-material";
import { COLORS } from "../theme/colors";

const cPrimary = COLORS.primary || "#8B6FC9";
const cCardBorder = COLORS.cardBorder || "#F6F4F8";
const cTextDark = COLORS.textDark || "#2D3748";
const cTextMuted = COLORS.textMuted || "#718096";

export default function ConsultantRemindersPage() {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
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
          <Typography sx={{ fontSize: 24, fontWeight: 800, color: cTextDark, mb: 0.5 }}>Reminders</Typography>
          <Typography sx={{ fontSize: 13, color: cTextMuted }}>Manage your scheduled tasks, client follow-ups, and notifications.</Typography>
        </Box>
        <Stack direction="row" spacing={2} alignItems="center">
          <Paper sx={{ display: "flex", alignItems: "center", px: 2, py: 1, borderRadius: "12px", border: `1px solid ${cCardBorder}`, boxShadow: "0 2px 8px rgba(139,111,201,0.04)", width: 280, backgroundColor: "#fff" }}>
            <Search sx={{ color: cTextMuted, fontSize: 20, mr: 1 }} />
            <InputBase placeholder="Search reminders..." sx={{ fontSize: 13, flex: 1, color: cTextDark }} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </Paper>
          <Button variant="contained" startIcon={<Add />} sx={{ borderRadius: "10px", backgroundColor: cPrimary, color: "#fff", textTransform: "none", fontWeight: 700, px: 2, boxShadow: "none", '&:hover': { backgroundColor: "#7B5EC0" } }}>
            New Reminder
          </Button>
        </Stack>
      </Stack>

      <Paper sx={{ borderRadius: "20px", border: "1px solid " + cCardBorder, overflow: "hidden", boxShadow: "0 4px 18px rgba(139,111,201,0.03)", backgroundColor: "#fff" }}>
        <Box sx={{ py: 10, textAlign: "center" }}>
          <NotificationsActiveOutlined sx={{ fontSize: 48, color: cCardBorder, mb: 2 }} />
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: cTextDark, mb: 1 }}>All caught up!</Typography>
          <Typography sx={{ fontSize: 13, color: cTextMuted }}>You have no pending reminders or scheduled tasks.</Typography>
          <Button variant="outlined" sx={{ mt: 3, textTransform: "none", borderRadius: "10px", fontWeight: 700, color: cTextDark, borderColor: cCardBorder }}>
            Create Task
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
