import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePermisos } from '../../hooks/usePermisos';
import type { TipoRol, Modulo } from '../../types';
import { Box, Typography, Button } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredModulo?: Modulo;
  requiredRoles?: TipoRol[];
  redirectTo?: string;
}

/**
 * Componente que protege rutas basándose en permisos de módulos o roles específicos
 *
 * Uso:
 * <ProtectedRoute requiredModulo="VENTAS">
 *   <VentasPage />
 * </ProtectedRoute>
 *
 * O con roles específicos:
 * <ProtectedRoute requiredRoles={['ADMIN', 'OFICINA']}>
 *   <AdminPage />
 * </ProtectedRoute>
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredModulo,
  requiredRoles,
  redirectTo = '/login',
}) => {
  const { user, loading } = useAuth();
  const { tienePermiso, tieneRol } = usePermisos();

  // Mostrar loading mientras se valida la autenticación
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <Typography>Cargando...</Typography>
      </Box>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  // Verificar permisos de módulo
  if (requiredModulo && !tienePermiso(requiredModulo)) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          gap: 2,
        }}
      >
        <LockIcon sx={{ fontSize: 80, color: 'error.main' }} />
        <Typography variant="h4" color="error">
          Acceso Denegado
        </Typography>
        <Typography variant="body1" color="text.secondary">
          No tienes permisos para acceder a este módulo.
        </Typography>
        <Button variant="contained" href="/">
          Volver al Dashboard
        </Button>
      </Box>
    );
  }

  // Verificar roles específicos
  if (requiredRoles && requiredRoles.length > 0 && !tieneRol(...requiredRoles)) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          gap: 2,
        }}
      >
        <LockIcon sx={{ fontSize: 80, color: 'error.main' }} />
        <Typography variant="h4" color="error">
          Acceso Denegado
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Tu rol no tiene permisos para acceder a esta página.
        </Typography>
        <Button variant="contained" href="/">
          Volver al Dashboard
        </Button>
      </Box>
    );
  }

  // Si pasa todas las validaciones, renderizar el contenido
  return <>{children}</>;
};

export default ProtectedRoute;
