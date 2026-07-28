import { keyframes } from "@emotion/react";
import { Box, Container, Stack, Typography } from "@mui/material";
import { ChevronRight as ChevronRightIcon } from "@mui/icons-material";
import { Person as PersonIcon } from "@mui/icons-material";
import { Spa as SpaIcon } from "@mui/icons-material";
import { MedicalServicesOutlined as MedicalServicesOutlinedIcon } from "@mui/icons-material";
import { AdminPanelSettingsOutlined as AdminPanelSettingsOutlinedIcon } from "@mui/icons-material";
import { COLORS, FONT_DISPLAY } from "../theme/colors";

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
`;

const ROLES = [
  {
    value: "user",
    label: "User",
    description: "Manage your skin, routines and get AI-powered recommendations.",
    icon: PersonIcon,
    palette: COLORS.roleUser,
  },
  {
    value: "consultant",
    label: "Consultant",
    description: "Guide users with personalized skincare advice and routines.",
    icon: SpaIcon,
    palette: COLORS.roleConsultant,
  },
  {
    value: "dermatologist",
    label: "Dermatologist",
    description: "Analyze skin conditions and provide expert recommendations.",
    icon: MedicalServicesOutlinedIcon,
    palette: COLORS.roleDermatologist,
  },
  {
    value: "admin",
    label: "Admin",
    description: "Manage platform, users and system settings.",
    icon: AdminPanelSettingsOutlinedIcon,
    palette: COLORS.roleAdmin,
  },
];

function RoleRow({ role, onSelect, delay }) {
  const Icon = role.icon;
  return (
    <Box
      onClick={() => onSelect(role.value)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onSelect(role.value)}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        p: 2,
        borderRadius: "18px",
        border: `1px solid ${COLORS.cardBorder}`,
        backgroundColor: "#FFFFFF",
        cursor: "pointer",
        transition: "all 0.18s ease",
        animation: `${fadeInUp} 0.5s ease ${delay}s both`,
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 12px 28px rgba(139, 111, 201, 0.16)",
          borderColor: role.palette.icon,
        },
      }}
    >
      <Box
        sx={{
          width: 52,
          height: 52,
          borderRadius: "16px",
          backgroundColor: role.palette.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon sx={{ color: role.palette.icon, fontSize: 26 }} />
      </Box>
      <Box sx={{ flex: 1, textAlign: "left" }}>
        <Typography sx={{ fontSize: 15.5, fontWeight: 600, color: COLORS.textDark }}>
          {role.label}
        </Typography>
        <Typography sx={{ fontSize: 12.5, color: COLORS.textMuted, lineHeight: 1.4, mt: 0.25 }}>
          {role.description}
        </Typography>
      </Box>
      <ChevronRightIcon sx={{ color: COLORS.textFaint }} />
    </Box>
  );
}

export default function RoleSelectionPage({ onSelectRole, onBack }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: COLORS.bgGradientRadial,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: { xs: 4, sm: 6 },
        px: 2,
      }}
    >
      <Container maxWidth="xs" disableGutters>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.25}
          sx={{ mb: 3, animation: `${fadeInUp} 0.5s ease both` }}
        >
          <svg width="40" height="40" viewBox="0 0 64 64" fill="none">
            <defs>
              <linearGradient id="roleLeafGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={COLORS.secondary} />
                <stop offset="100%" stopColor={COLORS.primary} />
              </linearGradient>
            </defs>
            <path
              d="M32 6C20 10 12 22 12 34c0 10 8 18 18 18 12 0 22-10 22-24 0-8-4-16-10-20-2 6-6 10-10 12 4-6 4-10 0-14z"
              fill="url(#roleLeafGrad)"
              fillOpacity="0.9"
            />
          </svg>
          <Box sx={{ textAlign: "left" }}>
            <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 600, color: COLORS.secondaryDark, lineHeight: 1.1 }}>
              Skin AI
            </Typography>
            <Typography sx={{ color: COLORS.textMuted, fontSize: 11 }}>
              Intelligence for Healthy Skin
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ mb: 3, animation: `${fadeInUp} 0.5s ease 0.05s both` }}>
          <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 600, color: COLORS.textDark }}>
            Select Your Role
          </Typography>
          <Typography sx={{ color: COLORS.textMuted, fontSize: 14, mt: 0.5 }}>
            Choose the role that best describes you to access your personalized dashboard.
          </Typography>
        </Box>

        <Stack spacing={1.5}>
          {ROLES.map((role, i) => (
            <RoleRow key={role.value} role={role} onSelect={onSelectRole} delay={0.1 + i * 0.07} />
          ))}
        </Stack>

        {onBack && (
          <Typography
            component="button"
            type="button"
            onClick={onBack}
            sx={{
              display: "block",
              mx: "auto",
              mt: 3,
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              color: COLORS.textMuted,
              textDecoration: "underline",
            }}
          >
            Back to login
          </Typography>
        )}
      </Container>
    </Box>
  );
}