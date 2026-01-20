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



const drawerWidth = 240;

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true); // Open by default on desktop
  const [paletteOpen, setPaletteOpen] = useState(false);

  const handleSidebarToggle = () => {
    setSidebarOpen(prev => !prev);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Sidebar
        open={sidebarOpen}
        onToggle={handleSidebarToggle}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1.5, sm: 2, md: 3 },
          pt: { xs: 2, sm: 2.5, md: 3 },
          width: { xs: '100%', md: sidebarOpen ? `calc(100% - ${drawerWidth}px)` : '100%' },
          ml: 0,
          transition: 'width 225ms cubic-bezier(0.4, 0, 0.6, 1)',
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