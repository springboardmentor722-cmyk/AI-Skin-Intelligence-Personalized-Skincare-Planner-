import { Box, Stack, Typography, Button } from "@mui/material";
import { HourglassTopRounded, LogoutRounded, MailOutlineRounded } from "@mui/icons-material";
import { COLORS, FONT_DISPLAY } from "../theme/colors";

// status: "pending" | "rejected"
// role: "consultant" | "dermatologist" — just changes the copy shown
export default function PendingApprovalPage({ status = "pending", role = "consultant", onLogout }) {
  const isRejected = status === "rejected";
  const roleLabel = role === "dermatologist" ? "Dermatologist" : "Skincare Consultant";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #F8F5FD 0%, #FCF4F8 55%, #F5F7FD 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
      }}
    >
      <Box
        sx={{
          maxWidth: 460,
          width: "100%",
          backgroundColor: "#FFFFFF",
          borderRadius: "28px",
          border: "1px solid " + COLORS.cardBorder,
          boxShadow: "0 24px 60px rgba(139,111,201,0.12)",
          p: { xs: 3.5, sm: 5 },
          textAlign: "center",
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            mx: "auto",
            mb: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: isRejected ? "#FDF1F5" : "rgba(139,111,201,0.10)",
          }}
        >
          <HourglassTopRounded sx={{ fontSize: 30, color: isRejected ? COLORS.danger || "#E4749B" : COLORS.primary }} />
        </Box>

        <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 800, color: COLORS.textDark, mb: 1 }}>
          {isRejected ? "Application Not Approved" : `${roleLabel} Application Under Review`}
        </Typography>

        <Typography sx={{ fontSize: 14, color: COLORS.textMuted, mb: 3, lineHeight: 1.6 }}>
          {isRejected
            ? "Unfortunately your application wasn't approved this time. You can reach out to our support team for details on what to correct and resubmit."
            : `Thanks for applying! Our admin team is reviewing your qualifications and documents. This usually takes 1–2 business days. You'll get an email as soon as a decision is made.`}
        </Typography>

        <Stack spacing={1.5}>
          <Button
            startIcon={<MailOutlineRounded sx={{ fontSize: 18 }} />}
            fullWidth
            sx={{
              textTransform: "none",
              borderRadius: "14px",
              fontWeight: 700,
              fontSize: 13.5,
              py: 1.25,
              color: "#fff",
              background: COLORS.brandGradient,
              boxShadow: "0 8px 20px rgba(139,111,201,0.3)",
            }}
            href="mailto:support@skinai.com"
          >
            Contact Support
          </Button>
          <Button
            startIcon={<LogoutRounded sx={{ fontSize: 18 }} />}
            fullWidth
            onClick={onLogout}
            sx={{
              textTransform: "none",
              borderRadius: "14px",
              fontWeight: 600,
              fontSize: 13.5,
              py: 1.25,
              color: COLORS.textMuted,
              border: "1.5px solid " + COLORS.cardBorder,
            }}
          >
            Log Out
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}