import type { Theme } from '@mui/material/styles';
import type { StatusPalette, StatusTone } from './index';

// Visual roles for domain states. Components never choose a literal color for
// a state: they resolve the state to a role and read the pair from the theme.
//
// Usage in sx (preferred — resolves per scheme via CSS vars):
//   <Chip sx={statusSx('success')} label="ENTREGADO" />
// or manually:
//   sx={{ color: 'status.success.fg', bgcolor: 'status.success.bg' }}

export type StatusRole = keyof StatusPalette;

export const statusSx = (role: StatusRole) => ({
  color: `status.${role}.fg`,
  bgcolor: `status.${role}.bg`,
});

export const statusTone = (theme: Theme, role: StatusRole): StatusTone =>
  theme.palette.status[role];

// ---------------------------------------------------------------------------
// Domain state -> visual role
// ---------------------------------------------------------------------------
// Central mapping so the same state renders identically everywhere. Add new
// states here — never inline a color next to a state name in a component.
const DOMAIN_STATUS_ROLE: Record<string, StatusRole> = {
  // Genéricos de documentos / entregas / pagos
  PENDIENTE: 'warning',
  EN_PROCESO: 'process',
  EN_GESTION: 'process',
  EN_PREPARACION: 'process',
  COMPLETADO: 'success',
  COMPLETADA: 'success',
  ENTREGADO: 'success',
  ENTREGADA: 'success',
  PAGADO: 'success',
  PAGADA: 'success',
  CONFIRMADO: 'success',
  CONFIRMADA: 'success',
  ACTIVO: 'success',
  ACTIVA: 'success',
  APROBADO: 'success',
  APROBADA: 'success',
  EMITIDA: 'info',
  EMITIDO: 'info',
  INFORMADO: 'info',
  NUEVA: 'info',
  NUEVO: 'info',
  ANULADO: 'danger',
  ANULADA: 'danger',
  RECHAZADO: 'danger',
  RECHAZADA: 'danger',
  VENCIDO: 'danger',
  VENCIDA: 'danger',
  CANCELADO: 'danger',
  CANCELADA: 'danger',
  INACTIVO: 'neutral',
  INACTIVA: 'neutral',
  BORRADOR: 'neutral',
  CERRADA: 'neutral',
  CERRADO: 'neutral',
};

/** Resolve a domain state string to its visual role. Unknown states are neutral. */
export const roleForEstado = (estado: string | null | undefined): StatusRole =>
  DOMAIN_STATUS_ROLE[(estado ?? '').toUpperCase()] ?? 'neutral';

/** Convenience: sx pair straight from a domain state string. */
export const estadoSx = (estado: string | null | undefined) =>
  statusSx(roleForEstado(estado));
