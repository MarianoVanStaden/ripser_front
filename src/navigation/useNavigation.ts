import { useMemo } from 'react';
import { usePermisos } from '../hooks/usePermisos';
import { useAuth } from '../context/AuthContext';
import { navigation } from './navConfig';
import type { NavModule } from './navConfig.types';
import {
  superAdminOnlyPaths,
  platformOwnerOnlyPaths,
  vendedorDeniedPaths,
  cobranzasAllowedPaths,
  supervisorAllowedPaths,
  transporteAllowedPaths,
  conductorAllowedPaths,
  tallerAllowedPaths,
  rrhhAllowedPaths,
  adminEmpresaLimitadoDeniedPaths,
  coordinadoraComprasAllowedPaths,
  coordinadoraLogisticaAllowedPaths,
  logisticoAllowedPaths,
  postVentaAllowedPaths,
} from './navAccess';

/**
 * Calcula las secciones del sidebar visibles para el usuario actual.
 *
 * Reproduce 1:1 el filtrado que antes vivía inline en `Sidebar.tsx`:
 *  1. Filtra ítems por permiso de módulo (`item.modulo ?? section.modulo`).
 *  2. Aplica las allow/deny lists específicas de cada rol "puro" (no Admin).
 *  3. Elimina las secciones que quedan sin ítems.
 *
 * El resultado se memoiza por `roles` + `esSuperAdmin`: navegar entre rutas
 * no recalcula el árbol (la ruta activa se resuelve aparte, en cada NavItem).
 */
export const useNavigation = (): NavModule[] => {
  const { tienePermiso, tieneRol, roles } = usePermisos();
  const { esSuperAdmin, esPlatformOwner } = useAuth();

  return useMemo(
    () =>
      navigation
        .map((section) => {
          let filteredItems = section.items.filter((item) =>
            tienePermiso(item.modulo ?? section.modulo),
          );

          // Si es la sección de ADMIN, filtrar items según el rol
          if (section.modulo === 'ADMIN' && !esSuperAdmin) {
            filteredItems = filteredItems.filter((item) => !superAdminOnlyPaths.includes(item.path));
          }

          // Herramientas de plataforma: solo el platform owner las ve en el menú.
          if (!esPlatformOwner) {
            filteredItems = filteredItems.filter((item) => !platformOwnerOnlyPaths.includes(item.path));
          }

          // Si el rol es puramente VENDEDOR (y no Admin), ocultar rutas específicas
          const isVendedor = !esSuperAdmin && !tieneRol('ADMIN') && tieneRol('VENDEDOR');
          if (isVendedor) {
            filteredItems = filteredItems.filter((item) => !vendedorDeniedPaths.includes(item.path));
          }

          // Si el rol es puramente COBRANZAS (y no Admin), aplicar allowlist estricta.
          const isCobranzasOnly = !esSuperAdmin && !tieneRol('ADMIN') && tieneRol('COBRANZAS');
          if (isCobranzasOnly) {
            filteredItems = filteredItems.filter((item) => cobranzasAllowedPaths.includes(item.path));
          }

          // Si el rol es puramente SUPERVISOR (y no Admin), aplicar allowlist estricta.
          // Su menú es la unión de VENDEDOR + COBRANZAS + TRANSPORTE + Métricas de Leads.
          const isSupervisorOnly = !esSuperAdmin && !tieneRol('ADMIN') && tieneRol('SUPERVISOR');
          if (isSupervisorOnly) {
            filteredItems = filteredItems.filter((item) => supervisorAllowedPaths.includes(item.path));
          }

          // Si el rol es puramente TRANSPORTE (y no Admin), aplicar allowlist estricta.
          const isTransporteOnly = !esSuperAdmin && !tieneRol('ADMIN') && tieneRol('TRANSPORTE');
          if (isTransporteOnly) {
            filteredItems = filteredItems.filter((item) => transporteAllowedPaths.includes(item.path));
          }

          // Si el rol es puramente CONDUCTOR (y no Admin), aplicar allowlist estricta:
          // sólo el módulo Transporte.
          const isConductorOnly = !esSuperAdmin && !tieneRol('ADMIN') && tieneRol('CONDUCTOR');
          if (isConductorOnly) {
            filteredItems = filteredItems.filter((item) => conductorAllowedPaths.includes(item.path));
          }

          // Si el rol es puramente TALLER (y no Admin), aplicar allowlist estricta.
          const isTallerOnly = !esSuperAdmin && !tieneRol('ADMIN') && tieneRol('TALLER');
          if (isTallerOnly) {
            filteredItems = filteredItems.filter((item) => tallerAllowedPaths.includes(item.path));
          }

          // Si el rol es puramente RECURSOS_HUMANOS (y no Admin), aplicar allowlist estricta.
          const isRrhhOnly = !esSuperAdmin && !tieneRol('ADMIN') && tieneRol('RECURSOS_HUMANOS');
          if (isRrhhOnly) {
            filteredItems = filteredItems.filter((item) => rrhhAllowedPaths.includes(item.path));
          }

          // ADMIN_EMPRESA_LIMITADO: admin "empleado" sin acceso a RRHH (ya filtrado
          // por módulo) ni a pantallas sensibles puntuales. Denylist específica.
          const isAdminEmpresaLimitado =
            !esSuperAdmin && !tieneRol('ADMIN') && tieneRol('ADMIN_EMPRESA_LIMITADO');
          if (isAdminEmpresaLimitado) {
            filteredItems = filteredItems.filter(
              (item) => !adminEmpresaLimitadoDeniedPaths.includes(item.path),
            );
          }

          const isCoordinadoraCompras =
            !esSuperAdmin && !tieneRol('ADMIN') && tieneRol('COORDINADORA_COMPRAS');
          if (isCoordinadoraCompras) {
            filteredItems = filteredItems.filter((item) =>
              coordinadoraComprasAllowedPaths.includes(item.path),
            );
          }

          const isCoordinadoraLogistica =
            !esSuperAdmin && !tieneRol('ADMIN') && tieneRol('COORDINADORA_LOGISTICA');
          if (isCoordinadoraLogistica) {
            filteredItems = filteredItems.filter((item) =>
              coordinadoraLogisticaAllowedPaths.includes(item.path),
            );
          }

          const isLogistico = !esSuperAdmin && !tieneRol('ADMIN') && tieneRol('LOGISTICO');
          if (isLogistico) {
            filteredItems = filteredItems.filter((item) => logisticoAllowedPaths.includes(item.path));
          }

          const isPostVenta = !esSuperAdmin && !tieneRol('ADMIN') && tieneRol('POST_VENTA');
          if (isPostVenta) {
            filteredItems = filteredItems.filter((item) => postVentaAllowedPaths.includes(item.path));
          }

          return { ...section, items: filteredItems };
        })
        .filter((section) => section.items.length > 0),
    // `tienePermiso` y `tieneRol` son puros sobre `roles`; basta con depender
    // de `roles` + `esSuperAdmin` para recomputar sólo cuando cambian.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [roles, esSuperAdmin, esPlatformOwner],
  );
};
