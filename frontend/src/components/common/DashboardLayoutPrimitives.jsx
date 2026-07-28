import React from "react";
import { Box, Stack, Typography, Paper, Grid, Breadcrumbs, Link, Chip } from "@mui/material";
import { motion } from "framer-motion";
import { COLORS, FONT_DISPLAY } from "../../theme/colors";

/**
 * Standard PageContainer wrapping page content with consistent animation & max-width
 */
export function PageContainer({ children, maxWidth = 1400 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Box
        sx={{
          maxWidth: maxWidth,
          mx: "auto",
          width: "100%",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: 3.5, // 28px/32px standard section gap
          pb: 4    // 32px bottom margin
        }}
      >
        {children}
      </Box>
    </motion.div>
  );
}

/**
 * Standard PageHeader with Breadcrumb, Title, Subtitle, and Optional Action Buttons
 */
export function PageHeader({
  badgeLabel = "AI Clinical Engine Active",
  title,
  subtitle,
  actionButton,
  extraBadges
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 3, sm: 3.5 },
        borderRadius: "26px",
        background: "linear-gradient(135deg, #FFFFFF 0%, #FAF4F8 50%, #F5ECF6 100%)",
        border: "1px solid " + COLORS.cardBorder,
        boxShadow: "0 8px 32px rgba(139,111,201,0.08)",
        boxSizing: "border-box"
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={2.5}
      >
        <Box sx={{ maxWidth: 750 }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" gap={0.75} sx={{ mb: 1.5 }}>
            <Chip
              label={badgeLabel}
              size="small"
              sx={{ backgroundColor: "rgba(139,111,201,0.12)", color: COLORS.primaryDark, fontWeight: 700, fontSize: 11 }}
            />
            {extraBadges}
          </Stack>

          <Typography
            sx={{
              fontFamily: FONT_DISPLAY,
              fontSize: { xs: 24, sm: 28 },
              fontWeight: 900,
              color: COLORS.textDark,
              lineHeight: 1.18
            }}
          >
            {title}
          </Typography>

          {subtitle && (
            <Typography sx={{ fontSize: 13.5, color: COLORS.textMuted, mt: 0.75, lineHeight: 1.4 }}>
              {subtitle}
            </Typography>
          )}
        </Box>

        {actionButton && (
          <Box sx={{ flexShrink: 0 }}>
            {actionButton}
          </Box>
        )}
      </Stack>
    </Paper>
  );
}

/**
 * Standard SectionContainer for grouping related cards/widgets
 */
export function SectionContainer({ children, title, subtitle, action, sx }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, sm: 3.5 },
        borderRadius: "24px",
        border: "1px solid " + COLORS.cardBorder,
        backgroundColor: "#FFFFFF",
        boxShadow: "0 6px 20px rgba(139,111,201,0.06)",
        boxSizing: "border-box",
        ...sx
      }}
    >
      {(title || action) && (
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
          <Box>
            {title && (
              <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 800, color: COLORS.textDark }}>
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography sx={{ fontSize: 12, color: COLORS.textMuted, mt: 0.25 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          {action}
        </Stack>
      )}
      {children}
    </Paper>
  );
}

/**
 * Standard CardGrid system enforcing 24px gaps and clean responsiveness
 */
export function CardGrid({ children, spacing = 3, columns = { xs: 12, sm: 6, md: 4, lg: 3 } }) {
  return (
    <Grid container spacing={spacing} sx={{ boxSizing: "border-box" }}>
      {React.Children.map(children, (child) => {
        if (!child) return null;
        return (
          <Grid item xs={columns.xs} sm={columns.sm} md={columns.md} lg={columns.lg}>
            {child}
          </Grid>
        );
      })}
    </Grid>
  );
}

/**
 * Standard Base Card with unified border-radius, shadows, and hover effects
 */
export function StandardCard({ children, sx, onClick, hoverable = true }) {
  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        p: 2.5,
        borderRadius: "20px",
        border: "1px solid " + COLORS.cardBorder,
        backgroundColor: "#FFFFFF",
        boxShadow: "0 4px 16px rgba(139,111,201,0.05)",
        boxSizing: "border-box",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        transition: "all 0.25s ease-in-out",
        cursor: onClick ? "pointer" : "default",
        "&:hover": hoverable
          ? {
              transform: "translateY(-4px)",
              boxShadow: "0 10px 28px rgba(139,111,201,0.12)",
              borderColor: COLORS.primary
            }
          : undefined,
        ...sx
      }}
    >
      {children}
    </Paper>
  );
}
