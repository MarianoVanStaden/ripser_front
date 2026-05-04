// FRONT-003: extracted from DeliveriesPage.tsx — wrapper over MUI
// useMediaQuery con tres breakpoints (mobile/tablet/desktop).
import { useMediaQuery, useTheme } from '@mui/material';

export const useResponsive = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  return { isMobile, isTablet, isDesktop };
};
