import React from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { TenantSelector } from './TenantSelector';

interface TenantRequiredRouteProps {
  children: React.ReactNode;
}

/**
 * A route wrapper that requires a tenant (empresa) to be selected before rendering children.
 * For SuperAdmin users who haven't selected a tenant yet, shows the TenantSelector.
 * For regular users, their tenant is typically set during login.
 */
export const TenantRequiredRoute: React.FC<TenantRequiredRouteProps> = ({ children }) => {
  const { empresaId, loading: tenantLoading } = useTenant();
  const { user, esSuperAdmin, loading: authLoading } = useAuth();

  // Still loading auth or tenant context
  if (authLoading || tenantLoading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <CircularProgress />
        <Typography color="text.secondary">Cargando contexto...</Typography>
      </Box>
    );
  }

  // No user = should be handled by PrivateRoute, but just in case
  if (!user) {
    return null;
  }

  // If empresaId is set, render children normally
  if (empresaId) {
    return <>{children}</>;
  }

  // No empresaId - need to select a tenant
  // This is typical for SuperAdmin users who need to choose which empresa to work with
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
        p: 3,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 600,
          width: '100%',
          textAlign: 'center',
        }}
      >
        <BusinessIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Seleccionar Empresa
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {esSuperAdmin 
            ? 'Como Super Administrador, debes seleccionar una empresa para continuar.'
            : 'Selecciona una empresa para acceder al sistema.'}
        </Typography>

        <Box sx={{ mt: 2 }}>
          <TenantSelector />
        </Box>
      </Paper>
    </Box>
  );
};

export default TenantRequiredRoute;
