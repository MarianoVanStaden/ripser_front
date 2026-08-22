import React, { useState } from 'react';
import {
  Box,
  CssBaseline,
  Toolbar,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import FieldBottomNav, { useHasFieldNav } from './FieldBottomNav';
import { TenantRequiredRoute } from '../Tenant';
import { useFinancialEvents } from '../../hooks/useFinancialEvents';
import RoleScopeGuard from './RoleScopeGuard';
import { useSidebar } from '../../context/useSidebar';
import { SIDEBAR_WIDTH_FULL, SIDEBAR_WIDTH_MINI } from './sidebarConstants';
//import { TenantDebugPanel } from '../Debug'; // Panel de debugging para desarrollo



const Layout: React.FC = () => {
  const theme = useTheme();
  // En mobile el drawer es temporary (overlay): arrancar abierto taparía el
  // contenido en el primer paint. Mismo breakpoint (md) que usa Sidebar.
  // noSsr: sin él, el primer render devuelve false y el useState inicial
  // quedaría en true también en mobile (app CSR pura, no hay hidratación).
  const isMobile = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true });
  const [sidebarOpen, setSidebarOpen] = useState(() => !isMobile); // Open by default on desktop
  const { mini } = useSidebar();
  const hasFieldNav = useHasFieldNav();
  const drawerWidth = mini ? SIDEBAR_WIDTH_MINI : SIDEBAR_WIDTH_FULL;

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
          // Reserva para la bottom nav de campo (56px + safe area).
          pb: hasFieldNav ? 'calc(56px + env(safe-area-inset-bottom))' : undefined,
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
      <FieldBottomNav />
      {/* Panel de debugging - Solo para desarrollo */}
      {/* {import.meta.env.DEV && <TenantDebugPanel />} */}
    </Box>
  );
};

export default Layout;