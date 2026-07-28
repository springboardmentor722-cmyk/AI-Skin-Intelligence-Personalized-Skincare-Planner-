import { useState } from "react";
import { Box, Stack, Typography, Paper, InputBase, IconButton, Badge, Avatar } from "@mui/material";
import {
  HomeOutlined, PersonOutlineOutlined, CalendarTodayOutlined, AutoAwesomeOutlined,
  DescriptionOutlined, VaccinesOutlined, BarChartOutlined, ChatBubbleOutlineOutlined,
  SettingsOutlined, KeyboardArrowDownOutlined, NotificationsNone, Search, Spa,
  LogoutOutlined, ArrowForwardIosOutlined, PhotoCamera
} from "@mui/icons-material";
import { COLORS, FONT_DISPLAY } from "../../theme/colors";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import ProfileDropdown from "../ProfileDropdown";
import { logout as apiLogout } from "../../api/auth";

export default function ExpertLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const getCurrentUser = () => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "null");
      const p = JSON.parse(localStorage.getItem("userProfile") || "null");
      return { ...u, ...p };
    } catch (e) {
      return null;
    }
  };

  const user = getCurrentUser();
  const doctorName = user?.fullName || user?.full_name || user?.name || "dermo";
  const initials = doctorName.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();

  const [profilePhoto, setProfilePhoto] = useState(user?.profile_photo || user?.profilePhoto || "");

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        setProfilePhoto(base64);
        try {
          const u = JSON.parse(localStorage.getItem("user") || "{}");
          const p = JSON.parse(localStorage.getItem("userProfile") || "{}");
          localStorage.setItem("user", JSON.stringify({ ...u, profile_photo: base64 }));
          localStorage.setItem("userProfile", JSON.stringify({ ...p, profile_photo: base64 }));
        } catch (err) {
          console.error(err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = () => {
    apiLogout();
    navigate("/login");
  };

  const pathParts = location.pathname.split("/").filter(Boolean);
  const activeTab = pathParts[1] || "dashboard";

  const SIDEBAR_ITEMS = [
    { label: "Home", icon: HomeOutlined, key: "dashboard", path: "/expert/dashboard" },
    { label: "Patients", icon: PersonOutlineOutlined, key: "patients", path: "/expert/patients" },
    { label: "Appointments", icon: CalendarTodayOutlined, key: "consultations", path: "/expert/consultations" },
    { label: "AI Reviews", icon: AutoAwesomeOutlined, key: "assessments", path: "/expert/assessments" },
    { label: "Reports", icon: DescriptionOutlined, key: "reports", path: "/expert/reports" },
    { label: "Treatments", icon: VaccinesOutlined, key: "treatments", path: "/expert/treatments" },
    { label: "Analytics", icon: BarChartOutlined, key: "insights", path: "/expert/insights" },
    { label: "Messages", icon: ChatBubbleOutlineOutlined, key: "messages", badge: 3, path: "/expert/messages" },
    { label: "Settings", icon: SettingsOutlined, key: "settings", path: "/expert/settings" }
  ];

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#FAF8FC" }}>
      {/* ================= SIDEBAR ================= */}
      <Box
        sx={{
          width: 270,
          display: { xs: "none", lg: "flex" },
          flexDirection: "column",
          backgroundColor: "#FFFFFF",
          borderRight: "1px solid rgba(230, 215, 235, 0.6)",
          px: 2.5,
          py: 3,
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
          justifySpace: "between"
        }}
      >
        {/* 1. Logo Section */}
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 4, px: 1 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              border: "2px solid #F5D3E5",
              display: "flex",
              alignItems: "center",
              justify: "center",
              background: "linear-gradient(135deg, #FFF0F6 0%, #F5EEF9 100%)",
              boxShadow: "0 4px 12px rgba(228, 116, 155, 0.15)"
            }}
          >
            <Spa sx={{ color: "#E4749B", fontSize: 24 }} />
          </Box>
          <Box>
            <Typography
              sx={{
                fontSize: 22,
                fontWeight: 800,
                color: "#E4749B",
                lineHeight: 1.1,
                fontFamily: "'Playfair Display', Georgia, serif"
              }}
            >
              Skin AI
            </Typography>
            <Typography
              sx={{
                fontSize: 9.5,
                color: "#A08C9E",
                fontWeight: 700,
                letterSpacing: "1.2px",
                textTransform: "uppercase",
                mt: 0.25
              }}
            >
              EXPERT PORTAL
            </Typography>
          </Box>
        </Stack>

        {/* 2. Menu Navigation Items */}
        <Stack spacing={0.75} sx={{ mb: 4 }}>
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <Stack
                key={item.key}
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                onClick={() => navigate(item.path)}
                sx={{
                  px: 2.25,
                  py: 1.35,
                  borderRadius: "14px",
                  cursor: "pointer",
                  backgroundColor: isActive ? "#F7F0FA" : "transparent",
                  color: isActive ? "#E4749B" : "#5A6A85",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: isActive ? "#F7F0FA" : "rgba(247, 240, 250, 0.5)",
                    color: "#E4749B"
                  }
                }}
              >
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Icon sx={{ fontSize: 21, color: isActive ? "#E4749B" : "#A0AEC0" }} />
                  <Typography
                    sx={{
                      fontSize: 14,
                      fontWeight: isActive ? 800 : 600,
                      color: isActive ? "#E4749B" : "#4A5568"
                    }}
                  >
                    {item.label}
                  </Typography>
                </Stack>
                {!!item.badge && (
                  <Box
                    sx={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      backgroundColor: "#E4749B",
                      color: "#FFFFFF",
                      fontSize: 11,
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justify: "center",
                      boxShadow: "0 2px 6px rgba(228, 116, 155, 0.3)"
                    }}
                  >
                    {item.badge}
                  </Box>
                )}
              </Stack>
            );
          })}
        </Stack>

        <Box sx={{ flexGrow: 1 }} />

        {/* 3. Bottom Card with Botanical Decoration & AI Assistant */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: "20px",
            border: "1px solid rgba(230, 215, 235, 0.6)",
            backgroundColor: "#FFFFFF",
            boxShadow: "0 8px 24px rgba(139, 111, 201, 0.08)",
            position: "relative",
            overflow: "hidden"
          }}
        >
          {/* Doctor Info Row */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box sx={{ position: "relative" }}>
                <Avatar
                  src={profilePhoto}
                  sx={{
                    width: 42, height: 42, border: "2px solid #F7F0FA",
                    background: "linear-gradient(135deg, #7C5CFC, #E4749B)",
                    fontSize: 14, fontWeight: 900, color: "#fff"
                  }}
                >
                  {initials}
                </Avatar>
                <IconButton
                  component="label"
                  size="small"
                  sx={{
                    position: "absolute", bottom: -4, right: -4,
                    width: 20, height: 20,
                    backgroundColor: "#7C5CFC", color: "#FFF",
                    border: "2px solid #FFF",
                    "&:hover": { backgroundColor: "#6344E0" }
                  }}
                >
                  <PhotoCamera sx={{ fontSize: 10 }} />
                  <input type="file" accept="image/*" hidden onChange={handlePhotoUpload} />
                </IconButton>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 800, color: "#2D3748" }}>
                  {doctorName.startsWith("Dr.") ? doctorName : `Dr. ${doctorName}`}
                </Typography>
                <Typography sx={{ fontSize: 11, color: "#718096", fontWeight: 600 }}>
                  Dermatologist
                </Typography>
              </Box>
            </Stack>
            <IconButton size="small" onClick={handleLogout} title="Logout">
              <KeyboardArrowDownOutlined sx={{ fontSize: 18, color: "#A0AEC0" }} />
            </IconButton>
          </Stack>

          {/* AI Assistant Banner */}
          <Box
            onClick={() => navigate("/expert/insights")}
            sx={{
              p: 1.75,
              borderRadius: "14px",
              background: "linear-gradient(135deg, #8B6FC9 0%, #E4749B 100%)",
              color: "#FFFFFF",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(228, 116, 155, 0.25)",
              transition: "transform 0.2s ease, boxShadow 0.2s ease",
              "&:hover": {
                transform: "translateY(-1px)",
                boxShadow: "0 6px 18px rgba(228, 116, 155, 0.35)"
              }
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
              <AutoAwesomeOutlined sx={{ fontSize: 16, color: "#FFF" }} />
              <Typography sx={{ fontSize: 12, fontWeight: 800 }}>AI Assistant</Typography>
            </Stack>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography sx={{ fontSize: 10.5, opacity: 0.9, fontWeight: 500 }}>
                Ask anything about skin analysis.
              </Typography>
              <ArrowForwardIosOutlined sx={{ fontSize: 10, color: "#FFF" }} />
            </Stack>
          </Box>
        </Paper>
      </Box>

      {/* ================= MAIN CONTAINER ================= */}
      <Box sx={{ flex: 1, p: { xs: 2.5, sm: 4 }, overflow: "auto", display: "flex", flexDirection: "column" }}>
        
        {/* TOP HEADER BAR */}
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4, flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 800, color: COLORS.textDark }}>
              Welcome back, Dr. {doctorName.replace("Dr. ", "").split(" ")[0]} 👋
            </Typography>
            <Typography sx={{ fontSize: 13, color: COLORS.textMuted }}>
              Here's an overview of your patients and clinical insights.
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Stack direction="row" spacing={2} alignItems="center">
            {/* Global Search Bar */}
            <Stack direction="row" alignItems="center" spacing={1} sx={{ backgroundColor: "#FFF", border: "1px solid " + COLORS.cardBorder, borderRadius: "999px", px: 2.5, py: 1, minWidth: 300, display: { xs: "none", md: "flex" } }}>
              <Search sx={{ fontSize: 18, color: COLORS.textFaint }} />
              <InputBase placeholder="Search patients, assessments, reports..." sx={{ fontSize: 13, flex: 1 }} />
            </Stack>
            <IconButton sx={{ backgroundColor: "#FFF", border: "1px solid " + COLORS.cardBorder, p: 1.25 }}>
              <Badge variant="dot" color="error">
                <NotificationsNone sx={{ fontSize: 20, color: COLORS.textMuted }} />
              </Badge>
            </IconButton>
            <ProfileDropdown user={user} onLogout={handleLogout} />
          </Stack>
        </Stack>

        {/* PAGE CONTENT */}
        <Outlet />
      </Box>
    </Box>
  );
}
