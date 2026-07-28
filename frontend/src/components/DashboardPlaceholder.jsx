import React, { useState } from "react";
import { Box, Typography, Paper, Stack, Breadcrumbs, InputBase, Button, Chip, Avatar, IconButton } from "@mui/material";
import { motion } from "framer-motion";
import { Search, FilterList, MoreVert, Add, ChevronRight } from "@mui/icons-material";
import { COLORS, FONT_DISPLAY } from "../theme/colors";

export default function DashboardPlaceholder({ title, description, parentModule = "Dashboard", primaryAction = "Create New" }) {
  const [searchTerm, setSearchTerm] = useState("");

  const dummyData = [
    { id: 1, name: "Sample Record A", status: "Active", date: "Oct 24, 2023", email: "user.a@example.com" },
    { id: 2, name: "Sample Record B", status: "Pending", date: "Oct 25, 2023", email: "user.b@example.com" },
    { id: 3, name: "Sample Record C", status: "Resolved", date: "Oct 26, 2023", email: "user.c@example.com" }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Box sx={{ maxWidth: 1400, mx: "auto", width: "100%", p: { xs: 2.5, sm: 4 } }}>
        
        {/* Header & Breadcrumbs */}
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "flex-end" }} spacing={2} sx={{ mb: 4 }}>
          <Box>
            <Breadcrumbs separator={<ChevronRight sx={{ fontSize: 16, color: COLORS.textFaint }} />} sx={{ mb: 1.5 }}>
              <Typography sx={{ fontSize: 13, color: COLORS.textMuted, cursor: "pointer", "&:hover": { color: COLORS.primary } }}>{parentModule}</Typography>
              <Typography sx={{ fontSize: 13, color: COLORS.textDark, fontWeight: 700 }}>{title}</Typography>
            </Breadcrumbs>
            <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 900, color: COLORS.textDark, lineHeight: 1.2 }}>
              {title}
            </Typography>
            <Typography sx={{ fontSize: 14, color: COLORS.textMuted, mt: 0.5, maxWidth: 600 }}>
              {description || "This page is currently under development. It will feature professional UI elements, data tables, and analytics."}
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<Add />} sx={{ background: COLORS.primaryDark, color: "#FFF", borderRadius: "10px", textTransform: "none", px: 2.5, fontWeight: 600, boxShadow: "0 4px 12px rgba(139,111,201,0.2)" }}>
            {primaryAction}
          </Button>
        </Stack>

        {/* Action Bar (Search & Filters) */}
        <Paper sx={{ p: 2, borderRadius: "16px", border: "1px solid " + COLORS.cardBorder, background: "#FFF", mb: 3 }}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center" spacing={2}>
            <Paper sx={{ p: "6px 14px", display: "flex", alignItems: "center", border: "1px solid " + COLORS.cardBorder, borderRadius: "10px", width: { xs: "100%", sm: 350 }, boxShadow: "none", backgroundColor: "#FCFBFE" }}>
              <Search sx={{ color: COLORS.textMuted, fontSize: 19, mr: 1.5 }} />
              <InputBase placeholder={`Search ${title.toLowerCase()}...`} sx={{ fontSize: 14, flex: 1 }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </Paper>
            <Button variant="outlined" startIcon={<FilterList />} sx={{ color: COLORS.textDark, borderColor: COLORS.cardBorder, borderRadius: "10px", textTransform: "none", px: 2, backgroundColor: "#FFF" }}>
              Advanced Filters
            </Button>
          </Stack>
        </Paper>

        {/* Data Table */}
        <Paper sx={{ borderRadius: "16px", border: "1px solid " + COLORS.cardBorder, background: "#FFF", overflow: "hidden" }}>
          <Box sx={{ overflowX: "auto" }}>
            <Box sx={{ minWidth: 800 }}>
              {/* Table Header */}
              <Box sx={{ display: "grid", gridTemplateColumns: "2.5fr 1.5fr 1fr 1fr 50px", gap: 2, p: 2.5, backgroundColor: "#FAF8FC", borderBottom: "1px solid " + COLORS.cardBorder }}>
                <Typography sx={{ fontSize: 12, fontWeight: 800, color: COLORS.textMuted, textTransform: "uppercase" }}>Primary Identity</Typography>
                <Typography sx={{ fontSize: 12, fontWeight: 800, color: COLORS.textMuted, textTransform: "uppercase" }}>Contact Reference</Typography>
                <Typography sx={{ fontSize: 12, fontWeight: 800, color: COLORS.textMuted, textTransform: "uppercase" }}>Status</Typography>
                <Typography sx={{ fontSize: 12, fontWeight: 800, color: COLORS.textMuted, textTransform: "uppercase" }}>Date Added</Typography>
                <Box />
              </Box>

              {/* Table Body */}
              {dummyData.map((row, idx) => (
                <Box key={idx} sx={{ display: "grid", gridTemplateColumns: "2.5fr 1.5fr 1fr 1fr 50px", gap: 2, p: 2.5, alignItems: "center", borderBottom: idx === dummyData.length - 1 ? "none" : "1px solid " + COLORS.cardBorder, "&:hover": { backgroundColor: "#FCFBFE" } }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ width: 38, height: 38, background: "linear-gradient(135deg, #8B6FC9 0%, #E4749B 100%)", fontSize: 14, fontWeight: 700 }}>
                      {row.name.charAt(0)}
                    </Avatar>
                    <Typography sx={{ fontSize: 14, fontWeight: 700, color: COLORS.textDark }}>{row.name}</Typography>
                  </Stack>
                  <Typography sx={{ fontSize: 13, color: COLORS.textMuted }}>{row.email}</Typography>
                  <Box>
                    <Chip label={row.status} size="small" sx={{ height: 24, fontSize: 11, fontWeight: 700, borderRadius: "6px", 
                      backgroundColor: row.status === "Active" ? "rgba(76,175,125,0.1)" : row.status === "Pending" ? "rgba(255,167,38,0.1)" : "rgba(139,111,201,0.1)",
                      color: row.status === "Active" ? COLORS.success : row.status === "Pending" ? COLORS.warning : COLORS.primaryDark
                    }} />
                  </Box>
                  <Typography sx={{ fontSize: 13, color: COLORS.textMuted }}>{row.date}</Typography>
                  <IconButton size="small">
                    <MoreVert sx={{ fontSize: 18, color: COLORS.textMuted }} />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </Box>
        </Paper>

        {/* Empty State / Pagination placeholder */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 3, px: 1 }}>
          <Typography sx={{ fontSize: 13, color: COLORS.textMuted }}>Showing 3 of 24 records</Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" size="small" disabled sx={{ borderRadius: "8px", textTransform: "none" }}>Previous</Button>
            <Button variant="outlined" size="small" sx={{ borderRadius: "8px", textTransform: "none", borderColor: COLORS.cardBorder, color: COLORS.textDark }}>Next</Button>
          </Stack>
        </Stack>

      </Box>
    </motion.div>
  );
}
