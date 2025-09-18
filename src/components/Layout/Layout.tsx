import React, { useState } from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import ScrollToTopButton from './ScrollToTopButton';

const Layout: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Sidebar />
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3 }}
      >
        <Toolbar />
        <Outlet />
      </LayoutWrapper>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <Fab
        color="primary"
        aria-label="Abrir paleta de comandos"
        sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 1300 }}
        onClick={() => setPaletteOpen(true)}
      >
        <SearchIcon />
      </Fab>
      <ScrollToTopButton />
    </Box>
  );
};

export default Layout;
