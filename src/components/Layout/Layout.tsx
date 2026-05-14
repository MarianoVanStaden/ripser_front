import React, { useState } from 'react';
import {
  Box,
  CssBaseline,
  Toolbar,
} from '@mui/material';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { TenantRequiredRoute } from '../Tenant';
import { useFinancialEvents } from '../../hooks/useFinancialEvents';
import RoleScopeGuard from './RoleScopeGuard';
//import { TenantDebugPanel } from '../Debug'; // Panel de debugging para desarrollo



const drawerWidth = 240;

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true); // Open by default on desktop

  // Single SSE connection for the entire authenticated session.
  useFinancialEvents();

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
          <RoleScopeGuard>
            <Outlet />
          </RoleScopeGuard>
        </TenantRequiredRoute>
      </Box>
      {/* Panel de debugging - Solo para desarrollo */}
      {/* {import.meta.env.DEV && <TenantDebugPanel />} */}
    </Box>
  );
};

export default Layout;