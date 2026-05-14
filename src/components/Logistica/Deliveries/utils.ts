// FRONT-003: extracted from DeliveriesPage.tsx — pure helpers para
// estados de asignación de equipos.
import type { EstadoAsignacionEquipo } from '../../../types';

type ChipColor = 'default' | 'warning' | 'info' | 'secondary' | 'success';

/** Maps EstadoAsignacionEquipo → MUI Chip color. */
export const getEstadoAsignacionColor = (
  estado: EstadoAsignacionEquipo | null | undefined
): ChipColor => {
  if (!estado) return 'default';
  const colorMap: Record<EstadoAsignacionEquipo, ChipColor> = {
    DISPONIBLE: 'default',
    RESERVADO: 'warning',
    FACTURADO: 'info',
    EN_TRANSITO: 'secondary',
    ENTREGADO: 'success',
    PENDIENTE_TERMINACION: 'warning',
    EN_SERVICE: 'warning',
  };
  return colorMap[estado] || 'default';
};

/** Human label for an EstadoAsignacionEquipo. */
export const getEstadoAsignacionLabel = (
  estado: EstadoAsignacionEquipo | null | undefined
): string => {
  if (!estado) return 'No especificado';
  const labelMap: Record<EstadoAsignacionEquipo, string> = {
    DISPONIBLE: 'Disponible',
    RESERVADO: 'Reservado',
    FACTURADO: 'Facturado',
    EN_TRANSITO: 'En Transito',
    ENTREGADO: 'Entregado',
    PENDIENTE_TERMINACION: 'Pendiente Terminación',
    EN_SERVICE: 'En Service',
  };
  return labelMap[estado] || estado;
};
