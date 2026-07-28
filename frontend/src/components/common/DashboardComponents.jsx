import React from 'react';
import { Paper, Stack, Typography, Box } from '@mui/material';
import { COLORS, FONT_DISPLAY } from '../../theme/colors';

export const DashboardCard = ({ children, noPadding = false, sx = {}, ...props }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: '20px',
        border: `1px solid ${COLORS.cardBorder || '#F0E2ED'}`,
        backgroundColor: '#FFFFFF',
        boxShadow: '0 4px 16px rgba(139,111,201,0.06)',
        p: noPadding ? 0 : 3,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        boxSizing: 'border-box',
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
        '&:hover': {
          boxShadow: '0 8px 24px rgba(139,111,201,0.12)',
          borderColor: '#E4749B',
        },
        ...sx,
      }}
      {...props}
    >
      {children}
    </Paper>
  );
};

export const SectionHeader = ({ icon, title, action }) => {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1.5}>
        {icon && <Box sx={{ display: 'flex', color: '#372E45' }}>{icon}</Box>}
        <Typography
          sx={{
            fontFamily: FONT_DISPLAY || "'Playfair Display', Georgia, serif",
            fontSize: 15,
            fontWeight: 800,
            color: '#372E45',
          }}
        >
          {title}
        </Typography>
      </Stack>
      {action && <Box>{action}</Box>}
    </Stack>
  );
};
