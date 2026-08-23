import { EstadoCuota } from '../../types/prestamo.types';
import type { EstadoPrestamo, CategoriaPrestamo } from '../../types/prestamo.types';
import { statusSx, type StatusRole } from '../../theme/statusRoles';

// Rol visual por estado de cuota. No usa roleForEstado porque PENDIENTE de
// cuota se muestra como informativo (azul), no como warning genérico.
// El mapa de colores literales legacy vive en prestamo.types.
export const CUOTA_ROLE: Record<EstadoCuota, StatusRole> = {
  [EstadoCuota.PENDIENTE]: 'info',
  [EstadoCuota.PAGADA]: 'success',
  [EstadoCuota.VENCIDA]: 'danger',
  [EstadoCuota.PARCIAL]: 'warning',
  [EstadoCuota.REFINANCIADA]: 'process',
  [EstadoCuota.PAGO_INFORMADO]: 'warning',
};

/** sx par fg/bg para un chip de estado de cuota. Estados desconocidos → neutral. */
export const cuotaEstadoSx = (estado: EstadoCuota | string) =>
  statusSx(CUOTA_ROLE[estado as EstadoCuota] ?? 'neutral');

// Rol visual por estado de préstamo. CANCELADO acá es neutral (gris legacy),
// distinto del CANCELADO genérico (danger) de roleForEstado.
export const PRESTAMO_ROLE: Record<EstadoPrestamo, StatusRole> = {
  ACTIVO: 'success',
  FINALIZADO: 'info',
  EN_MORA: 'warning',
  EN_LEGAL: 'danger',
  CANCELADO: 'neutral',
  REFINANCIADO: 'process',
} as Record<EstadoPrestamo, StatusRole>;

/** sx par fg/bg para un chip de estado de préstamo. */
export const prestamoEstadoSx = (estado: EstadoPrestamo | string) =>
  statusSx(PRESTAMO_ROLE[estado as EstadoPrestamo] ?? 'neutral');

// Rol visual por categoría (gradiente de severidad del motor; los pares que ya
// compartían color legacy comparten rol).
export const CATEGORIA_ROLE: Record<CategoriaPrestamo, StatusRole> = {
  NORMAL: 'success',
  LEGALES: 'danger',
  PAGO_CON_MORA: 'warning',
  ALTO_RIESGO: 'danger',
  CON_SEGUIMIENTO: 'warning',
  DUDOSO: 'warning',
  MOROSO: 'danger',
  IRRECUPERABLE: 'process',
} as Record<CategoriaPrestamo, StatusRole>;

/** sx par fg/bg para un chip de categoría de préstamo. */
export const categoriaPrestamoSx = (categoria: CategoriaPrestamo | string) =>
  statusSx(CATEGORIA_ROLE[categoria as CategoriaPrestamo] ?? 'neutral');
