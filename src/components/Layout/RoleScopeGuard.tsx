import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
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

  // Cualquier ruta fuera de scope (incluido "/") → redirect al home del rol.
  // Sin pantalla de "acceso denegado": para estos usuarios todo lo que existe
  // es su módulo, así que aterrizar siempre en su dashboard es la UX correcta.
  if (!dentroDeScope) {
    return <Navigate to={restricted.home} replace />;
  }

  return <>{children}</>;
};

export default RoleScopeGuard;
