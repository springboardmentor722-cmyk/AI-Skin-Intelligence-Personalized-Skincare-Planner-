import { useState, useEffect } from "react";
import { Box, Stack, Typography, Paper, InputBase, IconButton, Badge, Divider, Avatar, Button } from "@mui/material";
import {
  DashboardOutlined, PeopleAltOutlined, LocalPharmacyOutlined, FactCheckOutlined,
  AssessmentOutlined, PolicyOutlined, IntegrationInstructionsOutlined,
  SettingsOutlined, LogoutOutlined, NotificationsNone,
  Search, Spa, VerifiedUserOutlined
} from "@mui/icons-material";
import { COLORS, FONT_DISPLAY } from "../../theme/colors";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import ProfileDropdown from "../ProfileDropdown";
import { logout as apiLogout } from "../../api/auth";
import { getVerificationKpis } from "../../api/verifications";

export default function AdminLayout() {
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
  const adminName = user?.fullName || user?.full_name || user?.name || "Administrator";

  const handleLogout = () => {
    apiLogout();
    navigate("/login");
  };

  const pathParts = location.pathname.split("/").filter(Boolean);
  const activeTab = pathParts[1] || "dashboard";

  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    getVerificationKpis().then(data => {
      if (data?.pending_verification) {
        setPendingCount(data.pending_verification);
      }
    }).catch(e => console.error(e));
  }, []);

  const SIDEBAR_ITEMS = [
    { label: "Overview", icon: DashboardOutlined, key: "dashboard", path: "/admin/dashboard" },
    { label: "User Management", icon: PeopleAltOutlined, key: "users", path: "/admin/users" },
    { label: "Professional Verification", icon: VerifiedUserOutlined, key: "verifications", path: "/admin/verifications", badge: pendingCount },
    { label: "Product Catalog", icon: LocalPharmacyOutlined, key: "products", path: "/admin/products" },
    { label: "AI Engine Rules", icon: FactCheckOutlined, key: "rules", path: "/admin/rules" },
    { label: "Platform Analytics", icon: AssessmentOutlined, key: "analytics", path: "/admin/analytics" },
    { label: "Security & Policy", icon: PolicyOutlined, key: "security", path: "/admin/security" },
    { label: "API Integrations", icon: IntegrationInstructionsOutlined, key: "api", path: "/admin/api" },
    { label: "Settings", icon: SettingsOutlined, key: "settings", path: "/admin/settings" }
  ];

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#FAF8FC" }}>
      {/* ================= SIDEBAR ================= */}
      <Box sx={{ width: 260, display: { xs: "none", lg: "flex" }, flexDirection: "column", background: "linear-gradient(180deg, #FFFFFF 0%, #FDF6FA 100%)", borderRight: "1px solid " + COLORS.cardBorder, p: 3, position: "sticky", top: 0, height: "100vh" }}>
        
        {/* Logo */}
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 4, px: 0.5 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: "14px", background: "linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(26,26,46,0.2)" }}>
            <Spa sx={{ color: "#fff", fontSize: 22 }} />
          </Box>
          <Box>
            <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 800, color: COLORS.primaryDark, lineHeight: 1.1 }}>Skin AI</Typography>
            <Typography sx={{ fontSize: 9.5, color: COLORS.textMuted, fontWeight: 700, letterSpacing: "1px" }}>SYSTEM ADMIN</Typography>
          </Box>
        </Stack>

        <Stack spacing={0.5}>
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <Stack key={item.key} direction="row" alignItems="center" justifyContent="space-between" onClick={() => navigate(item.path)}
                sx={{ px: 2, py: 1.25, borderRadius: "12px", cursor: "pointer", background: isActive ? "rgba(26,26,46,0.9)" : "transparent",
                  boxShadow: isActive ? "0 6px 16px rgba(26,26,46,0.2)" : "none", "&:hover": { backgroundColor: isActive ? undefined : "rgba(26,26,46,0.04)" }, transition: "all 0.2s ease" }}>
                <Stack direction="row" alignItems="center" spacing={1.75}>
                  <Icon sx={{ fontSize: 20, color: isActive ? "#fff" : COLORS.textMuted }} />
                  <Typography sx={{ fontSize: 13.5, fontWeight: isActive ? 700 : 500, color: isActive ? "#fff" : COLORS.textMuted }}>{item.label}</Typography>
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
            <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 800, color: COLORS.textDark }}>System Administration 👋</Typography>
            <Typography sx={{ fontSize: 13, color: COLORS.textMuted }}>Manage platform users, catalog, and AI engine rules.</Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Stack direction="row" spacing={2} alignItems="center">
            {/* Global Search Bar */}
            <Stack direction="row" alignItems="center" spacing={1} sx={{ backgroundColor: "#FFF", border: "1px solid " + COLORS.cardBorder, borderRadius: "999px", px: 2.5, py: 1, minWidth: 300, display: { xs: "none", md: "flex" } }}>
              <Search sx={{ fontSize: 18, color: COLORS.textFaint }} />
              <InputBase placeholder="Search users, products, rules..." sx={{ fontSize: 13, flex: 1 }} />
            </Stack>
            <IconButton sx={{ backgroundColor: "#FFF", border: "1px solid " + COLORS.cardBorder, p: 1.25 }}>
              <Badge variant="dot" color="error">
                <NotificationsNone sx={{ fontSize: 20, color: COLORS.textMuted }} />
              </Badge>
            </IconButton>
            <ProfileDropdown user={user} onLogout={handleLogout} />
          </Stack>
        </Stack>

        {/* ================= PAGE CONTENT ================= */}
        <Outlet />
      </Box>
    </Box>
  );
}
