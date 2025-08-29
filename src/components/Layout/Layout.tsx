import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
  Fab,
} from '@mui/material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import LayoutWrapper from './LayoutWrapper';
import CommandPalette from './CommandPalette';
import SearchIcon from '@mui/icons-material/Search';
import ScrollToTopButton from './ScrollToTopButton';

const Layout: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Sidebar />
      <LayoutWrapper>
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
