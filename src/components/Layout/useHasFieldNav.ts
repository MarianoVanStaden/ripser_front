// Separado de FieldBottomNav.tsx para que ese archivo exporte solo el
// componente (react-refresh/only-export-components).
import { useMediaQuery, useTheme } from '@mui/material';
import { useAuth } from '../../context/AuthContext';

export const TRANSPORTE_ROLES = ['TRANSPORTE', 'LOGISTICO', 'COORDINADORA_LOGISTICA', 'CONDUCTOR'];

/** true si estos roles tienen bottom nav de campo (transporte o post-venta). */
export const rolesConFieldNav = (roles: string[]): boolean =>
  roles.some((r) => TRANSPORTE_ROLES.includes(r)) || roles.includes('POST_VENTA');

/**
 * true si este usuario/viewport muestra la bottom nav de campo — el Layout
 * lo usa para reservar el padding inferior del contenido.
 */
export const useHasFieldNav = (): boolean => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, esSuperAdmin } = useAuth();
  if (!isMobile || esSuperAdmin) return false;
  const roles = user?.roles ?? [];
  // Admin-like navega todo el ERP: la bottom nav de 4 destinos le queda corta.
  if (roles.includes('ADMIN')) return false;
  return rolesConFieldNav(roles);
};
