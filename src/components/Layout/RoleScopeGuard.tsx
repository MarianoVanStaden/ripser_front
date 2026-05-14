import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { useAuth } from '../../context/AuthContext';
import { usePermisos } from '../../hooks/usePermisos';

interface Props {
  children: React.ReactNode;
}

// Roles operativos restringidos a un sub-conjunto del sistema. Cada uno tiene
// una "home" propia y una allowlist de prefijos de path que sí puede tocar.
// Si entra manualmente a una URL fuera de su scope, lo mandamos al landing
// del rol (no a la pantalla de "acceso denegado") — es UX más suave para
// usuarios que vienen de un bookmark viejo o un link compartido.
type RestrictedRole = {
  rol: 'RECURSOS_HUMANOS' | 'COBRANZAS' | 'TRANSPORTE' | 'TALLER';
  home: string;
  // Prefijos permitidos. Se chequea con startsWith para cubrir sub-rutas
  // (ej. /rrhh/empleados/123/editar).
  allowedPrefixes: string[];
};

const RESTRICTED_ROLES: RestrictedRole[] = [
  {
    rol: 'RECURSOS_HUMANOS',
    home: '/rrhh/dashboard',
    allowedPrefixes: ['/rrhh'],
  },
];

const AccessDenied: React.FC<{ home: string }> = ({ home }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '60vh',
      gap: 2,
      px: 2,
      textAlign: 'center',
    }}
  >
    <LockIcon sx={{ fontSize: 80, color: 'error.main' }} />
    <Typography variant="h4" color="error">
      Acceso denegado
    </Typography>
    <Typography variant="body1" color="text.secondary" maxWidth={420}>
      Tu rol no tiene permisos para acceder a esta sección.
    </Typography>
    <Button variant="contained" href={home}>
      Ir a mi inicio
    </Button>
  </Box>
);

const RoleScopeGuard: React.FC<Props> = ({ children }) => {
  const { esSuperAdmin } = useAuth();
  const { tieneRol } = usePermisos();
  const location = useLocation();

  // Los administradores no están limitados por scope.
  if (esSuperAdmin || tieneRol('ADMIN')) {
    return <>{children}</>;
  }

  const restricted = RESTRICTED_ROLES.find(r => tieneRol(r.rol));
  if (!restricted) return <>{children}</>;

  const path = location.pathname;
  const dentroDeScope = restricted.allowedPrefixes.some(
    prefix => path === prefix || path.startsWith(prefix + '/'),
  );

  // Aterrizaje en "/" (DashboardEntry ya redirige roles conocidos; este guard
  // cubre cualquier path) o cualquier ruta fuera de scope → mandar al home
  // del rol con Navigate (preserva el historial limpio).
  if (path === '/') {
    return <Navigate to={restricted.home} replace />;
  }

  if (!dentroDeScope) {
    // Si el usuario llegó por click en algo del sidebar mal filtrado, lo
    // mandamos al home. Si llegó tipeando una URL ajena (ej. /admin/users),
    // mostramos el cartel de acceso denegado para que entienda el motivo.
    return <AccessDenied home={restricted.home} />;
  }

  return <>{children}</>;
};

export default RoleScopeGuard;
