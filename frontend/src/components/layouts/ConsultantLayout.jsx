import { useState } from "react";
import { Box, Stack, Typography, Paper, InputBase, IconButton, Badge, Divider, Avatar, Button } from "@mui/material";
import {
  DashboardOutlined, PeopleAltOutlined, EventNoteOutlined, FactCheckOutlined,
  ChatBubbleOutlineOutlined, SettingsOutlined, LogoutOutlined, NotificationsNone,
  Search, Spa, FormatListBulletedOutlined, LocalMallOutlined, AssessmentOutlined,
  AssignmentTurnedInOutlined, NotificationsActiveOutlined
} from "@mui/icons-material";
import { COLORS, FONT_DISPLAY } from "../../theme/colors";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import ProfileDropdown from "../ProfileDropdown";
import { logout as apiLogout } from "../../api/auth";

export default function ConsultantLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const getCurrentUser = () => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch (e) {
      return null;
    }
  };

  const user = getCurrentUser();
  const consultantName = user?.fullName || user?.full_name || user?.name || "Consultant";

  const handleLogout = () => {
    apiLogout();
    navigate("/login");
  };

  const pathParts = location.pathname.split("/").filter(Boolean);
  const activeTab = pathParts[1] || "dashboard";

  const SIDEBAR_ITEMS = [
    { label: "Dashboard", sub: "Overview & key metrics", icon: DashboardOutlined, key: "dashboard", path: "/consultant/dashboard" },
    { label: "Clients", sub: "Manage client profiles", icon: PeopleAltOutlined, key: "clients", path: "/consultant/clients" },
    { label: "Appointments", sub: "Manage appointments", icon: EventNoteOutlined, key: "appointments", path: "/consultant/appointments" },
    { label: "Assessments", sub: "Skin assessments & analysis", icon: FactCheckOutlined, key: "assessments", path: "/consultant/assessments" },
    { label: "Routine Plans", sub: "Create & manage routines", icon: FormatListBulletedOutlined, key: "routines", path: "/consultant/routines" },
    { label: "Product Recs", sub: "View & recommend products", icon: LocalMallOutlined, key: "products", path: "/consultant/products" },
    { label: "Messages", sub: "Client communications", icon: ChatBubbleOutlineOutlined, key: "messages", badge: 12, path: "/consultant/messages" },
    { label: "Reports", sub: "Client reports & analytics", icon: AssessmentOutlined, key: "reports", path: "/consultant/reports" },
    { label: "Follow-ups", sub: "Notes & follow-up history", icon: AssignmentTurnedInOutlined, key: "follow-ups", path: "/consultant/follow-ups" },
    { label: "Reminders", sub: "Appointments & reminders", icon: NotificationsActiveOutlined, key: "reminders", path: "/consultant/reminders" },
    { label: "Settings", sub: "Account & preferences", icon: SettingsOutlined, key: "settings", path: "/consultant/settings" }
  ];

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#FAF8FC" }}>
      {/* ================= SIDEBAR ================= */}
      <Box sx={{ width: 260, display: { xs: "none", lg: "flex" }, flexDirection: "column", background: "linear-gradient(180deg, #FFFFFF 0%, #FDF6FA 100%)", borderRight: "1px solid " + COLORS.cardBorder, p: 3, position: "sticky", top: 0, height: "100vh" }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 4, px: 0.5 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: "14px", background: COLORS.brandGradient, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(139,111,201,0.2)" }}>
            <Spa sx={{ color: "#fff", fontSize: 22 }} />
          </Box>
          <Box>
            <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 800, color: COLORS.primaryDark, lineHeight: 1.1 }}>Skin AI</Typography>
            <Typography sx={{ fontSize: 9.5, color: COLORS.textMuted, fontWeight: 700, letterSpacing: "1px" }}>CONSULTANT PORTAL</Typography>
          </Box>
        </Stack>

        <Stack spacing={0.5}>
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <Stack key={item.key} direction="row" alignItems="center" justifyContent="space-between" onClick={() => navigate(item.path)}
                sx={{ px: 2, py: 1.25, borderRadius: "12px", cursor: "pointer", background: isActive ? COLORS.brandGradient : "transparent",
                  boxShadow: isActive ? "0 6px 16px rgba(139,111,201,0.2)" : "none", "&:hover": { backgroundColor: isActive ? undefined : "rgba(139,111,201,0.04)" }, transition: "all 0.2s ease" }}>
                <Stack direction="row" alignItems="center" spacing={1.75}>
                  <Box sx={{ p: 0.75, borderRadius: "8px", backgroundColor: isActive ? "rgba(255,255,255,0.2)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon sx={{ fontSize: 20, color: isActive ? "#fff" : COLORS.primary }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 13, fontWeight: isActive ? 800 : 700, color: isActive ? "#fff" : COLORS.textDark }}>{item.label}</Typography>
                    <Typography sx={{ fontSize: 10, color: isActive ? "rgba(255,255,255,0.8)" : COLORS.textMuted }}>{item.sub}</Typography>
                  </Box>
                </Stack>
                {!!item.badge && (
                  <Box sx={{ minWidth: 20, height: 20, px: 0.5, borderRadius: "999px", backgroundColor: isActive ? "rgba(255,255,255,0.25)" : COLORS.danger, color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {item.badge}
                  </Box>
                )}
              </Stack>
            );
          })}
        </Stack>

        <Box sx={{ flexGrow: 1 }} />

        {/* LOGOUT */}
        <Stack direction="row" spacing={1.75} alignItems="center" onClick={handleLogout}
          sx={{ px: 2, py: 1.25, borderRadius: "12px", cursor: "pointer", color: COLORS.textMuted, "&:hover": { backgroundColor: "rgba(228,116,155,0.06)", color: COLORS.danger } }}>
          <LogoutOutlined sx={{ fontSize: 20 }} />
          <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>Logout</Typography>
        </Stack>
      </Box>

      {/* ================= MAIN CONTAINER ================= */}
      <Box sx={{ flex: 1, p: { xs: 2.5, sm: 4 }, overflow: "auto", display: "flex", flexDirection: "column" }}>
        
        {/* ================= TOP HEADER BAR ================= */}
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4, flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 800, color: COLORS.textDark }}>Welcome back, {consultantName.split(" ")[0]} 👋</Typography>
            <Typography sx={{ fontSize: 13, color: COLORS.textMuted }}>Here's what's happening with your assigned clients today.</Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Stack direction="row" spacing={2} alignItems="center">
            {/* Global Search Bar */}
            <Stack direction="row" alignItems="center" spacing={1} sx={{ backgroundColor: "#FFF", border: "1px solid " + COLORS.cardBorder, borderRadius: "999px", px: 2.5, py: 1, minWidth: 300, display: { xs: "none", md: "flex" } }}>
              <Search sx={{ fontSize: 18, color: COLORS.textFaint }} />
              <InputBase placeholder="Search clients, appointments, routines..." sx={{ fontSize: 13, flex: 1 }} />
            </Stack>
            <IconButton sx={{ backgroundColor: "#FFF", border: "1px solid " + COLORS.cardBorder, p: 1.25 }}>
              <Badge variant="dot" color="error">
                <NotificationsNone sx={{ fontSize: 20, color: COLORS.textMuted }} />
              </Badge>
            </IconButton>

            {/* Profile Dropdown */}
            <ProfileDropdown user={user} onLogout={handleLogout} />
          </Stack>
        </Stack>

        {/* ================= PAGE CONTENT ================= */}
        <Outlet />
      </Box>
    </Box>
  );
}
