import React, { useState } from 'react';
import {
  Box,
  CssBaseline,
  Toolbar,
  Fab,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import ScrollToTopButton from './ScrollToTopButton';
import CommandPalette from './CommandPalette'; // Make sure this component exists
import { TenantRequiredRoute } from '../Tenant';
//import { TenantDebugPanel } from '../Debug'; // Panel de debugging para desarrollo



const Layout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const handleMobileToggle = () => {
    setMobileOpen(prev => !prev);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileToggle={handleMobileToggle}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1.5, sm: 2, md: 3 },
          pt: { xs: 2, sm: 2.5, md: 3 },
          width: { xs: '100%', md: `calc(100% - 240px)` },
          ml: { md: '24px' },
          minHeight: '100vh',
          boxSizing: 'border-box',
        }}
      >
        {/* Spacer for AppBar on mobile or Toolbar on desktop */}
        <Toolbar />
        <TenantRequiredRoute>
          <Outlet />
        </TenantRequiredRoute>
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
      {/* Panel de debugging - Solo para desarrollo */}
      {/* {import.meta.env.DEV && <TenantDebugPanel />} */}
    </Box>
  );
};

export default Layout;