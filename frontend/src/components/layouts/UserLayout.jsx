import { useState } from "react";
import { Box, Stack, Typography, Paper, InputBase, IconButton, Badge, Button } from "@mui/material";
import {
  DashboardOutlined, FaceOutlined, ChecklistOutlined, ShoppingBagOutlined,
  DescriptionOutlined, BarChartOutlined, SettingsOutlined, LogoutOutlined, NotificationsNone,
  Search, Spa, PersonOutlineOutlined, CalendarToday, CenterFocusWeak, SmartToy, CloudUpload
} from "@mui/icons-material";
import { COLORS, FONT_DISPLAY } from "../../theme/colors";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import ProfileDropdown from "../ProfileDropdown";
import { logout as apiLogout } from "../../api/auth";

export default function UserLayout() {
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
  const fullName = user?.fullName || user?.full_name || user?.name || "Ananya Sharma";

  const handleLogout = () => {
    apiLogout();
    navigate("/login");
  };

  const pathParts = location.pathname.split("/").filter(Boolean);
  const activeTab = pathParts[1] || "dashboard";

  const SIDEBAR_ITEMS = [
    { label: "Dashboard", sub: "", icon: DashboardOutlined, key: "dashboard", path: "/user/dashboard" },
    { label: "My Skin Profile", sub: "View & update your profile", icon: PersonOutlineOutlined, key: "profile", path: "/user/profile" },
    { label: "Skin Assessment", sub: "Analyze your skin condition", icon: FaceOutlined, key: "assessment", path: "/user/assessment" },
    { label: "My Routine", sub: "Your personalized routine", icon: ChecklistOutlined, key: "daily-planner", path: "/user/daily-planner" },
    { label: "Product Recommendations", sub: "Products for your skin", icon: ShoppingBagOutlined, key: "products", path: "/user/products" },
    { label: "Ingredient Analyzer", sub: "Check ingredients & safety", icon: Search, key: "analyzer", path: "/user/analyzer" },
    { label: "Progress Tracking", sub: "Track your skin progress", icon: BarChartOutlined, key: "progress", path: "/user/progress" },
    { label: "Lifestyle & Habits", sub: "Sleep, water & lifestyle", icon: Spa, key: "lifestyle", path: "/user/lifestyle" },
    { label: "Reports", sub: "View & download reports", icon: DescriptionOutlined, key: "reports", path: "/user/reports" },
    { label: "Reminders", sub: "Routine & habit reminders", icon: NotificationsNone, key: "reminders", path: "/user/reminders" },
    { label: "Settings", sub: "Account & preferences", icon: SettingsOutlined, key: "settings", path: "/user/settings" }
  ];

  const QUICK_ACTIONS = [
    { label: "Skin Scan", sub: "Start new skin assessment", icon: CenterFocusWeak, path: "/user/assessment" },
    { label: "Ask AI", sub: "Get skincare guidance", icon: SmartToy, path: "/user/analyzer" },
    { label: "Upload Photo", sub: "Analyze your skin", icon: CloudUpload, path: "/user/assessment" }
  ];

  return (
    <Box sx={{ display: "flex", height: "100vh", width: "100vw", backgroundColor: "#F7F5FA", overflow: "hidden" }}>
      
      {/* ================= SIDEBAR (FIXED 270px) ================= */}
      <Box sx={{
        width: 270, flexShrink: 0, display: { xs: "none", lg: "flex" }, flexDirection: "column",
        backgroundColor: "#FFFFFF", borderRight: "1px solid " + COLORS.cardBorder,
        p: 2.5, height: "100vh", boxSizing: "border-box", zIndex: 110
      }}>
        
        {/* Logo */}
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3, px: 0.5, flexShrink: 0 }}>
          <Box sx={{ width: 42, height: 42, borderRadius: "14px", background: COLORS.brandGradient, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 16px rgba(139,111,201,0.25)" }}>
            <Spa sx={{ color: "#fff", fontSize: 24 }} />
          </Box>
          <Box>
            <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 17.5, fontWeight: 900, color: COLORS.primaryDark, lineHeight: 1.1 }}>Skin Intelligence</Typography>
            <Typography sx={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 700 }}>AI Skincare Companion</Typography>
          </Box>
        </Stack>

        {/* Scrollable menu */}
        <Box sx={{ flexGrow: 1, overflowY: "auto", pr: 0.5, "&::-webkit-scrollbar": { width: 4 }, "&::-webkit-scrollbar-thumb": { backgroundColor: "#EAE4F2", borderRadius: 4 } }}>
          
          <Typography sx={{ fontSize: 10, fontWeight: 800, color: COLORS.textFaint, textTransform: "uppercase", letterSpacing: "1px", mb: 1, ml: 1 }}>Main Menu</Typography>

          <Stack spacing={0.5} sx={{ mb: 2.5 }}>
            {SIDEBAR_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.key;
              return (
                <Stack 
                  key={item.key} 
                  direction="row" 
                  alignItems="center" 
                  spacing={1.5} 
                  onClick={() => navigate(item.path)}
                  sx={{ 
                    px: 1.75, 
                    py: item.sub ? 1 : 1.25, 
                    borderRadius: "12px", 
                    cursor: "pointer", 
                    background: isActive ? COLORS.brandGradient : "transparent",
                    boxShadow: isActive ? "0 6px 18px rgba(139,111,201,0.3)" : "none", 
                    "&:hover": { backgroundColor: isActive ? undefined : "rgba(139,111,201,0.05)" }, 
                    transition: "all 0.2s ease" 
                  }}
                >
                  <Icon sx={{ fontSize: 20, color: isActive ? "#fff" : COLORS.textMuted, flexShrink: 0 }} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: isActive ? 700 : 600, color: isActive ? "#fff" : COLORS.textDark, lineHeight: 1.2 }}>
                      {item.label}
                    </Typography>
                    {item.sub && (
                      <Typography sx={{ fontSize: 10, color: isActive ? "rgba(255,255,255,0.8)" : COLORS.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {item.sub}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              );
            })}
          </Stack>

          <Typography sx={{ fontSize: 10, fontWeight: 800, color: COLORS.textFaint, textTransform: "uppercase", letterSpacing: "1px", mb: 1, ml: 1 }}>Quick Actions</Typography>
          <Stack spacing={0.5} sx={{ mb: 2.5 }}>
            {QUICK_ACTIONS.map((action, idx) => {
              const Icon = action.icon;
              return (
                <Stack 
                  key={idx} 
                  direction="row" 
                  alignItems="center" 
                  spacing={1.5}
                  onClick={() => navigate(action.path)}
                  sx={{ px: 1.75, py: 1, borderRadius: "12px", cursor: "pointer", "&:hover": { backgroundColor: "rgba(139,111,201,0.05)" } }}
                >
                  <Icon sx={{ fontSize: 18, color: COLORS.primary }} />
                  <Box>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: COLORS.textDark, lineHeight: 1.1 }}>{action.label}</Typography>
                    <Typography sx={{ fontSize: 10, color: COLORS.textMuted }}>{action.sub}</Typography>
                  </Box>
                </Stack>
              );
            })}
          </Stack>

          {/* Upgrade Card */}
          <Paper sx={{ p: 2, borderRadius: "18px", border: "1px solid " + COLORS.cardBorder, background: "linear-gradient(135deg, #FDF7FA 0%, #F5ECF6 100%)", mb: 2, textAlign: "center" }}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: COLORS.textDark }}>Upgrade to Premium</Typography>
            <Typography sx={{ fontSize: 10, color: COLORS.textMuted, mt: 0.5, mb: 1.5 }}>Unlock AI insights, advanced reports & more.</Typography>
            <Button size="small" variant="contained" fullWidth sx={{ background: COLORS.brandGradient, textTransform: "none", fontSize: 11, fontWeight: 700, borderRadius: "99px", py: 0.75 }} onClick={() => alert("Premium features enabled.")}>Upgrade Now</Button>
          </Paper>

          {/* Logout */}
          <Stack direction="row" spacing={1.5} alignItems="center" onClick={handleLogout}
            sx={{ px: 2, py: 1, borderRadius: "12px", cursor: "pointer", color: COLORS.textMuted, "&:hover": { backgroundColor: "rgba(228,116,155,0.06)", color: COLORS.danger } }}>
            <LogoutOutlined sx={{ fontSize: 18 }} />
            <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Logout</Typography>
          </Stack>
        </Box>
      </Box>

      {/* ================= RIGHT COLUMN (HEADER + SCROLLABLE BODY) ================= */}
      <Box sx={{ flex: 1, minWidth: 0, height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        
        {/* FIXED SOLID HEADER BAR AT TOP */}
        <Box
          sx={{
            width: "100%",
            backgroundColor: "#FFFFFF",
            borderBottom: "1px solid " + COLORS.cardBorder,
            px: { xs: 2.5, sm: 4 },
            py: 1.75,
            flexShrink: 0,
            zIndex: 100,
            boxShadow: "0 4px 16px rgba(139,111,201,0.08)",
            boxSizing: "border-box"
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
            <Box>
              <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 900, color: COLORS.textDark, lineHeight: 1.1 }}>
                Welcome back, {fullName.split(" ")[0]}! 👋
              </Typography>
              <Typography sx={{ fontSize: 12, color: COLORS.textMuted, mt: 0.25 }}>
                AI Clinical Skincare Intelligence Center
              </Typography>
            </Box>

            <Stack direction="row" spacing={2} alignItems="center">
              {/* Notification Bell */}
              <IconButton sx={{ backgroundColor: "#FAF8FC", border: "1px solid " + COLORS.cardBorder, width: 40, height: 40 }}>
                <Badge badgeContent={3} color="error">
                  <NotificationsNone sx={{ fontSize: 20, color: COLORS.textMuted }} />
                </Badge>
              </IconButton>

              {/* Date Badge */}
              <Paper sx={{ px: 1.75, py: 0.75, borderRadius: "12px", border: "1px solid " + COLORS.cardBorder, display: "flex", alignItems: "center", gap: 1, backgroundColor: "#FAF8FC" }}>
                <CalendarToday sx={{ fontSize: 15, color: COLORS.primary }} />
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: COLORS.textDark }}>
                  {new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                </Typography>
              </Paper>

              {/* Profile Dropdown */}
              <ProfileDropdown user={user} onLogout={handleLogout} />
            </Stack>
          </Stack>
        </Box>

        {/* SCROLLABLE CONTENT BODY WITH CLEAN 32px TOP & BOTTOM PADDING */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            px: { xs: 2.5, sm: 4 },
            pt: 4,
            pb: 5,
            boxSizing: "border-box"
          }}
        >
          <Box sx={{ maxWidth: 1400, mx: "auto", width: "100%", boxSizing: "border-box" }}>
            <Outlet />
          </Box>
        </Box>

      </Box>
    </Box>
  );
}
