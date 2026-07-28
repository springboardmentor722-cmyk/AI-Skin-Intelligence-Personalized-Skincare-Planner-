import { Box, Button, Typography } from "@mui/material";
import { COLORS, FONT_DISPLAY } from "../theme/colors";
import { logout } from "../api/auth";

export default function DashboardPlaceholder({ onLogout }) {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const handleLogout = () => {
    logout();
    onLogout?.();
  };

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        background: COLORS.bgGradientRadial,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        px: 3,
        textAlign: "center",
      }}
    >
      <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 30, fontWeight: 600, color: COLORS.secondaryDark }}>
        Welcome{user?.full_name ? `, ${user.full_name}` : ""} 🎉
      </Typography>
      <Typography sx={{ color: COLORS.textMuted, mt: 1, mb: 4 }}>
        {user?.email} · role: {user?.role}
      </Typography>
      <Typography sx={{ color: COLORS.textFaint, mb: 4, fontSize: 14 }}>
        Dashboard pages are being built next.
      </Typography>
      <Button
        onClick={handleLogout}
        sx={{
          borderRadius: "999px",
          textTransform: "none",
          px: 4,
          py: 1.2,
          color: "#fff",
          background: COLORS.brandGradient,
        }}
      >
        Log Out
      </Button>
    </Box>
  );
}
