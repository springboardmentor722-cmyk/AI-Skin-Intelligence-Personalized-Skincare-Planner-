// Shared design tokens for the Skin AI app — purple-pink "Intelligence for Healthy Skin" palette.

export const COLORS = {
  // Backgrounds
  bgGradient: "linear-gradient(180deg, #F7E9F3 0%, #FCEFF5 45%, #FFFFFF 100%)",
  bgGradientRadial:
    "radial-gradient(circle at 50% 15%, #F5E4F0 0%, #FCEFF5 55%, #FFFFFF 100%)",

  // Primary (pink)
  primary: "#E4749B",
  primaryDark: "#C85A80",
  primaryLight: "#F5C7DA",

  // Secondary (purple)
  secondary: "#8B6FC9",
  secondaryDark: "#6F52AE",
  secondaryLight: "#D9CCF0",

  // Signature gradient — used for primary buttons, logo mark, active states
  brandGradient: "linear-gradient(135deg, #8B6FC9 0%, #B571B8 50%, #E4749B 100%)",

  // Role accent colors (Role Selection screen + dashboards)
  roleUser: { bg: "#FCE4ED", icon: "#E4749B" },
  roleConsultant: { bg: "#E1F5E8", icon: "#4CAF7D" },
  roleDermatologist: { bg: "#EDE6FA", icon: "#8B6FC9" },
  roleAdmin: { bg: "#FDEEDD", icon: "#E0A54C" },

  // Text
  textDark: "#372E45",
  textMuted: "#8B7F97",
  textFaint: "#B8AFC4",

  // Structure
  cardBorder: "#F0E2ED",
  inputBg: "#FBF9FC",
  white: "#FFFFFF",

  // Feedback
  danger: "#C0392B",
  success: "#4CAF7D",
};

export const FONT_DISPLAY = "'Playfair Display', Georgia, serif";