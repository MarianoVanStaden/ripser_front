import React, { useState } from 'react';
import {
  Box,
  CssBaseline,
  Toolbar,
  useTheme,
  useMediaQuery,
  Fab,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import ScrollToTopButton from './ScrollToTopButton';
import CommandPalette from './CommandPalette'; // Make sure this component exists



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

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Sidebar 
        open={mobileOpen}
        onClose={handleDrawerToggle}
        onNavigate={handleNavigation}
      />
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3 }}
      >
        <Toolbar />
        <Outlet />
      </Box>
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